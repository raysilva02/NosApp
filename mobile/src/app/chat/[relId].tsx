import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import {
  useAudioRecorder,
  RecordingPresets,
  createAudioPlayer,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { api, isNetworkError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { isOnline } from '../../offline/connectivity';
import { enviarAudio, localAudioUri } from '../../offline/audio';
import { enfileirarMensagem, filaPorRel, type FilaMensagem } from '../../offline/store';
import { useVoice } from '../../voice/voiceContext';
import type { Chat as ChatType, Mensagem } from '../../api/types';
import { colors } from '../../theme/colors';

const QUICK = [
  'Preciso de ajuda!',
  'Estou bem',
  'Venha para casa',
  'Estou com dor',
  'Preciso do remédio',
  'Estou com fome',
  'Obrigado!',
  'Estou com sono',
];

export default function Chat() {
  const { relId } = useLocalSearchParams<{ relId: string }>();
  const relIdNum = Number(relId);
  const router = useRouter();
  const { me } = useAuth();
  const { registrar } = useVoice();

  const [chat, setChat] = useState<ChatType | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pendentes, setPendentes] = useState<FilaMensagem[]>([]);
  const [input, setInput] = useState('');
  const [autoTTS, setAutoTTS] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [tocandoId, setTocandoId] = useState<number | null>(null);
  const [pausado, setPausado] = useState(false);
  const listRef = useRef<FlatList<Mensagem>>(null);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Libera o player ao sair da tela (evita áudio fantasma / vazamento de memória).
  useEffect(() => {
    return () => {
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const carregar = async () => {
    try {
      const c = await api<ChatType>(`/api/chat/${relIdNum}`);
      setChat(c);
      setMensagens(c.mensagens);
    } catch {
      /* ignora falhas pontuais de polling */
    }
  };

  // Registra a descrição da tela para o comando "lê pra mim".
  useEffect(() => {
    if (!chat) return;
    const ultima = mensagens[mensagens.length - 1];
    const resumo = ultima
      ? `Última mensagem: ${ultima.conteudo || 'mensagem de voz'}.`
      : 'Nenhuma mensagem ainda.';
    registrar({
      descricaoTela: `Conversa com ${chat.outroUsuarioNome}. ${resumo}`,
    });
  }, [chat, mensagens, registrar]);

  const carregarPendentes = async () => {
    setPendentes(await filaPorRel(relIdNum));
  };

  useEffect(() => {
    const tick = () => {
      void carregar();
      void carregarPendentes();
    };
    tick();
    const id = setInterval(tick, 2500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relIdNum]);

  const enviar = async (texto?: string, audioUrl?: string | null, audioLocalUri?: string | null) => {
    const v = (texto ?? input).trim();
    if (!v && !audioUrl && !audioLocalUri) return;
    setInput('');

    // Offline: enfileira e mostra na hora. Sincroniza quando voltar a rede.
    if (!isOnline()) {
      await enfileirarMensagem({ relId: relIdNum, conteudo: v || null, audioUrl: audioUrl ?? null, audioLocalUri: audioLocalUri ?? null });
      await carregarPendentes();
      return;
    }

    try {
      await api(`/api/chat/${relIdNum}/mensagens`, {
        method: 'POST',
        body: { conteudo: v, audioUrl: audioUrl ?? null },
      });
      await carregar();
      await carregarPendentes();
    } catch (e) {
      if (isNetworkError(e)) {
        // Rede caiu no meio do envio: não perde a mensagem.
        await enfileirarMensagem({ relId: relIdNum, conteudo: v || null, audioUrl: audioUrl ?? null, audioLocalUri: audioLocalUri ?? null });
        await carregarPendentes();
      } else {
        Alert.alert('Erro', 'Não consegui enviar a mensagem: ' + (e as Error).message);
      }
    }
  };

  const falar = (t: string) => Speech.speak(t, { language: 'pt-BR', rate: 0.95 });

  // ----- gravação de áudio -----
  const iniciarGravacao = async () => {
    try {
      const perm = await getRecordingPermissionsAsync();
      if (!perm.granted) {
        const pedido = await requestRecordingPermissionsAsync();
        if (!pedido.granted) {
          Alert.alert('Microfone', 'Preciso de permissão para gravar áudio. Libere nas configurações do app.');
          return;
        }
      }

      // Modo de áudio voltado para gravação (essencial no iOS; inofensivo no Android).
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setGravando(true);
    } catch (e) {
      setGravando(false);
      Alert.alert('Áudio', 'Não consegui iniciar a gravação: ' + (e as Error).message);
    }
  };

  const pararEEnviarGravacao = async () => {
    setGravando(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      console.log('[audio] uri gravada:', uri);
      if (!uri) {
        Alert.alert('Áudio', 'Não consegui gerar o áudio. Tente de novo.');
        return;
      }

      // Offline: guarda o arquivo local na fila para subir depois.
      if (!isOnline()) {
        await enfileirarMensagem({ relId: relIdNum, conteudo: null, audioUrl: null, audioLocalUri: uri });
        await carregarPendentes();
        return;
      }

      let url: string | null;
      try {
        url = await enviarAudio(uri);
      } catch (e) {
        // Falha de rede no upload: enfileira o áudio local para subir depois.
        if (isNetworkError(e)) {
          await enfileirarMensagem({ relId: relIdNum, conteudo: null, audioUrl: null, audioLocalUri: uri });
          await carregarPendentes();
          return;
        }
        throw e;
      }

      if (url) {
        await enviar('', url, null);
      } else {
        Alert.alert('Áudio', 'Falha ao enviar o áudio para o servidor.');
      }
    } catch (e) {
      Alert.alert('Áudio', 'Erro ao gravar: ' + (e as Error).message);
    }
  };

  // ----- reprodução de áudio -----
  const alternarAudio = async (m: Mensagem) => {
    if (!m.audioUrl) return;
    try {
      // A gravação deixa o modo de áudio em "recording"; volta para reprodução.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      const atual = playerRef.current;

      // Mesma mensagem: alterna entre pausar e retomar (sem recriar o player).
      if (tocandoId === m.id && atual) {
        if (atual.playing) {
          atual.pause();
          setPausado(true);
        } else {
          atual.play();
          setPausado(false);
        }
        return;
      }

      // Outra mensagem (ou primeira vez): libera o anterior e cria um novo.
      if (atual) {
        try { atual.pause(); atual.remove(); } catch { /* ignora */ }
      }

      // Resolve para arquivo local (cache) quando possível, permitindo
      // reproduzir offline áudios já baixados.
      const uri = await localAudioUri(m.audioUrl);
      const player = createAudioPlayer(uri);
      playerRef.current = player;
      setTocandoId(m.id);
      setPausado(false);
      player.play();
    } catch (e) {
      Alert.alert('Áudio', 'Não consegui reproduzir: ' + (e as Error).message);
    }
  };

  const renderBolha = (item: Mensagem) => {
    const isMe = item.remetenteId === me?.id;
    const temAudio = !!item.audioUrl;

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
        {temAudio ? (
          <Pressable
            onPress={() => alternarAudio(item)}
            style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, styles.audioBubble]}
          >
            <Text style={[styles.audioIcon, isMe && styles.msgTextMe]}>
              {tocandoId === item.id && !pausado ? '⏸' : '▶️'}
            </Text>
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>Áudio de voz</Text>
            <Text style={[styles.msgTime, isMe && styles.msgTextMe]}>{item.dataHora}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => falar(item.conteudo)}
            style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
          >
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.conteudo}</Text>
            <Text style={[styles.msgTime, isMe && styles.msgTextMe]}>{item.dataHora}</Text>
          </Pressable>
        )}
      </View>
    );
  };

  // Mensagens ainda não enviadas (offline) aparecem no rodapé, "enviando…".
  const renderPendente = (p: FilaMensagem) => (
    <View key={`pendente-${p.id}`} style={[styles.msgWrapper, styles.msgRight]}>
      <View style={[styles.bubble, styles.bubbleMe, p.audioLocalUri || p.audioUrl ? styles.audioBubble : null]}>
        {p.audioLocalUri || p.audioUrl ? (
          <Text style={[styles.audioIcon, styles.msgTextMe]}>🎤</Text>
        ) : null}
        <Text style={[styles.msgText, styles.msgTextMe]}>
          {p.audioLocalUri || p.audioUrl ? 'Áudio de voz' : p.conteudo}
        </Text>
        <Text style={[styles.msgTime, styles.msgTextMe]}>⏳ enviando…</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.headerName} numberOfLines={1}>
              {chat?.outroUsuarioNome ?? '…'}
            </Text>
            <Text style={styles.headerRole}>{chat?.isIdoso ? 'Cuidador(a)' : 'Idoso'}</Text>
          </View>
          <Pressable
            onPress={() => setAutoTTS((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Ler mensagens em voz alta"
            hitSlop={8}
          >
            <Text style={styles.tts}>{autoTTS ? '🔊' : '🔇'}</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={mensagens}
          keyExtractor={(m) => String(m.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => renderBolha(item)}
          ListFooterComponent={
            pendentes.length > 0 ? (
              <View>{pendentes.map(renderPendente)}</View>
            ) : undefined
          }
        />

        {chat?.isIdoso && (
          <View style={styles.quickArea}>
            <Text style={styles.quickTitle}>Mensagens rápidas</Text>
            <View style={styles.quickGrid}>
              {QUICK.map((q) => (
                <Pressable key={q} onPress={() => enviar(q)} style={styles.quickBtn}>
                  <Text style={styles.quickText} numberOfLines={1}>
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputArea}>
          <Pressable
            onPress={gravando ? pararEEnviarGravacao : iniciarGravacao}
            accessibilityRole="button"
            accessibilityLabel={gravando ? 'Parar gravação' : 'Gravar áudio'}
            style={[styles.micBtn, gravando && styles.micBtnAtivo]}
          >
            <Text style={styles.micText}>{gravando ? '⏹' : '🎤'}</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={gravando ? 'Gravando…' : 'Escreva uma mensagem...'}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => enviar()}
            returnKeyType="send"
            editable={!gravando}
          />
          <Pressable onPress={() => enviar()} accessibilityRole="button" accessibilityLabel="Enviar" style={styles.sendBtn}>
            <Text style={styles.sendText}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  back: { padding: 4 },
  backText: { color: colors.white, fontSize: 26, fontWeight: '700' },
  headerTitle: { flex: 1 },
  headerName: { color: colors.white, fontSize: 18, fontWeight: '800' },
  headerRole: { color: colors.white, fontSize: 14, opacity: 0.9 },
  tts: { fontSize: 24 },

  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  msgWrapper: { flexDirection: 'row' },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 17, lineHeight: 23, color: colors.text },
  msgTextMe: { color: colors.white },
  msgTime: { fontSize: 12, opacity: 0.7, textAlign: 'right', marginTop: 2, color: colors.textMuted },
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioIcon: { fontSize: 20 },

  quickArea: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.accentLight, padding: 12 },
  quickTitle: { fontSize: 14, fontWeight: '800', color: colors.accentDark, marginBottom: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  quickText: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  micBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnAtivo: { backgroundColor: colors.primaryDark },
  micText: { fontSize: 22 },
  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.white,
  },
  sendBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.white, fontSize: 24 },
});
