import "server-only";

import { eq } from "drizzle-orm";
import { db } from "./db";
import { movieCache } from "./db/schema";
import { fetchWithTimeout } from "./fetch-timeout";
import { getApiKeys } from "./settings";
import type { OmdbRating } from "./types";
import { backdropUrl, posterUrl } from "./images";

export { posterUrl, backdropUrl };

const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const { tmdbApiKey } = await getApiKeys();
  if (!tmdbApiKey) {
    throw new Error("TMDB API key not configured. Add it in Settings.");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", tmdbApiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetchWithTimeout(
    url.toString(),
    { next: { revalidate: 3600 } },
    20_000,
  );
  if (res.status === 401) {
    throw new Error("Invalid TMDB API key. Add or fix it in Settings.");
  }
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}). Try again later.`);
  }
  return res.json() as Promise<T>;
}

export async function findTmdbIdByImdbId(
  imdbId: string
): Promise<number | null> {
  const data = await tmdbFetch<{
    movie_results?: Array<{ id: number }>;
    tv_results?: Array<{ id: number }>;
  }>(`/find/${imdbId}`, { external_source: "imdb_id" });

  return data.movie_results?.[0]?.id ?? data.tv_results?.[0]?.id ?? null;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title: string;
  original_language?: string;
  /** Aligns with Discover `with_origin_country` */
  origin_country?: string[];
  overview: string;
  tagline?: string;
  release_date?: string;
  runtime?: number;
  vote_average: number;
  vote_count: number;
  status?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: Array<{ id: number; name: string }>;
  imdb_id?: string;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
}

interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }>;
  crew: Array<{ job: string; name: string }>;
}

interface TmdbImages {
  backdrops: Array<{ file_path: string }>;
  posters: Array<{ file_path: string }>;
}

export interface EnrichedMovie {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  /** ISO 639-1 original language (TMDB) — used as origin filter */
  originalLanguage: string;
  overview: string;
  tagline: string;
  year: number;
  releaseDate: string | null;
  runtime: number | null;
  status: string | null;
  genres: string[];
  genreIds: number[];
  posterPath: string | null;
  backdropPath: string | null;
  images: string[];
  director: string;
  writers: string[];
  countries: string[];
  /** ISO 3166-1 alpha-2 production country codes (TMDB order) */
  countryCodes: string[];
  /**
   * ISO 3166-1 alpha-2 origin countries — matches Discover `with_origin_country`
   * (see movie details `origin_country`).
   */
  originCountries: string[];
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }>;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getEnrichedMovie(tmdbId: number): Promise<EnrichedMovie> {
  const cached = await db
    .select()
    .from(movieCache)
    .where(eq(movieCache.tmdbId, tmdbId))
    .limit(1);

  const row = cached[0];
  if (row && Date.now() - row.fetchedAt.getTime() < CACHE_TTL_MS) {
    const parsed = JSON.parse(row.payload) as EnrichedMovie;
    // Accept older cache rows; fill newer fields with defaults.
    if (typeof parsed.originalLanguage === "string") {
      return {
        ...parsed,
        countryCodes: Array.isArray(parsed.countryCodes)
          ? parsed.countryCodes
          : [],
        originCountries: Array.isArray(parsed.originCountries)
          ? parsed.originCountries
          : [],
        cast: Array.isArray(parsed.cast) ? parsed.cast : [],
        genres: Array.isArray(parsed.genres) ? parsed.genres : [],
        genreIds: Array.isArray(parsed.genreIds) ? parsed.genreIds : [],
      };
    }
  }

  const [details, credits, images, externalIds] = await Promise.all([
    tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}`),
    tmdbFetch<TmdbCredits>(`/movie/${tmdbId}/credits`),
    tmdbFetch<TmdbImages>(`/movie/${tmdbId}/images`),
    tmdbFetch<{ imdb_id: string | null }>(`/movie/${tmdbId}/external_ids`),
  ]);

  const imagePaths = [
    details.poster_path,
    details.backdrop_path,
    ...images.backdrops.slice(0, 3).map((i) => i.file_path),
    ...images.posters.slice(0, 2).map((i) => i.file_path),
  ].filter(Boolean) as string[];

  const uniqueImages = [...new Set(imagePaths)]
    .map((p) => posterUrl(p, p === details.backdrop_path ? "w780" : "w500"))
    .filter(Boolean) as string[];

  const writerJobs = new Set(["Writer", "Screenplay", "Story", "Characters"]);
  const writers = [
    ...new Set(
      credits.crew.filter((c) => writerJobs.has(c.job)).map((c) => c.name)
    ),
  ].slice(0, 5);

  const enriched: EnrichedMovie = {
    tmdbId: details.id,
    imdbId: externalIds.imdb_id ?? details.imdb_id ?? null,
    title: details.title,
    originalTitle: details.original_title,
    originalLanguage: details.original_language ?? "",
    overview: details.overview,
    tagline: details.tagline ?? "",
    year: details.release_date
      ? new Date(details.release_date).getFullYear()
      : 0,
    releaseDate: details.release_date ?? null,
    runtime: details.runtime ?? null,
    status: details.status ?? null,
    genres: details.genres.map((g) => g.name),
    genreIds: details.genres.map((g) => g.id),
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    images: uniqueImages,
    director: credits.crew.find((c) => c.job === "Director")?.name ?? "",
    writers,
    countries: (details.production_countries ?? []).map((c) => c.name),
    countryCodes: (details.production_countries ?? []).map((c) => c.iso_3166_1),
    originCountries: (details.origin_country ?? []).map((c) => c.toUpperCase()),
    cast: credits.cast.slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    })),
  };

  await db
    .insert(movieCache)
    .values({
      tmdbId,
      imdbId: enriched.imdbId,
      payload: JSON.stringify(enriched),
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: movieCache.tmdbId,
      set: {
        imdbId: enriched.imdbId,
        payload: JSON.stringify(enriched),
        fetchedAt: new Date(),
      },
    });

  return enriched;
}

