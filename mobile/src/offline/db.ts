import * as SQLite from 'expo-sqlite';

// Banco local usado como cache de leitura (dashboard, remédios, pacientes,
// chats) e fila de mensagens pendentes para sincronização offline.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('nos.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS fila_mensagens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rel_id INTEGER NOT NULL,
          conteudo TEXT,
          audio_url TEXT,
          audio_local_uri TEXT,
          criado_em INTEGER NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}
