import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const importedRatings = sqliteTable("imported_ratings", {
  imdbId: text("imdb_id").primaryKey(),
  tmdbId: integer("tmdb_id"),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  yourRating: real("your_rating"),
  imdbRating: real("imdb_rating"),
  imdbVotes: integer("imdb_votes"),
  genres: text("genres"),
  directors: text("directors"),
  year: integer("year"),
  runtime: integer("runtime"),
  titleType: text("title_type"),
  dateRated: text("date_rated"),
  url: text("url"),
});

export const swipeActions = sqliteTable("swipe_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdbId: integer("tmdb_id").notNull(),
  imdbId: text("imdb_id"),
  title: text("title").notNull(),
  action: text("action", { enum: ["pass", "like", "wishlist"] }).notNull(),
  matchScore: real("match_score"),
  payload: text("payload"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const movieCache = sqliteTable("movie_cache", {
  tmdbId: integer("tmdb_id").primaryKey(),
  imdbId: text("imdb_id"),
  payload: text("payload").notNull(),
  imdbRating: real("imdb_rating"),
  imdbVotes: text("imdb_votes"),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
});

export const tasteProfile = sqliteTable("taste_profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  genres: text("genres").notNull(),
  directors: text("directors").notNull(),
  cast: text("cast").notNull(),
  decades: text("decades").notNull(),
  avgRuntime: real("avg_runtime").notNull(),
  titleTypeBias: text("title_type_bias").notNull(),
  genrePenalties: text("genre_penalties").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ImportedRating = typeof importedRatings.$inferSelect;
export type SwipeAction = typeof swipeActions.$inferSelect;
export type TasteProfileRow = typeof tasteProfile.$inferSelect;
