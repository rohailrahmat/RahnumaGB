import Database from "better-sqlite3";
import { join } from "node:path";

type DatabaseSql = (strings: TemplateStringsArray, ...values: unknown[]) => Record<string, unknown>[];

let client: DatabaseSql | undefined;
let schemaPromise: Promise<void> | undefined;

export function getSql() {
  client ??= createSqliteAdapter();
  return client;
}

function createSqliteAdapter(): DatabaseSql {
  const databasePath = process.env.DATABASE_PATH || join(
    process.env.VERCEL ? "/tmp" : join(process.cwd(), "data"),
    "rehnuma.sqlite",
  );
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");

  return (strings, ...values) => {
    const statementText = strings.reduce((query, part, index) => query + (index ? `?${part}` : part), "");
    const statement = database.prepare(statementText);
    if (statement.reader) return statement.all(...(values as never[])) as Record<string, unknown>[];
    statement.run(...(values as never[]));
    return [];
  };
}

export async function ensureSchema() {
  if (!schemaPromise) schemaPromise = createSchema(getSql());
  return schemaPromise;
}

async function createSchema(sql: DatabaseSql) {
  await sql`CREATE TABLE IF NOT EXISTS app_users (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`;
  await sql`CREATE TABLE IF NOT EXISTS chat_sessions (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title text NOT NULL DEFAULT 'New journey',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`;
  await sql`CREATE TABLE IF NOT EXISTS chat_messages (
    id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    sources TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`;
  await sql`CREATE INDEX IF NOT EXISTS chat_sessions_user_updated_idx ON chat_sessions(user_id, updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id, created_at)`;
}