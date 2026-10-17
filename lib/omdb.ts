import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { importedRatings, movieCache } from "./db/schema";
import { optionalUserId } from "./user-context";
import { fetchWithTimeout } from "./fetch-timeout";
import { getApiKeys } from "./settings";
import type { OmdbRating } from "./types";

const OMDB_BASE = "https://www.omdbapi.com/";

/** Serialize live OMDb calls — free tier flakes under parallel enrich (6 workers). */
let omdbChain: Promise<unknown> = Promise.resolve();

function enqueueOmdb<T>(fn: () => Promise<T>): Promise<T> {
  const run = omdbChain.then(fn, fn);
  omdbChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function fetchOmdbByImdbId(imdbId: string): Promise<OmdbRating> {
  const { omdbApiKey } = await getApiKeys();
  if (!omdbApiKey) {
    return { imdbRating: null, imdbVotes: null };
  }

  return enqueueOmdb(async () => {
    const url = new URL(OMDB_BASE);
    url.searchParams.set("apikey", omdbApiKey);
    url.searchParams.set("i", imdbId);
    // Omit type=movie — some titles are miscategorized and still have ratings.

    const res = await fetchWithTimeout(
      url.toString(),
      { cache: "no-store" },
      15_000,
    );

    if (!res.ok) {
      // Valid keys still hit 401/429 under burst or daily quota; treat as missing rating.
      if (res.status === 401 || res.status === 429) {
        console.warn("[omdb] rate/auth response", { imdbId, status: res.status });
        return { imdbRating: null, imdbVotes: null };
      }
      console.warn("[omdb] request failed", { imdbId, status: res.status });
      return { imdbRating: null, imdbVotes: null };
    }

    const data = (await res.json()) as {
      Response?: string;
      Error?: string;
      imdbRating?: string;
      imdbVotes?: string;
    };

    if (data.Response === "False") {
      return { imdbRating: null, imdbVotes: null };
    }

    const rating =
      data.imdbRating && data.imdbRating !== "N/A"
        ? Number(data.imdbRating)
        : null;

    return {
      imdbRating: Number.isFinite(rating) ? rating : null,
      imdbVotes:
        data.imdbVotes && data.imdbVotes !== "N/A" ? data.imdbVotes : null,
    };
  });
}

export async function getImdbRatingForMovie(
  tmdbId: number,
  imdbId: string | null,
): Promise<OmdbRating> {
  if (!imdbId) {
    return { imdbRating: null, imdbVotes: null };
  }

  const cached = await db
    .select()
    .from(movieCache)
    .where(eq(movieCache.tmdbId, tmdbId))
    .limit(1);

  const cacheRow = cached[0];
  if (
    cacheRow?.imdbRating != null &&
    Date.now() - cacheRow.fetchedAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    return {
      imdbRating: cacheRow.imdbRating,
      imdbVotes: cacheRow.imdbVotes,
    };
  }

  const userId = optionalUserId();
  const imported = userId
    ? await db
        .select()
        .from(importedRatings)
        .where(
          and(
            eq(importedRatings.userId, userId),
            eq(importedRatings.imdbId, imdbId),
          ),
        )
        .limit(1)
    : [];

  const importedRow = imported[0];
  if (importedRow?.imdbRating != null) {
    return {
      imdbRating: importedRow.imdbRating,
      imdbVotes: importedRow.imdbVotes ? String(importedRow.imdbVotes) : null,
    };
  }

  const omdb = await fetchOmdbByImdbId(imdbId);

  // Only persist when we got a real rating — don't cache nulls from quota blips.
  if (omdb.imdbRating != null) {
    await db
      .insert(movieCache)
      .values({
        tmdbId,
        imdbId,
        payload: cacheRow?.payload ?? "{}",
        imdbRating: omdb.imdbRating,
        imdbVotes: omdb.imdbVotes,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: movieCache.tmdbId,
        set: {
          imdbId,
          imdbRating: omdb.imdbRating,
          imdbVotes: omdb.imdbVotes,
          fetchedAt: new Date(),
        },
      });
  }

  return omdb;
}
