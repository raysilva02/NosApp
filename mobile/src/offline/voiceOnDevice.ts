import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

// Serviço de reconhecimento on-device do Google (Android 13+).
const ON_DEVICE_SERVICE = 'com.google.android.as';
const LOCALE = 'pt-BR';

let modeloVerificado = false;
let modeloDisponivel = false;

/** O aparelho suporta reconhecimento on-device (Android 13+, iOS 17+). */
export function suportaOnDevice(): boolean {
  try {
    return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  } catch {
    return false;
  }
}

/** O modelo de voz pt-BR já está instalado para uso offline. */
export function temModeloOnDevice(): boolean {
  return modeloDisponivel;
}

/**
 * Verifica se o modelo offline pt-BR está instalado e, se não estiver e o
 * aparelho suportar, dispara o download. Idempotente e defensivo: qualquer
 * falha apenas desativa o modo offline (o reconhecimento continua pela rede).
 *
 * Android 13: abre o diálogo de download do sistema (fire-and-forget).
 * Android 14+: baixa imediatamente ou agenda para quando houver WiFi.
 */
export async function garantirModeloOnDevice(): Promise<boolean> {
  if (Platform.OS === 'ios') return false; // iOS usa reconhecimento por rede (Siri)

  if (!suportaOnDevice()) {
    modeloVerificado = true;
    modeloDisponivel = false;
    return false;
  }

  try {
    const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({
      androidRecognitionServicePackage: ON_DEVICE_SERVICE,
    });
    const tem = installedLocales.some((l) => l.toLowerCase().startsWith('pt'));
    modeloDisponivel = tem;
    modeloVerificado = true;

    if (!tem) {
      // Baixa em background; não bloqueia o app.
      const r = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({
        locale: LOCALE,
      });
      console.log('[voz] download do modelo on-device:', r.status);
    }
    return tem;
  } catch (e) {
    console.warn('[voz] não foi possível preparar o modelo on-device:', e);
    modeloVerificado = true;
    modeloDisponivel = false;
    return false;
  }
}

/**
 * Opções de `start()` que preferem reconhecimento on-device quando o modelo
 * está disponível, caindo para reconhecimento por rede caso contrário.
 */
export function opcoesReconhecimento() {
  const usarOnDevice = Platform.OS === 'android' && modeloDisponivel;
  return {
    lang: LOCALE,
    interimResults: false,
    continuous: false,
    // Só força on-device se o modelo já estiver instalado; do contrário, o
    // Google tenta por rede (exige internet) — comportamento atual.
    requiresOnDeviceRecognition: usarOnDevice,
    ...(usarOnDevice ? { androidRecognitionServicePackage: ON_DEVICE_SERVICE } : {}),
  };
}

/**
 * Tenta reconhecer offline primeiro: se o modelo ainda não foi verificado,
 * verifica/baixa agora e devolve se dá para usar on-device.
 */
export async function prepararReconhecimentoOffline(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!modeloVerificado) {
    await garantirModeloOnDevice();
  }
  return modeloDisponivel;
}
