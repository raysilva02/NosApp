// URL do backend .NET.
//
// - Emulador Android: 10.0.2.2 aponta para o "localhost" do seu computador.
// - Celular físico (Expo Go): troque para o IP do seu Mac na rede,
//   ex.: http://192.168.0.10:5076  (e rode o backend com --urls http://0.0.0.0:5076).
// - Alternativa: defina a variável EXPO_PUBLIC_API_URL no ambiente.

const envUrl = (
  globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }
)?.process?.env?.EXPO_PUBLIC_API_URL;

export const API_URL = envUrl ?? 'http://192.168.0.7:5076';
