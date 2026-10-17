import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import * as schema from "./schema";
import { migrateAuth } from "./migrate-auth";
import { migrateUserScope } from "./migrate-user-scope";

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getDbPath() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return join(dataDir, "app.db");
}

function initSqlite() {
  if (!globalForDb.sqlite) {
    const sqlite = new Database(getDbPath());
    sqlite.pragma("journal_mode = WAL");
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS imported_ratings (
        user_id TEXT NOT NULL DEFAULT 'legacy',
        imdb_id TEXT NOT NULL,
        tmdb_id INTEGER,
        title TEXT NOT NULL,
        original_title TEXT,
        your_rating REAL,
        imdb_rating REAL,
        imdb_votes INTEGER,
        genres TEXT,
        directors TEXT,
        year INTEGER,
        runtime INTEGER,
        title_type TEXT,
        date_rated TEXT,
        url TEXT,
        PRIMARY KEY (user_id, imdb_id)
      );
      CREATE TABLE IF NOT EXISTS swipe_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'legacy',
        tmdb_id INTEGER NOT NULL,
        imdb_id TEXT,
        title TEXT NOT NULL,
        action TEXT NOT NULL,
        match_score REAL,
        payload TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS movie_cache (
        tmdb_id INTEGER PRIMARY KEY,
        imdb_id TEXT,
        payload TEXT NOT NULL,
        imdb_rating REAL,
        imdb_votes TEXT,
        fetched_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS taste_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'legacy',
        genres TEXT NOT NULL,
        directors TEXT NOT NULL,
        cast TEXT NOT NULL,
        decades TEXT NOT NULL,
        avg_runtime REAL NOT NULL,
        title_type_bias TEXT NOT NULL,
        genre_penalties TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    migrateUserScope(sqlite);
    migrateAuth(sqlite);
    globalForDb.sqlite = sqlite;
    globalForDb.db = drizzle(sqlite, { schema });
  }
  return globalForDb.db!;
}

export const db = initSqlite();
