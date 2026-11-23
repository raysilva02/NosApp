import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import * as Speech from 'expo-speech';
import { api } from '../api/client';
import { colors } from '../theme/colors';

const dizer = (texto: string) => Speech.speak(texto, { language: 'pt-BR', rate: 0.95 });

/**
 * Botão de emergência (SOS) — visível apenas para o idoso. Ao ser tocado,
 * pede confirmação e envia "Socorro!" para todos os cuidadores vinculados.
 * Grande e de alto contraste, pensado para situações de emergência.
 */
export function SosButton() {
  const [enviando, setEnviando] = useState(false);

  const enviarSos = async () => {
    setEnviando(true);
    try {
      await api('/api/chat/sos', {
        method: 'POST',
        body: { conteudo: 'Socorro! Estou passando mal e preciso de ajuda.' },
      });
      dizer('Socorro enviado aos seus cuidadores.');
      Alert.alert('Socorro enviado', 'Seus cuidadores foram avisados.');
    } catch (e) {
      dizer('Não consegui enviar o socorro.');
      Alert.alert('Erro', 'Não consegui enviar o socorro: ' + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = () => {
    Alert.alert(
      'Enviar socorro?',
      'Isso avisa todos os seus cuidadores.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar SOS', style: 'destructive', onPress: enviarSos },
      ]
    );
  };

  return (
    <Pressable
      onPress={confirmar}
      disabled={enviando}
      accessibilityRole="button"
      accessibilityLabel="Pedir socorro"
      style={({ pressed }) => [styles.btn, (pressed || enviando) && styles.btnPressed]}
    >
      {enviando ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          <Text style={styles.titulo}>SOS</Text>
          <Text style={styles.sub}>Pedir socorro</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: colors.primaryDark,
  },
  btnPressed: { opacity: 0.75 },
  titulo: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
  },
  sub: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
});
