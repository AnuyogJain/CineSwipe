import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { importedRatings, tasteProfile } from "./db/schema";
import type { ParsedRating } from "./csv-parser";
import type { TasteProfileData } from "./types";

function ratingWeight(yourRating: number | null): number {
  if (yourRating == null) return 0;
  return Math.max(0, Math.min(1, (yourRating - 5) / 5));
}

function addToMap(map: Record<string, number>, key: string, delta: number) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + delta;
}

function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildTasteProfileFromRatings(
  ratings: ParsedRating[],
): TasteProfileData {
  const profile: TasteProfileData = {
    genres: {},
    directors: {},
    cast: {},
    decades: {},
    avgRuntime: 0,
    titleTypeBias: {},
    genrePenalties: {},
  };

  const genreRatingSums: Record<string, { total: number; count: number }> = {};
  let runtimeSum = 0;
  let runtimeCount = 0;

  for (const rating of ratings) {
    const weight = ratingWeight(rating.yourRating);
    if (weight <= 0) continue;

    for (const genre of splitList(rating.genres)) {
      addToMap(profile.genres, genre, weight);
      if (rating.yourRating != null) {
        if (!genreRatingSums[genre]) {
          genreRatingSums[genre] = { total: 0, count: 0 };
        }
        genreRatingSums[genre].total += rating.yourRating;
        genreRatingSums[genre].count += 1;
      }
    }

    for (const director of splitList(rating.directors)) {
      addToMap(profile.directors, director, weight);
    }

    if (rating.year) {
      const decade = `${Math.floor(rating.year / 10) * 10}s`;
      addToMap(profile.decades, decade, weight);
    }

    if (rating.runtime) {
      runtimeSum += rating.runtime;
      runtimeCount += 1;
    }

    if (rating.titleType) {
      addToMap(profile.titleTypeBias, rating.titleType, weight);
    }
  }

  for (const [genre, stats] of Object.entries(genreRatingSums)) {
    const avg = stats.total / stats.count;
    if (avg < 6) {
      profile.genrePenalties[genre] = (6 - avg) / 6;
    }
  }

  profile.avgRuntime = runtimeCount > 0 ? runtimeSum / runtimeCount : 120;
  return profile;
}

export async function enrichCastFromTopRated(limit = 12): Promise<void> {
  const { getEnrichedMovie, findTmdbIdByImdbId } = await import("./tmdb");
  const { hasRequiredKeys } = await import("./settings");
  if (!(await hasRequiredKeys())) return;

  const profile = (await getTasteProfile()) ?? buildTasteProfileFromRatings([]);
  const topRows = await db
    .select()
    .from(importedRatings)
    .orderBy(desc(importedRatings.yourRating))
    .limit(limit);

  for (const row of topRows) {
    if ((row.yourRating ?? 0) < 7) continue;
    try {
      const tmdbId = row.tmdbId ?? (await findTmdbIdByImdbId(row.imdbId));
      if (!tmdbId) continue;
      const movie = await getEnrichedMovie(tmdbId);
      const weight = Math.max(0.2, ((row.yourRating ?? 7) - 5) / 5);
      for (const actor of movie.cast.slice(0, 6)) {
        addToMap(profile.cast, actor.name, weight * 0.5);
      }
    } catch {
      continue;
    }
  }

  const now = new Date();
  await db.delete(tasteProfile);
  await db.insert(tasteProfile).values({
    genres: JSON.stringify(profile.genres),
    directors: JSON.stringify(profile.directors),
    cast: JSON.stringify(profile.cast),
    decades: JSON.stringify(profile.decades),
    avgRuntime: profile.avgRuntime,
    titleTypeBias: JSON.stringify(profile.titleTypeBias),
    genrePenalties: JSON.stringify(profile.genrePenalties),
    updatedAt: now,
  });
}

