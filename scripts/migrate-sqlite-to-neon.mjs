import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { createSchemaStatements } from "../lib/db-schema.mjs";
import nextEnv from "@next/env";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const batchSize = 50;
const sourcePath = resolve(process.env.DATABASE_PATH || "data/rehnuma.sqlite");
const execute = process.argv.includes("--execute");

function readRows(database, query) {
  return database.prepare(query).all();
}

async function insertInBatches(sql, rows, buildQuery) {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const queries = rows.slice(offset, offset + batchSize).map(buildQuery);
    await sql.transaction(queries);
  }
}

async function migrate() {
  if (!existsSync(sourcePath)) {
    throw new Error(`SQLite source database not found at ${sourcePath}. Set DATABASE_PATH to its location.`);
  }

  const database = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    const tables = new Set(
      database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
    );
    const requiredTables = ["app_users", "user_preferences", "chat_sessions", "chat_messages"];
    const missingTables = requiredTables.filter((table) => !tables.has(table));
    if (missingTables.length) {
      throw new Error(`SQLite schema is incomplete. Missing tables: ${missingTables.join(", ")}.`);
    }

    const users = readRows(database, "SELECT id, name, email, password_hash, created_at FROM app_users");
    const preferences = readRows(database, "SELECT user_id, trip_updates, safety_alerts FROM user_preferences");
    const sessions = readRows(database, "SELECT id, user_id, title, created_at, updated_at FROM chat_sessions");
    const messages = readRows(database, "SELECT id, session_id, role, content, sources, created_at FROM chat_messages");
    console.log(`Source rows: ${users.length} users, ${preferences.length} preferences, ${sessions.length} conversations, ${messages.length} messages.`);

    if (!execute) {
      console.log("Dry run only. Review the counts, then rerun with --execute to copy data.");
      return;
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL must be set in the environment before running with --execute.");
    }

    const sql = neon(connectionString);
    for (const statement of createSchemaStatements(sql)) await statement;

    await insertInBatches(sql, users, (user) => sql`
      INSERT INTO app_users (id, name, email, password_hash, created_at)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${user.password_hash}, ${user.created_at})
      ON CONFLICT(id) DO NOTHING
    `);
    await insertInBatches(sql, preferences, (preference) => sql`
      INSERT INTO user_preferences (user_id, trip_updates, safety_alerts)
      VALUES (${preference.user_id}, ${Boolean(preference.trip_updates)}, ${Boolean(preference.safety_alerts)})
      ON CONFLICT(user_id) DO NOTHING
    `);
    await insertInBatches(sql, sessions, (session) => sql`
      INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
      VALUES (${session.id}, ${session.user_id}, ${session.title}, ${session.created_at}, ${session.updated_at})
      ON CONFLICT(id) DO NOTHING
    `);
    await insertInBatches(sql, messages, (message) => sql`
      INSERT INTO chat_messages (id, session_id, role, content, sources, created_at)
      VALUES (${message.id}, ${message.session_id}, ${message.role}, ${message.content}, ${message.sources}, ${message.created_at})
      ON CONFLICT(id) DO NOTHING
    `);

    console.log("SQLite data was copied to Neon. The source database was left unchanged.");
  } finally {
    database.close();
  }
}

migrate().catch((error) => {
  console.error("SQLite-to-Neon migration failed:", error instanceof Error ? error.message : "Unexpected error.");
  process.exitCode = 1;
});