export async function getRecommendationsForMovie(
  tmdbId: number
): Promise<number[]> {
  const data = await tmdbFetch<{ results: Array<{ id: number }> }>(
    `/movie/${tmdbId}/recommendations`
  );
  return data.results.map((r) => r.id);
}

export async function discoverMovies(params: {
  genreId?: number;
  /** OR-match when multiple (TMDB pipe syntax) */
  genreIds?: number[];
  /** ISO 639-1 — Discover `with_original_language` */
  originalLanguage?: string;
  /** ISO 3166-1 alpha-2 — Discover `with_origin_country` */
  originCountry?: string;
  /** TMDB person id — Discover `with_people` */
  withPeople?: number;
  yearGte?: number;
  yearLte?: number;
  page?: number;
  voteAverageGte?: number;
  voteCountGte?: number;
  sortBy?: "popularity.desc" | "vote_average.desc";
}): Promise<number[]> {
  const searchParams: Record<string, string> = {
    sort_by: params.sortBy ?? "popularity.desc",
    include_adult: "false",
    page: String(params.page ?? 1),
  };
  const genreIds =
    params.genreIds && params.genreIds.length > 0
      ? params.genreIds
      : params.genreId
      ? [params.genreId]
      : [];
  if (genreIds.length === 1) {
    searchParams.with_genres = String(genreIds[0]);
  } else if (genreIds.length > 1) {
    searchParams.with_genres = genreIds.join("|");
  }
  if (params.originalLanguage) {
    searchParams.with_original_language = params.originalLanguage;
  }
  if (params.originCountry) {
    searchParams.with_origin_country = params.originCountry.toUpperCase();
  }
  if (params.withPeople) {
    searchParams.with_people = String(params.withPeople);
  }
  if (params.yearGte)
    searchParams["primary_release_date.gte"] = `${params.yearGte}-01-01`;
  if (params.yearLte)
    searchParams["primary_release_date.lte"] = `${params.yearLte}-12-31`;
  if (params.voteAverageGte != null) {
    searchParams["vote_average.gte"] = String(params.voteAverageGte);
  }
  if (params.voteCountGte != null) {
    searchParams["vote_count.gte"] = String(params.voteCountGte);
  }

  const data = await tmdbFetch<{ results: Array<{ id: number }> }>(
    "/discover/movie",
    searchParams
  );
  return data.results.map((r) => r.id);
}

export async function searchPerson(
  query: string
): Promise<Array<{ id: number; name: string; profilePath: string | null }>> {
  const data = await tmdbFetch<{
    results: Array<{ id: number; name: string; profile_path: string | null }>;
  }>("/search/person", { query });
  return data.results.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    profilePath: p.profile_path,
  }));
}

export async function getMoviesByPerson(personId: number): Promise<number[]> {
  const data = await tmdbFetch<{
    cast: Array<{ id: number; vote_average?: number; popularity?: number }>;
  }>(`/person/${personId}/movie_credits`);

  return data.cast
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .map((c) => c.id)
    .slice(0, 40);
}

export async function personAppearsInMovie(
  personId: number,
  tmdbId: number
): Promise<boolean> {
  try {
    const credits = await tmdbFetch<{ cast: Array<{ id: number }> }>(
      `/movie/${tmdbId}/credits`
    );
    return credits.cast.some((c) => c.id === personId);
  } catch {
    return false;
  }
}

export async function getGenreMap(): Promise<Record<string, number>> {
  const data = await tmdbFetch<{ genres: Array<{ id: number; name: string }> }>(
    "/genre/movie/list"
  );
  return Object.fromEntries(data.genres.map((g) => [g.name, g.id]));
}

export async function cacheImdbRating(
  tmdbId: number,
  imdbId: string | null,
  rating: OmdbRating
): Promise<void> {
  if (!imdbId) return;
  await db
    .update(movieCache)
    .set({
      imdbId,
      imdbRating: rating.imdbRating,
      imdbVotes: rating.imdbVotes,
    })
    .where(eq(movieCache.tmdbId, tmdbId));
}

export async function getCachedImdbRating(
  tmdbId: number
): Promise<OmdbRating | null> {
  const rows = await db
    .select()
    .from(movieCache)
    .where(eq(movieCache.tmdbId, tmdbId))
    .limit(1);
  const row = rows[0];
  if (!row || row.imdbRating == null) return null;
  return { imdbRating: row.imdbRating, imdbVotes: row.imdbVotes };
}
