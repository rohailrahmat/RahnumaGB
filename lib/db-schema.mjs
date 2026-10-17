export function createSchemaStatements(sql) {
  return [
    sql`CREATE TABLE IF NOT EXISTS app_users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    sql`CREATE TABLE IF NOT EXISTS user_preferences (
      user_id text PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      trip_updates BOOLEAN NOT NULL DEFAULT TRUE,
      safety_alerts BOOLEAN NOT NULL DEFAULT TRUE
    )`,
    sql`CREATE TABLE IF NOT EXISTS chat_sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      title text NOT NULL DEFAULT 'New journey',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    sql`CREATE TABLE IF NOT EXISTS chat_messages (
      id text PRIMARY KEY,
      session_id text NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('user', 'assistant')),
      content text NOT NULL,
      sources TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    sql`CREATE INDEX IF NOT EXISTS chat_sessions_user_updated_idx ON chat_sessions(user_id, updated_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id, created_at)`,
  ];
}
