import type Database from "better-sqlite3";

function columnNames(sqlite: Database.Database, table: string): Set<string> {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return new Set(rows.map((r) => r.name));
}

function tableExists(sqlite: Database.Database, table: string): boolean {
  const row = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
    )
    .get(table) as { name: string } | undefined;
  return Boolean(row);
}

function migrateImportedRatings(sqlite: Database.Database) {
  const cols = columnNames(sqlite, "imported_ratings");
  if (cols.has("user_id")) return;

  if (tableExists(sqlite, "imported_ratings_new")) {
    sqlite.exec(`DROP TABLE imported_ratings_new;`);
  }

  sqlite.exec(`
    CREATE TABLE imported_ratings_new (
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
    INSERT INTO imported_ratings_new (
      user_id, imdb_id, tmdb_id, title, original_title, your_rating, imdb_rating,
      imdb_votes, genres, directors, year, runtime, title_type, date_rated, url
    )
    SELECT
      'legacy', imdb_id, tmdb_id, title, original_title, your_rating, imdb_rating,
      imdb_votes, genres, directors, year, runtime, title_type, date_rated, url
    FROM imported_ratings;
    DROP TABLE imported_ratings;
    ALTER TABLE imported_ratings_new RENAME TO imported_ratings;
  `);
}

function migrateSwipeActions(sqlite: Database.Database) {
  const cols = columnNames(sqlite, "swipe_actions");
  if (cols.has("user_id")) return;
  sqlite.exec(`
    ALTER TABLE swipe_actions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy';
  `);
}

function migrateTasteProfile(sqlite: Database.Database) {
  const cols = columnNames(sqlite, "taste_profile");
  if (cols.has("user_id")) return;
  sqlite.exec(`
    ALTER TABLE taste_profile ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy';
  `);
}

export function migrateUserScope(sqlite: Database.Database) {
  migrateImportedRatings(sqlite);
  migrateSwipeActions(sqlite);
  migrateTasteProfile(sqlite);
}
