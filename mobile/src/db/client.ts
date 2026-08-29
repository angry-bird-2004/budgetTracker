import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'budget-tracker.db';

let sqlite: SQLiteDatabase | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initialized = false;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS envelopes (
  client_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  name TEXT NOT NULL,
  allocated_amount REAL NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS envelopes_server_id ON envelopes(server_id);

CREATE TABLE IF NOT EXISTS income_envelopes (
  client_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  name TEXT NOT NULL,
  allocated_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS income_envelopes_server_id ON income_envelopes(server_id);

CREATE TABLE IF NOT EXISTS transactions (
  client_id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  envelope_client_id TEXT,
  income_client_id TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  purpose TEXT,
  tax_percentage REAL,
  tax_amount REAL,
  tax_application TEXT,
  date TEXT NOT NULL,
  update_logs TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS transactions_server_id ON transactions(server_id);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_page_size INTEGER NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  op TEXT NOT NULL,
  client_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS id_map (
  entity TEXT NOT NULL,
  client_id TEXT NOT NULL,
  server_id TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS id_map_entity_client ON id_map(entity, client_id);

CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_server_time TEXT
);
`;

export const getSqlite = () => {
  if (!sqlite) {
    sqlite = openDatabaseSync(DB_NAME);
  }
  return sqlite;
};

export const getDb = () => {
  if (!db) {
    db = drizzle(getSqlite(), { schema });
  }
  return db;
};

export const initDatabase = async () => {
  if (initialized) return getDb();
  try {
    const database = getSqlite();
    await database.execAsync(SCHEMA_SQL);
    initialized = true;
    return getDb();
  } catch (error) {
    console.warn('Failed to initialize SQLite', error);
    throw error;
  }
};

export const clearLocalDatabase = async () => {
  const database = getSqlite();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM envelopes;
    DELETE FROM income_envelopes;
    DELETE FROM settings;
    DELETE FROM outbox;
    DELETE FROM id_map;
    DELETE FROM sync_state;
  `);
};
