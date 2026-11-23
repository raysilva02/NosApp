import { API_URL } from './config';
import { setOnline } from '../offline/connectivity';

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function getToken() {
  return token;
}

export class ApiError extends Error {}

/** Distingue erro de rede (offline/timeout) de erro de API (status HTTP). */
export function isNetworkError(e: unknown): boolean {
  return e instanceof Error && e.name === 'NetworkError';
}

/**
 * Wrapper de fetch para a API. Envia Authorization: Bearer e traduz erros.
 * Marca online/offline conforme o resultado para o modo offline-first.
 */
export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const method = (opts.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body });
  } catch {
    setOnline(false);
    const err = new Error('Sem conexão com o servidor. Verifique sua internet.');
    err.name = 'NetworkError';
    throw err;
  }

  // Resposta HTTP recebida => há rede (mesmo que a API responda erro).
  setOnline(true);

  if (res.status === 401 || !res.ok) {
    let msg = res.status === 401 ? 'Sessão expirada. Entre novamente.' : 'Algo deu errado. Tente novamente.';
    try {
      const j = await res.json();
      if (j && j.erro) msg = j.erro;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(msg);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : (res.text() as unknown as T);
}
