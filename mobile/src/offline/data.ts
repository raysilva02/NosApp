import { api } from '../api/client';
import { cacheGet, cacheSet } from './store';

export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

/**
 * Busca um endpoint com fallback offline: tenta a rede e grava em cache; se
 * falhar (rede), devolve o último valor em cache. Se não houver cache, relança
 * o erro original para a tela mostrar a mensagem.
 */
export async function getCached<T>(path: string, cacheKey: string): Promise<CacheResult<T>> {
  try {
    const data = await api<T>(path);
    await cacheSet(cacheKey, data);
    return { data, fromCache: false };
  } catch (e) {
    const cached = await cacheGet<T>(cacheKey);
    if (cached) return { data: cached, fromCache: true };
    throw e;
  }
}
