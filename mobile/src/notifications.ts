import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api/client';

// Mostra a notificação mesmo com o app aberto em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function garantirCanal() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('mensagens', {
      name: 'Mensagens',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C62828',
    });
  } catch (e) {
    // No Expo Go o canal não existe (NullPointerException) — esperado, ignora.
    console.warn('[push] canal não configurado (normal no Expo Go):', e);
  }
}

/**
 * Pede permissão (se ainda não tiver) e registra o token de push do Expo no
 * backend. Idempotente no servidor, então pode ser chamado a cada abertura.
 */
export async function registrarPushExpo() {
  try {
    await garantirCanal();

    // Não pede de novo se já foi concedido (evita duplicar o prompt).
    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    console.log('[push] permissão:', status);
    if (status !== 'granted') return;

    // projectId explícito: sem ele o token pode sair inválido/errado.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = (await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )).data;
    console.log('[push] token:', token);

    await api('/api/push-expo/registrar', { method: 'POST', body: { token } });
    console.log('[push] token registrado no backend ✅');
  } catch (e) {
    // Log detalhado: ajuda a enxergar falha de FCM/permissão no Metro.
    console.warn('[push] ERRO ao registrar:', e);
  }
}
