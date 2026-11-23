import { getDb } from './db';

// ---------- Cache genérico (leitura) ----------

export async function cacheSet(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO cache (key, value, updated_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    key,
    JSON.stringify(value),
    Date.now()
  );
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM cache WHERE key = ?',
    key
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

// ---------- Fila de mensagens (sincronização offline) ----------

export interface FilaMensagem {
  id: number;
  relId: number;
  conteudo: string | null;
  audioUrl: string | null;
  audioLocalUri: string | null;
  criadoEm: number;
}

export async function enfileirarMensagem(input: {
  relId: number;
  conteudo?: string | null;
  audioUrl?: string | null;
  audioLocalUri?: string | null;
}): Promise<FilaMensagem> {
  const db = await getDb();
  const agora = Date.now();
  const r = await db.runAsync(
    'INSERT INTO fila_mensagens (rel_id, conteudo, audio_url, audio_local_uri, criado_em) VALUES (?, ?, ?, ?, ?)',
    input.relId,
    input.conteudo ?? null,
    input.audioUrl ?? null,
    input.audioLocalUri ?? null,
    agora
  );
  return {
    id: r.lastInsertRowId,
    relId: input.relId,
    conteudo: input.conteudo ?? null,
    audioUrl: input.audioUrl ?? null,
    audioLocalUri: input.audioLocalUri ?? null,
    criadoEm: agora,
  };
}

export async function listarFila(): Promise<FilaMensagem[]> {
  const db = await getDb();
  return db.getAllAsync<FilaMensagem>(
    'SELECT id, rel_id AS relId, conteudo, audio_url AS audioUrl, ' +
      'audio_local_uri AS audioLocalUri, criado_em AS criadoEm ' +
      'FROM fila_mensagens ORDER BY id'
  );
}

export async function filaPorRel(relId: number): Promise<FilaMensagem[]> {
  const db = await getDb();
  return db.getAllAsync<FilaMensagem>(
    'SELECT id, rel_id AS relId, conteudo, audio_url AS audioUrl, ' +
      'audio_local_uri AS audioLocalUri, criado_em AS criadoEm ' +
      'FROM fila_mensagens WHERE rel_id = ? ORDER BY id',
    relId
  );
}

export async function removerDaFila(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM fila_mensagens WHERE id = ?', id);
}

// Limpa cache + fila (usado no logout, para não vazar dados entre contas).
export async function limparOffline(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cache');
  await db.runAsync('DELETE FROM fila_mensagens');
}
