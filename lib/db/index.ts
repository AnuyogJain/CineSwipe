import "server-only";

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

type AppDatabase = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  libsql?: Client;
  db?: AppDatabase;
};

function getTursoConfig(): { url: string; authToken: string } {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url || !authToken) {
    throw new Error(
      "Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (or Vercel env).",
    );
  }
  return { url, authToken };
}

function initDb(): AppDatabase {
  if (!globalForDb.db) {
    const client = createClient(getTursoConfig());
    globalForDb.libsql = client;
    globalForDb.db = drizzle(client, { schema });
  }
  return globalForDb.db;
}

/** Lazy Turso client — connects on first query, not at import time. */
export const db = new Proxy({} as AppDatabase, {
  get(_target, prop, receiver) {
    const real = initDb();
    const value = Reflect.get(real as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
});
