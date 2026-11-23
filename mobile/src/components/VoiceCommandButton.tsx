import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useAuth } from '../auth/AuthContext';
import { garantirModeloOnDevice, opcoesReconhecimento } from '../offline/voiceOnDevice';

/**
 * Botão de comando de voz (STT) no cabeçalho.
 * Espelha o comportamento do PWA web (client/src/components/Header.tsx):
 * escuta "remédio", "sair", "paciente" e "início" para navegar por fala.
 */
export function VoiceCommandButton() {
  const router = useRouter();
  const { me, logout } = useAuth();
  const [ouvindo, setOuvindo] = useState(false);
  const transcriptRef = useRef('');

  const dizer = (texto: string) => Speech.speak(texto, { language: 'pt-BR', rate: 0.95 });

  // Prepara o modelo de voz on-device (Android) em background, sem bloquear.
  useEffect(() => {
    void garantirModeloOnDevice();
  }, []);

  const processar = (texto: string) => {
    const t = texto.toLowerCase();
    if (/remedio|remédio/.test(t)) {
      dizer('Abrindo remédios.');
      router.push('/remedios');
    } else if (/sair|logout|encerrar/.test(t)) {
      dizer('Saindo.');
      logout();
    } else if (/paciente/.test(t) && me?.tipoUsuario === 'Cuidador') {
      dizer('Abrindo pacientes.');
      router.push('/pacientes');
    } else if (/inicio|início|menu|home/.test(t)) {
      dizer('Voltando ao início.');
      router.replace('/');
    } else {
      dizer('Comando não reconhecido.');
    }
  };

  useSpeechRecognitionEvent('start', () => setOuvindo(true));
  useSpeechRecognitionEvent('end', () => {
    setOuvindo(false);
    const texto = transcriptRef.current;
    transcriptRef.current = '';
    if (texto) processar(texto);
  });
  useSpeechRecognitionEvent('result', (event) => {
    transcriptRef.current = event.results[0]?.transcript ?? '';
  });
  useSpeechRecognitionEvent('error', (event) => {
    setOuvindo(false);
    dizer('Não consegui ouvir. Tente de novo.');
    console.warn('[voz] erro de reconhecimento:', event.error, event.message);
  });

  const alternar = async () => {
    if (ouvindo) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        dizer('Preciso de permissão para ouvir.');
        return;
      }
      dizer('Diga um comando.');
      ExpoSpeechRecognitionModule.start(opcoesReconhecimento());
    } catch (e) {
      setOuvindo(false);
      dizer('Não consegui ouvir.');
      console.warn('[voz] erro ao iniciar:', e);
    }
  };

  return (
    <Pressable
      onPress={alternar}
      accessibilityRole="button"
      accessibilityLabel={ouvindo ? 'Ouvindo' : 'Comando de voz'}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, (pressed || ouvindo) && styles.btnAtivo]}
    >
      <Text style={styles.icone}>{ouvindo ? '🔴' : '🎤'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  btnAtivo: { backgroundColor: 'rgba(255,255,255,0.2)' },
  icone: { fontSize: 22 },
});
