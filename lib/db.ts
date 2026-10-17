import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { join } from "node:path";
import { createSchemaStatements } from "@/lib/db-schema.mjs";

type DatabaseSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

let client: DatabaseSql | undefined;
let schemaPromise: Promise<void> | undefined;

export function getSql() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString && process.env.VERCEL) {
      throw new Error("Set DATABASE_URL to a persistent PostgreSQL database in the Vercel project environment.");
    }
    client = connectionString ? createNeonAdapter(connectionString) : createSqliteAdapter();
  }
  return client;
}

function createNeonAdapter(connectionString: string): DatabaseSql {
  const sql = neon(connectionString);
  return async (strings, ...values) => sql(strings, ...values);
}

function createSqliteAdapter(): DatabaseSql {
  const databasePath = process.env.DATABASE_PATH || join(
    process.cwd(),
    "data",
    "rehnuma.sqlite",
  );
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");

  return async (strings, ...values) => {
    const statementText = strings.reduce((query, part, index) => query + (index ? `?${part}` : part), "");
    const statement = database.prepare(statementText);
    const sqliteValues = values.map((value) => typeof value === "boolean" ? Number(value) : value);
    if (statement.reader) return statement.all(...(sqliteValues as never[])) as Record<string, unknown>[];
    statement.run(...(sqliteValues as never[]));
    return [];
  };
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema(getSql()).catch((error: unknown) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

async function createSchema(sql: DatabaseSql) {
  for (const statement of createSchemaStatements(sql)) await statement;
}