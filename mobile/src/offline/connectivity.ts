import * as Network from 'expo-network';

// Estado global de conectividade.
//
// Regra importante: NÃO usamos `isInternetReachable` do expo-network. Ele é
// pouco confiável (retorna false em VPN/captive portal mesmo com internet).
// Em vez disso:
//   - `isConnected === false`  => sem rede física (offline definitivo).
//   - resultado de `api()`      => decide se o backend está alcançável
//     (sucesso => online; erro de rede => offline). É a fonte da verdade.
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
  const aplicar = (s: Network.NetworkState) => {
    if (s.isConnected === false) {
      setOnline(false); // sem rede física
    } else if (s.isConnected === true) {
      setOnline(true); // voltou a ter rede; o api() confirma/corrige
    }
    // isConnected indefinido: não decide nada — deixa o api() resolver.
  };

  Network.getNetworkStateAsync().then(aplicar).catch(() => {});
  Network.addNetworkStateListener(aplicar);
}
