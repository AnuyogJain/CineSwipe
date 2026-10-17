import type Database from "better-sqlite3";

function tableExists(sqlite: Database.Database, table: string): boolean {
  const row = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    )
    .get(table) as { name: string } | undefined;
  return Boolean(row);
}

export function migrateAuth(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS user_backups (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      payload TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL
    );
  `);

  if (tableExists(sqlite, "imported_ratings")) {
    sqlite.exec(`
      DELETE FROM imported_ratings WHERE user_id = 'legacy' OR user_id NOT IN (SELECT id FROM users);
      DELETE FROM swipe_actions WHERE user_id = 'legacy' OR user_id NOT IN (SELECT id FROM users);
      DELETE FROM taste_profile WHERE user_id = 'legacy' OR user_id NOT IN (SELECT id FROM users);
      DELETE FROM app_settings WHERE key = 'legacy_user_data_claimed';
    `);
  }
}