export async function rebuildTasteProfile(): Promise<TasteProfileData> {
  const ratings = await db.select().from(importedRatings);
  const parsed: ParsedRating[] = ratings.map((r) => ({
    imdbId: r.imdbId,
    title: r.title,
    originalTitle: r.originalTitle,
    yourRating: r.yourRating,
    imdbRating: r.imdbRating,
    imdbVotes: r.imdbVotes,
    genres: r.genres,
    directors: r.directors,
    year: r.year,
    runtime: r.runtime,
    titleType: r.titleType,
    dateRated: r.dateRated,
    url: r.url,
  }));

  const profile = buildTasteProfileFromRatings(parsed);
  const now = new Date();

  await db.delete(tasteProfile);
  await db.insert(tasteProfile).values({
    genres: JSON.stringify(profile.genres),
    directors: JSON.stringify(profile.directors),
    cast: JSON.stringify(profile.cast),
    decades: JSON.stringify(profile.decades),
    avgRuntime: profile.avgRuntime,
    titleTypeBias: JSON.stringify(profile.titleTypeBias),
    genrePenalties: JSON.stringify(profile.genrePenalties),
    updatedAt: now,
  });

  return profile;
}

export async function getTasteProfile(): Promise<TasteProfileData | null> {
  const rows = await db
    .select()
    .from(tasteProfile)
    .orderBy(desc(tasteProfile.updatedAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    genres: JSON.parse(row.genres) as Record<string, number>,
    directors: JSON.parse(row.directors) as Record<string, number>,
    cast: JSON.parse(row.cast) as Record<string, number>,
    decades: JSON.parse(row.decades) as Record<string, number>,
    avgRuntime: row.avgRuntime,
    titleTypeBias: JSON.parse(row.titleTypeBias) as Record<string, number>,
    genrePenalties: JSON.parse(row.genrePenalties) as Record<string, number>,
  };
}

export async function updateTasteProfileFromSwipe(
  movie: {
    genres: string[];
    director?: string;
    cast: string[];
    year: number;
    runtime: number | null;
  },
  action: "pass" | "like" | "wishlist",
): Promise<void> {
  const profile = (await getTasteProfile()) ?? buildTasteProfileFromRatings([]);
  const delta =
    action === "wishlist" ? 0.25 : action === "like" ? 0.1 : -0.05;

  for (const genre of movie.genres) {
    addToMap(profile.genres, genre, delta);
  }
  if (movie.director) {
    addToMap(profile.directors, movie.director, delta);
  }
  for (const actor of movie.cast) {
    addToMap(profile.cast, actor, delta);
  }
  if (movie.year) {
    const decade = `${Math.floor(movie.year / 10) * 10}s`;
    addToMap(profile.decades, decade, delta * 0.5);
  }

  const now = new Date();
  await db.delete(tasteProfile);
  await db.insert(tasteProfile).values({
    genres: JSON.stringify(profile.genres),
    directors: JSON.stringify(profile.directors),
    cast: JSON.stringify(profile.cast),
    decades: JSON.stringify(profile.decades),
    avgRuntime: profile.avgRuntime,
    titleTypeBias: JSON.stringify(profile.titleTypeBias),
    genrePenalties: JSON.stringify(profile.genrePenalties),
    updatedAt: now,
  });
}

export function parseProfileRow(row: {
  genres: string;
  directors: string;
  cast: string;
  decades: string;
  avgRuntime: number;
  titleTypeBias: string;
  genrePenalties: string;
}): TasteProfileData {
  return {
    genres: JSON.parse(row.genres) as Record<string, number>,
    directors: JSON.parse(row.directors) as Record<string, number>,
    cast: JSON.parse(row.cast) as Record<string, number>,
    decades: JSON.parse(row.decades) as Record<string, number>,
    avgRuntime: row.avgRuntime,
    titleTypeBias: JSON.parse(row.titleTypeBias) as Record<string, number>,
    genrePenalties: JSON.parse(row.genrePenalties) as Record<string, number>,
  };
}
