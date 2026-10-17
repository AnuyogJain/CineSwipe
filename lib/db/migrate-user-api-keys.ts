import type Database from "better-sqlite3";

function tableExists(sqlite: Database.Database, table: string): boolean {
  const row = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    )
    .get(table) as { name: string } | undefined;
  return Boolean(row);
}

/** One-time: move legacy global TMDB/OMDb keys into each user row. */
export function migrateUserApiKeys(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      tmdb_api_key TEXT,
      omdb_api_key TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  if (!tableExists(sqlite, "app_settings") || !tableExists(sqlite, "users")) {
    return;
  }

  const tmdb = sqlite
    .prepare("SELECT value FROM app_settings WHERE key = 'tmdb_api_key' LIMIT 1")
    .get() as { value: string } | undefined;
  const omdb = sqlite
    .prepare("SELECT value FROM app_settings WHERE key = 'omdb_api_key' LIMIT 1")
    .get() as { value: string } | undefined;

  if (tmdb?.value || omdb?.value) {
    const now = Date.now();
    const users = sqlite.prepare("SELECT id FROM users").all() as { id: string }[];
    const insert = sqlite.prepare(`
      INSERT INTO user_api_keys (user_id, tmdb_api_key, omdb_api_key, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `);
    for (const user of users) {
      insert.run(user.id, tmdb?.value ?? null, omdb?.value ?? null, now);
    }
    sqlite.exec(`
      DELETE FROM app_settings WHERE key IN ('tmdb_api_key', 'omdb_api_key');
    `);
  }
}
