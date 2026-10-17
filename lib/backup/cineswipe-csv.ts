import "server-only";

import Papa from "papaparse";
import { forUser } from "@/lib/db/user-scope";
import { db } from "@/lib/db";
import { importedRatings, swipeActions, tasteProfile } from "@/lib/db/schema";
import { requestUserId } from "@/lib/auth/user-context";
import { rebuildTasteProfile } from "@/lib/taste-profile";

const BACKUP_VERSION = "1";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

type BackupRow = Record<string, string>;

export async function exportUserBackupCsvAsync(): Promise<string> {
  const [swipes, ratings, tastes] = await Promise.all([
    db.select().from(swipeActions).where(forUser(swipeActions)),
    db.select().from(importedRatings).where(forUser(importedRatings)),
    db.select().from(tasteProfile).where(forUser(tasteProfile)).limit(1),
  ]);

  const rows: BackupRow[] = [];

  for (const row of swipes) {
    rows.push({
      record_type: "swipe",
      tmdb_id: String(row.tmdbId),
      imdb_id: row.imdbId ?? "",
      title: row.title,
      action: row.action,
      match_score: row.matchScore != null ? String(row.matchScore) : "",
      payload: row.payload ?? "",
      created_at: row.createdAt?.toISOString?.() ?? "",
    });
  }

  for (const row of ratings) {
    rows.push({
      record_type: "rating",
      imdb_id: row.imdbId,
      tmdb_id: row.tmdbId != null ? String(row.tmdbId) : "",
      title: row.title,
      original_title: row.originalTitle ?? "",
      your_rating: row.yourRating != null ? String(row.yourRating) : "",
      imdb_rating: row.imdbRating != null ? String(row.imdbRating) : "",
      imdb_votes: row.imdbVotes != null ? String(row.imdbVotes) : "",
      genres: row.genres ?? "",
      directors: row.directors ?? "",
      year: row.year != null ? String(row.year) : "",
      runtime: row.runtime != null ? String(row.runtime) : "",
      title_type: row.titleType ?? "",
      date_rated: row.dateRated ?? "",
      url: row.url ?? "",
    });
  }

  const taste = tastes[0];
  if (taste) {
    rows.push({
      record_type: "taste",
      genres: taste.genres,
      directors: taste.directors,
      cast: taste.cast,
      decades: taste.decades,
      avg_runtime: String(taste.avgRuntime),
      title_type_bias: taste.titleTypeBias,
      genre_penalties: taste.genrePenalties,
    });
  }

  const csv = Papa.unparse(rows, { header: true });
  return `# cineswipe_backup_version=${BACKUP_VERSION}\n${csv}`;
}

export async function importUserBackupCsvReplace(csvText: string): Promise<void> {
  if (csvText.length > MAX_BACKUP_BYTES) {
    throw new Error("Backup file too large");
  }

  const withoutComment = csvText
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .join("\n");

  const parsed = Papa.parse<BackupRow>(withoutComment, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error("Invalid backup CSV");
  }

  const userId = requestUserId();

  await db.delete(swipeActions).where(forUser(swipeActions));
  await db.delete(importedRatings).where(forUser(importedRatings));
  await db.delete(tasteProfile).where(forUser(tasteProfile));

  let hasRatings = false;
  let tasteRow: (typeof tasteProfile.$inferInsert) | null = null;

  for (const row of parsed.data) {
    const type = row.record_type;
    if (type === "swipe") {
      const tmdbId = Number(row.tmdb_id);
      if (!Number.isFinite(tmdbId)) continue;
      const raw = (row.action ?? "").trim().toLowerCase();
      const action: "pass" | "like" | "wishlist" =
        raw === "wishlist"
          ? "wishlist"
          : raw === "pass"
            ? "pass"
            : "like";
      await db.insert(swipeActions).values({
        userId,
        tmdbId,
        imdbId: row.imdb_id || null,
        title: row.title || "Unknown",
        action,
        matchScore: row.match_score ? Number(row.match_score) : null,
        payload: row.payload || null,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      });
    } else if (type === "rating") {
      hasRatings = true;
      await db.insert(importedRatings).values({
        userId,
        imdbId: row.imdb_id,
        tmdbId: row.tmdb_id ? Number(row.tmdb_id) : null,
        title: row.title || "Unknown",
        originalTitle: row.original_title || null,
        yourRating: row.your_rating ? Number(row.your_rating) : null,
        imdbRating: row.imdb_rating ? Number(row.imdb_rating) : null,
        imdbVotes: row.imdb_votes ? Number(row.imdb_votes) : null,
        genres: row.genres || null,
        directors: row.directors || null,
        year: row.year ? Number(row.year) : null,
        runtime: row.runtime ? Number(row.runtime) : null,
        titleType: row.title_type || null,
        dateRated: row.date_rated || null,
        url: row.url || null,
      });
    } else if (type === "taste") {
      tasteRow = {
        userId,
        genres: row.genres || "{}",
        directors: row.directors || "{}",
        cast: row.cast || "{}",
        decades: row.decades || "{}",
        avgRuntime: row.avg_runtime ? Number(row.avg_runtime) : 120,
        titleTypeBias: row.title_type_bias || "{}",
        genrePenalties: row.genre_penalties || "{}",
        updatedAt: new Date(),
      };
    }
  }

  if (hasRatings) {
    await rebuildTasteProfile();
  } else if (tasteRow) {
    await db.insert(tasteProfile).values(tasteRow);
  } else {
    await db.insert(tasteProfile).values({
      userId,
      genres: "{}",
      directors: "{}",
      cast: "{}",
      decades: "{}",
      avgRuntime: 120,
      titleTypeBias: "{}",
      genrePenalties: "{}",
      updatedAt: new Date(),
    });
  }
}
