import * as Network from 'expo-network';

// Estado global de conectividade, alimentado pelo listener do expo-network e
// também pela observação dos resultados do wrapper `api` (sucesso/erro de rede).
// "online" = internet alcançável; usamos `isInternetReachable` quando disponível.
let online = true;
let listeners: ((online: boolean) => void)[] = [];

export function isOnline(): boolean {
  return online;
}

export function setOnline(v: boolean) {
  if (online === v) return;
  online = v;
  for (const fn of listeners) fn(v);
}

/** Registra um callback chamado sempre que a conectividade muda. */
export function onConnectivityChange(fn: (online: boolean) => void): () => void {
  listeners.push(fn);
  fn(online);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}

export function initConnectivity() {
  Network.getNetworkStateAsync().then((s) => {
    setOnline(s.isConnected !== false && s.isInternetReachable !== false);
  });
  Network.addNetworkStateListener((s) => {
    setOnline(s.isConnected !== false && s.isInternetReachable !== false);
  });
}
