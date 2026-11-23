import { useAuth } from '../store/useAuth';

const TOKEN_KEY = 'nos_token';

let token: string | null = null;
try {
  token = localStorage.getItem(TOKEN_KEY);
} catch {
  token = null;
}

export function setToken(t: string | null) {
  token = t;
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage indisponível */
  }
}

export function getToken() {
  return token;
}

/**
 * Wrapper de fetch para a API. Envia Authorization: Bearer e traduz erros.
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

  const res = await fetch(path, { method, headers, body, credentials: 'same-origin' });

  if (res.status === 401) {
    setToken(null);
    useAuth.getState().setMe(null);
    window.location.hash = '#/login';
    throw new Error('nao-autenticado');
  }
  if (!res.ok) {
    let msg = 'Algo deu errado. Tente novamente.';
    try {
      const j = await res.json();
      if (j.erro) msg = j.erro;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : (res.text() as unknown as T);
}

export async function loadMe() {
  if (!getToken()) {
    useAuth.getState().setMe(null);
    return;
  }
  try {
    const r = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'same-origin',
    });
    useAuth.getState().setMe(r.ok ? await r.json() : null);
  } catch {
    useAuth.getState().setMe(null);
  }
}
