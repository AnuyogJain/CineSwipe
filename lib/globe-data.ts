import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { forUser } from "./db/user-scope";
import { spreadMovieOnLand } from "./country-geometry";
import { countryName, getCentroid, COUNTRY_CENTROIDS } from "./countries";
import { db } from "./db";
import { importedRatings, swipeActions } from "./db/schema";
import type { GlobeCountry, GlobeDataset, GlobeMovie, GlobeSource } from "./globe-types";
import { resolvePrimaryCountryCode } from "./origin-country";
import { isGlobeEligibleTitleType } from "./title-type";
import { findTmdbIdByImdbId, getEnrichedMovie } from "./tmdb";

export type { GlobeCountry, GlobeDataset, GlobeMovie, GlobeSource } from "./globe-types";

type MappedDraft = Omit<GlobeMovie, "lat" | "lng">;

async function resolveTmdbId(
  imdbId: string,
  existing: number | null,
): Promise<number | null> {
  if (existing) return existing;
  const tmdbId = await findTmdbIdByImdbId(imdbId);
  if (tmdbId) {
    await db
      .update(importedRatings)
      .set({ tmdbId })
      .where(and(forUser(importedRatings), eq(importedRatings.imdbId, imdbId)));
  }
  return tmdbId;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function finalizeDataset(
  drafts: MappedDraft[],
  total: number,
  excludedNonMovies = 0,
): GlobeDataset {
  const byCountry = new Map<string, MappedDraft[]>();
  for (const draft of drafts) {
    const list = byCountry.get(draft.countryIso) ?? [];
    list.push(draft);
    byCountry.set(draft.countryIso, list);
  }

  const mappedMovies: GlobeMovie[] = [];
  for (const [iso, countryMovies] of byCountry) {
    const totalInCountry = countryMovies.length;
    countryMovies.forEach((draft, index) => {
      const coords = spreadMovieOnLand(iso, draft.tmdbId, index, totalInCountry);
      if (!coords) return;
      mappedMovies.push({ ...draft, lat: coords.lat, lng: coords.lng });
    });
  }

  const countryCounts = new Map<string, number>();
  for (const movie of mappedMovies) {
    countryCounts.set(movie.countryIso, (countryCounts.get(movie.countryIso) ?? 0) + 1);
  }

  const countries: GlobeCountry[] = [...countryCounts.entries()]
    .map(([iso, count]) => {
      const centroid = getCentroid(iso);
      if (!centroid) return null;
      return {
        iso,
        name: countryName(iso),
        lat: centroid.lat,
        lng: centroid.lng,
        count,
      };
    })
    .filter((c): c is GlobeCountry => c !== null)
    .sort((a, b) => b.count - a.count);

  return {
    countries,
    movies: mappedMovies,
    stats: {
      total,
      mapped: mappedMovies.length,
      unmapped: Math.max(0, total - mappedMovies.length),
      excludedNonMovies,
    },
  };
}

async function draftFromTmdbId(
  tmdbId: number,
  overrides?: Partial<Pick<MappedDraft, "title" | "year" | "yourRating" | "imdbRating">>,
): Promise<MappedDraft | null> {
  try {
    const enriched = await getEnrichedMovie(tmdbId);
    if (!enriched.countryCodes?.length) return null;

    const primaryIso = resolvePrimaryCountryCode(
      enriched.countryCodes,
      enriched.originalLanguage,
    );
    if (!primaryIso || !getCentroid(primaryIso)) return null;

    const countryIndex = enriched.countryCodes.indexOf(primaryIso);

    return {
      tmdbId,
      title: overrides?.title ?? enriched.title,
      year: overrides?.year ?? enriched.year,
      posterPath: enriched.posterPath,
      yourRating: overrides?.yourRating ?? null,
      imdbRating: overrides?.imdbRating ?? null,
      countryIso: primaryIso,
      countryName: countryName(
        primaryIso,
        countryIndex >= 0 ? enriched.countries[countryIndex] : undefined,
      ),
    };
  } catch {
    return null;
  }
}

async function buildViewedDataset(): Promise<GlobeDataset> {
  const allRows = await db
    .select()
    .from(importedRatings)
    .where(forUser(importedRatings));
  const rows = allRows.filter((row) => isGlobeEligibleTitleType(row.titleType));
  const total = rows.length;

  if (total === 0) {
    return finalizeDataset([], 0, allRows.length);
  }

  const mappedResults = await mapWithConcurrency(rows, 4, async (row) => {
    const tmdbId = await resolveTmdbId(row.imdbId, row.tmdbId);
    if (!tmdbId) return null;
    return draftFromTmdbId(tmdbId, {
      title: row.title,
      year: row.year ?? undefined,
      yourRating: row.yourRating,
      imdbRating: row.imdbRating,
    });
  });

  return finalizeDataset(
    mappedResults.filter((m): m is MappedDraft => m !== null),
    total,
    allRows.length - total,
  );
}

async function buildSwipeDataset(action: "like" | "wishlist"): Promise<GlobeDataset> {
  const wishlistIds = new Set(
    (
      await db
        .select({ tmdbId: swipeActions.tmdbId })
        .from(swipeActions)
        .where(
          and(forUser(swipeActions), eq(swipeActions.action, "wishlist")),
        )
    ).map((r) => r.tmdbId),
  );

  const rows = await db
    .select()
    .from(swipeActions)
    .where(and(forUser(swipeActions), eq(swipeActions.action, action)))
    .orderBy(desc(swipeActions.createdAt));

  const seen = new Set<number>();
  const uniqueIds: number[] = [];
  for (const row of rows) {
    if (seen.has(row.tmdbId)) continue;
    if (action === "like" && wishlistIds.has(row.tmdbId)) continue;
    seen.add(row.tmdbId);
    uniqueIds.push(row.tmdbId);
  }

  if (uniqueIds.length === 0) {
    return finalizeDataset([], 0);
  }

  const mappedResults = await mapWithConcurrency(uniqueIds, 4, (tmdbId) =>
    draftFromTmdbId(tmdbId),
  );

  return finalizeDataset(
    mappedResults.filter((m): m is MappedDraft => m !== null),
    uniqueIds.length,
  );
}

async function buildRecommendDataset(): Promise<GlobeDataset> {
  const countries: GlobeCountry[] = Object.entries(COUNTRY_CENTROIDS)
    .map(([iso, meta]) => ({
      iso,
      name: meta.name,
      lat: meta.lat,
      lng: meta.lng,
      count: 1,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    countries,
    movies: [],
    stats: {
      total: countries.length,
      mapped: countries.length,
      unmapped: 0,
      excludedNonMovies: 0,
    },
  };
}

export async function buildGlobeDataset(
  source: GlobeSource = "viewed",
): Promise<GlobeDataset> {
  if (source === "liked") return buildSwipeDataset("like");
  if (source === "wishlist") return buildSwipeDataset("wishlist");
  if (source === "recommend") return buildRecommendDataset();
  return buildViewedDataset();
}

export { parseGlobeSource } from "./globe-types";
