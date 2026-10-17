import "server-only";

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "./db";
import { importedRatings, movieCache, swipeActions } from "./db/schema";
import { importRowMatchesGenreFilter } from "./list-filters";
import { getTasteProfile } from "./taste-profile";
import {
  discoverMovies,
  findTmdbIdByImdbId,
  getEnrichedMovie,
  getGenreMap,
  getMoviesByPerson,
  getRecommendationsForMovie,
  posterUrl,
} from "./tmdb";
import { imdbTitleUrl } from "./imdb-url";
import { getImdbRatingForMovie } from "./omdb";
import { normalizeGenreName, resolveGenreId } from "./genres";
import { languageLabel } from "./languages";
import { countryName } from "./countries";
import { isGlobeEligibleTitleType } from "./title-type";
import type { MovieCandidate, TasteProfileData } from "./types";
import type { ImportedRating } from "./db/schema";
import {
  buildIdf,
  buildReason,
  combineScores,
  interleaveByGenre,
  mmrRank,
  movieDocument,
  parseVoteCount,
  passesHolisticGate,
  semanticTasteScore,
  tfIdfVector,
  tokenize,
  toMatchPercent,
  type ScoredCandidate,
  type TasteDimensions,
} from "./recommendation-intelligence";

function mapScore(map: Record<string, number>, keys: string[]): number {
  if (keys.length === 0) return 0;
  const total = keys.reduce((sum, key) => sum + (map[key] ?? 0), 0);
  return total / keys.length;
}

function eraMatch(profile: TasteProfileData, year: number): number {
  if (!year) return 0;
  const decade = `${Math.floor(year / 10) * 10}s`;
  return profile.decades[decade] ?? 0;
}

function runtimeMatch(
  profile: TasteProfileData,
  runtime: number | null
): number {
  if (!runtime) return 0;
  const diff = Math.abs(runtime - profile.avgRuntime);
  return Math.max(0, 1 - diff / 120);
}

function applyGenrePenalties(
  profile: TasteProfileData,
  genres: string[],
  baseScore: number
): number {
  let penalty = 0;
  for (const genre of genres) {
    penalty += profile.genrePenalties[genre] ?? 0;
  }
  return baseScore - penalty * 0.15;
}

export function scoreMovie(
  profile: TasteProfileData,
  movie: {
    genres: string[];
    director?: string;
    cast: string[];
    year: number;
    runtime: number | null;
  }
): number {
  const raw =
    0.35 * mapScore(profile.genres, movie.genres) +
    0.2 * mapScore(profile.directors, movie.director ? [movie.director] : []) +
    0.2 * mapScore(profile.cast, movie.cast) +
    0.1 * eraMatch(profile, movie.year) +
    0.1 * runtimeMatch(profile, movie.runtime) +
    0.05;

  return applyGenrePenalties(profile, movie.genres, raw);
}

function computeDimensions(
  profile: TasteProfileData,
  movie: {
    genres: string[];
    director?: string;
    cast: string[];
    year: number;
    runtime: number | null;
  }
): TasteDimensions {
  return {
    genre: mapScore(profile.genres, movie.genres),
    director: mapScore(
      profile.directors,
      movie.director ? [movie.director] : []
    ),
    cast: mapScore(profile.cast, movie.cast),
    era: eraMatch(profile, movie.year),
    runtime: runtimeMatch(profile, movie.runtime),
  };
}

async function getExcludedTmdbIds(): Promise<Set<number>> {
  const excluded = new Set<number>();
  const ratings = await db
    .select({ imdbId: importedRatings.imdbId, tmdbId: importedRatings.tmdbId })
    .from(importedRatings);
  const swipes = await db
    .select({ tmdbId: swipeActions.tmdbId })
    .from(swipeActions);

  for (const row of ratings) {
    if (row.tmdbId) excluded.add(row.tmdbId);
  }
  for (const row of swipes) {
    excluded.add(row.tmdbId);
  }

  for (const row of ratings) {
    if (!row.tmdbId && row.imdbId) {
      try {
        const tmdbId = await findTmdbIdByImdbId(row.imdbId);
        if (tmdbId) {
          excluded.add(tmdbId);
          await db
            .update(importedRatings)
            .set({ tmdbId })
            .where(eq(importedRatings.imdbId, row.imdbId));
        }
      } catch {
        // skip mapping failures
      }
    }
  }

  return excluded;
}

async function resolveTmdbId(
  imdbId: string,
  existing: number | null
): Promise<number | null> {
  if (existing) return existing;
  const tmdbId = await findTmdbIdByImdbId(imdbId);
  if (tmdbId) {
    await db
      .update(importedRatings)
      .set({ tmdbId })
      .where(eq(importedRatings.imdbId, imdbId));
  }
  return tmdbId;
}

interface SeedVote {
  title: string;
  weight: number;
}

async function buildSemanticCorpus(
  allRated: (typeof importedRatings.$inferSelect)[],
): Promise<{
  corpus: Array<{ vector: Map<string, number>; weight: number }>;
  idf: Map<string, number>;
}> {
  // CSV fields only — never hit TMDB here (was ~60 sequential enrich calls per request).
  const docs = allRated
    .filter((r) => (r.yourRating ?? 0) >= 6)
    .sort((a, b) => (b.yourRating ?? 0) - (a.yourRating ?? 0))
    .slice(0, 40)
    .map((rating) => {
      const weight = Math.max(0.15, ((rating.yourRating ?? 6) - 5) / 5);
      const text = `${rating.title} ${rating.genres ?? ""} ${
        rating.directors ?? ""
      }`;
      return { tokens: tokenize(text), weight };
    });

  if (docs.length === 0) {
    return { corpus: [], idf: new Map() };
  }

  const idf = buildIdf(docs.map((d) => d.tokens));
  const corpus = docs.map((d) => ({
    vector: tfIdfVector(d.tokens, idf),
    weight: d.weight,
  }));

  return { corpus, idf };
}

function addSeedVote(
  map: Map<number, SeedVote[]>,
  tmdbId: number,
  title: string,
  weight: number
) {
  const list = map.get(tmdbId) ?? [];
  const existing = list.find((s) => s.title === title);
  if (existing) {
    existing.weight = Math.max(existing.weight, weight);
  } else {
    list.push({ title, weight });
  }
  map.set(tmdbId, list);
}

const MIN_IMDB_VOTES = 1_000;
const MIN_IMDB_VOTES_GENRE = 500;

async function getQualityThreshold(genreBrowse: boolean): Promise<number> {
  const ratings = await db.select().from(importedRatings);
  const reference = ratings.filter(
    (r) => (r.yourRating ?? 0) >= 7 && r.imdbRating != null && r.imdbRating > 0
  );

  if (reference.length === 0) return genreBrowse ? 5.8 : 6.0;

  const avgImdb =
    reference.reduce((sum, r) => sum + (r.imdbRating ?? 0), 0) /
    reference.length;

  // Genre browse is looser so Horror/Comedy/etc. always have a deep pool
  if (genreBrowse) {
    return Math.max(5.5, Math.min(6.5, avgImdb - 1.2));
  }
  return Math.max(5.8, Math.min(6.8, avgImdb - 1.0));
}

async function enrichCandidate(
  tmdbId: number,
  profile: TasteProfileData,
  seedVotes: Map<number, SeedVote[]>,
  semanticCorpus: Array<{ vector: Map<string, number>; weight: number }>,
  idf: Map<string, number>,
  topGenres: string[],
  options: {
    castName?: string;
    castId?: number;
    genres?: string[];
    languages?: string[];
    countries?: string[];
    minImdbRating: number;
    /** Genre/cast browse: skip taste gate — still rank by taste */
    browseMode?: boolean;
  },
): Promise<ScoredCandidate | null> {
  try {
    const movie = await getEnrichedMovie(tmdbId);

    // Do not drop for quality / taste / filter re-checks — only seen IDs are
    // excluded upstream. Rank by matchScore so stronger fits surface first.
    const castMatched = options.castId
      ? movie.cast.some((member) => member.id === options.castId)
      : true;

    const imdb = await getImdbRatingForMovie(tmdbId, movie.imdbId).catch(
      (err) => {
        console.warn("[recs] ombd rating failed", {
          tmdbId,
          err: err instanceof Error ? err.message : err,
        });
        return { imdbRating: null, imdbVotes: null };
      },
    );
    const voteCount = parseVoteCount(imdb.imdbVotes);

    let yourRating: number | null = null;
    if (movie.imdbId) {
      const imported = await db
        .select()
        .from(importedRatings)
        .where(eq(importedRatings.imdbId, movie.imdbId))
        .limit(1);
      yourRating = imported[0]?.yourRating ?? null;
    }

    const profileScore = scoreMovie(profile, {
      genres: movie.genres,
      director: movie.director,
      cast: movie.cast.map((c) => c.name),
      year: movie.year,
      runtime: movie.runtime,
    });

    const dims = computeDimensions(profile, {
      genres: movie.genres,
      director: movie.director,
      cast: movie.cast.map((c) => c.name),
      year: movie.year,
      runtime: movie.runtime,
    });

    let semanticScore = 0;
    if (idf.size > 0 && semanticCorpus.length > 0) {
      const doc = movieDocument({
        title: movie.title,
        overview: movie.overview,
        genres: movie.genres,
        director: movie.director,
        cast: movie.cast.map((c) => c.name),
      });
      const vec = tfIdfVector(tokenize(doc), idf);
      semanticScore = semanticTasteScore(vec, semanticCorpus);
    }

    const seeds = seedVotes.get(tmdbId) ?? [];
    const seedCount = seeds.length;
    let matchScore = combineScores(
      profileScore,
      semanticScore,
      seedCount,
      imdb.imdbRating,
      voteCount,
    );

    // Soft preference vs hard drop: slightly prefer titles above personal quality bar.
    if (
      imdb.imdbRating != null &&
      imdb.imdbRating >= options.minImdbRating
    ) {
      matchScore += 0.04;
    }
    if (voteCount >= (options.browseMode ? MIN_IMDB_VOTES_GENRE : MIN_IMDB_VOTES)) {
      matchScore += 0.03;
    }
    if (options.castId) {
      matchScore += castMatched ? 0.12 : -0.2;
    }
    // Weak taste still allowed — nudge multidimensional fits up a bit.
    if (passesHolisticGate(dims, profileScore, semanticScore)) {
      matchScore += 0.05;
    }

    const candidate: ScoredCandidate = {
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      title: movie.title,
      originalTitle: movie.originalTitle,
      originalLanguage: movie.originalLanguage,
      overview: movie.overview,
      tagline: movie.tagline,
      year: movie.year,
      runtime: movie.runtime,
      genres: movie.genres,
      genreIds: movie.genreIds,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      images: movie.images.length
        ? movie.images
        : ([
            posterUrl(movie.posterPath),
            posterUrl(movie.backdropPath, "w780"),
          ].filter(Boolean) as string[]),
      imdbRating: imdb.imdbRating,
      imdbVotes: imdb.imdbVotes,
      yourRating,
      matchScore,
      matchPercent: toMatchPercent(matchScore),
      seedTitles: seeds.sort((a, b) => b.weight - a.weight).map((s) => s.title),
      seedCount,
      semanticScore,
      profileScore,
      director: movie.director,
      writers: movie.writers,
      releaseDate: movie.releaseDate,
      status: movie.status,
      countries: movie.countries,
      cast: movie.cast,
    };

    if (options.castName) {
      candidate.reason = castMatched
        ? `Starring ${options.castName} · matched to your taste`
        : `Related to ${options.castName} · ranked by taste fit`;
    } else if (
      (options.genres && options.genres.length > 0) ||
      (options.languages && options.languages.length > 0) ||
      (options.countries && options.countries.length > 0)
    ) {
      const parts: string[] = [];
      if (options.countries && options.countries.length > 0) {
        parts.push(
          options.countries.length === 1
            ? countryName(options.countries[0])
            : `${options.countries.length} countries`,
        );
      }
      if (options.genres && options.genres.length > 0) {
        parts.push(
          options.genres.length === 1
            ? normalizeGenreName(options.genres[0])
            : `${options.genres.length} genres`,
        );
      }
      if (options.languages && options.languages.length > 0) {
        parts.push(
          options.languages.length === 1
            ? languageLabel(options.languages[0])
            : `${options.languages.length} origins`,
        );
      }
      candidate.reason = `${parts.join(" · ")} · sorted by how well they match you`;
    } else {
      candidate.reason = buildReason(candidate, topGenres);
    }

    return candidate;
  } catch (err) {
    console.warn("[recs] enrichCandidate failed", {
      tmdbId,
      err: err instanceof Error ? err.message : err,
    });
    return null;
  }
}

export async function getRecommendations(options: {
  limit?: number;
  /** Multi-select genres (OR). Legacy `genre` still accepted via API normalization. */
  genres?: string[];
  /** Multi-select original languages / origins (OR). */
  languages?: string[];
  /** ISO 3166-1 alpha-2 production countries (OR). */
  countries?: string[];
  castId?: number;
  castName?: string;
  /** 1-based page — Refresh / load-more fetch a different discover window */
  page?: number;
}): Promise<{ movies: MovieCandidate[]; nextPage: number }> {
  const limit = options.limit ?? 20;
  /** First paint / swipe pages: enrich only what we return. Overfetch is conditional. */
  const readyTarget = Math.min(Math.max(limit, 8), 24);
  const page = Math.max(1, options.page ?? 1);
  let nextPage = page + 1;
  const selectedGenres = (options.genres ?? []).filter(Boolean);
  const selectedLanguages = (options.languages ?? [])
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  const selectedCountries = (options.countries ?? [])
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
  const profile = await getTasteProfile();
  if (!profile) {
    throw new Error("Import your IMDb ratings first to build a taste profile.");
  }

  const excluded = await getExcludedTmdbIds();
  const candidateIds = new Set<number>();
  const enrichedIds = new Set<number>();
  const seedVotes = new Map<number, SeedVote[]>();
  const filterActive = Boolean(
    selectedGenres.length > 0 ||
      selectedLanguages.length > 0 ||
      selectedCountries.length > 0 ||
      options.castId,
  );
  const browseMode = filterActive;
  const minImdbRating = await getQualityThreshold(browseMode);
  const discoverVoteFloor = browseMode ? 40 : 100;

  const allRated = await db.select().from(importedRatings);
  const topGenres = Object.entries(profile.genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  const { corpus: semanticCorpus, idf } = await buildSemanticCorpus(allRated);
  const genreMap = await getGenreMap();
  const scored: ScoredCandidate[] = [];

  const ENRICH_CONCURRENCY = 6;
  /** Below this best matchScore, pull one more Discover window (weak fit). */
  const WEAK_FIT_SCORE = 0.1;

  const enrichBatch = async (ids: number[]) => {
    const queue = ids.filter((id) => !enrichedIds.has(id));

    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(ENRICH_CONCURRENCY, queue.length) },
      async () => {
        while (scored.length < readyTarget) {
          const idx = cursor++;
          if (idx >= queue.length) return;
          const tmdbId = queue[idx]!;
          if (enrichedIds.has(tmdbId)) continue;
          enrichedIds.add(tmdbId);
          const candidate = await enrichCandidate(
            tmdbId,
            profile,
            seedVotes,
            semanticCorpus,
            idf,
            topGenres,
            {
              castName: options.castName,
              castId: options.castId,
              genres: selectedGenres,
              languages: selectedLanguages,
              countries: selectedCountries,
              minImdbRating,
              browseMode,
            },
          );
          if (candidate) scored.push(candidate);
        }
      },
    );
    await Promise.all(workers);
  };

  const addCandidates = (ids: number[]) => {
    let added = 0;
    for (const id of ids) {
      if (excluded.has(id) || candidateIds.has(id)) continue;
      candidateIds.add(id);
      added += 1;
    }
    return added;
  };

  const bestMatchScore = () =>
    scored.reduce((max, c) => Math.max(max, c.matchScore), 0);

  // Seeds only on open Discover page 1 — cheap taste signal, not every swipe page.
  if (!filterActive && page === 1) {
    const topRated = [...allRated]
      .sort((a, b) => (b.yourRating ?? 0) - (a.yourRating ?? 0))
      .filter((r) => (r.yourRating ?? 0) >= 7)
      .slice(0, 3);

    await Promise.all(
      topRated.map(async (rating) => {
        const tmdbId = await resolveTmdbId(rating.imdbId, rating.tmdbId);
        if (!tmdbId) return;
        const seedWeight = ((rating.yourRating ?? 7) - 5) / 5;
        try {
          const recs = await getRecommendationsForMovie(tmdbId);
          for (const id of recs.slice(0, 6)) {
            if (excluded.has(id)) continue;
            candidateIds.add(id);
            addSeedVote(seedVotes, id, rating.title, seedWeight);
          }
        } catch {
          // continue
        }
      }),
    );
  }

  if (options.castId) {
    const personMovies = await getMoviesByPerson(options.castId);
    addCandidates(personMovies);
    await enrichBatch([...candidateIds].slice(0, readyTarget));
    nextPage = page + 1;
  } else {
    const genreIds = selectedGenres
      .map((g) => resolveGenreId(genreMap, g))
      .filter((id): id is number => id != null);

    if (selectedGenres.length > 0 && genreIds.length === 0) {
      throw new Error(`Unknown genre filter. Try another selection.`);
    }

    const languagesToQuery =
      selectedLanguages.length > 0 ? selectedLanguages : [undefined];
    const countriesToQuery =
      selectedCountries.length > 0 ? selectedCountries : [undefined];
    const openGenres = !filterActive
      ? topGenres
          .slice(0, 2)
          .map((name) => resolveGenreId(genreMap, name))
          .filter((id): id is number => id != null)
      : [];

    let discoverCursor = page;

    const runDiscoverPage = async (p: number) => {
      let added = 0;
      let rawFromTmdb = 0;
      if (filterActive) {
        for (const originalLanguage of languagesToQuery) {
          for (const originCountry of countriesToQuery) {
            try {
              const discovered = await discoverMovies({
                genreIds: genreIds.length > 0 ? genreIds : undefined,
                originalLanguage,
                originCountry,
                page: p,
                voteCountGte: discoverVoteFloor,
                sortBy: "popularity.desc",
              });
              rawFromTmdb += discovered.length;
              added += addCandidates(discovered);
            } catch (err) {
              console.warn("[recs] discover failed", {
                page: p,
                originalLanguage,
                originCountry,
                err: err instanceof Error ? err.message : err,
              });
            }
          }
        }
      } else {
        for (const genreId of openGenres) {
          try {
            const discovered = await discoverMovies({
              genreId,
              page: p,
              voteCountGte: discoverVoteFloor,
              sortBy: "popularity.desc",
            });
            rawFromTmdb += discovered.length;
            added += addCandidates(discovered.slice(0, 15));
          } catch (err) {
            console.warn("[recs] discover failed", {
              page: p,
              genreId,
              err: err instanceof Error ? err.message : err,
            });
          }
        }
      }
      console.info("[recs] discover", {
        page: p,
        genres: selectedGenres,
        languages: selectedLanguages,
        countries: selectedCountries,
        rawFromTmdb,
        newUnseen: added,
        excludedSize: excluded.size,
        candidatePool: candidateIds.size,
      });
      return added;
    };

    const enrichNeeded = async () => {
      const need = readyTarget - scored.length;
      if (need <= 0) return;
      const pending = [...candidateIds]
        .filter((id) => !enrichedIds.has(id))
        .slice(0, need);
      const before = scored.length;
      if (pending.length > 0) await enrichBatch(pending);
      console.info("[recs] enrich", {
        attempted: pending.length,
        scoredBefore: before,
        scoredAfter: scored.length,
        enrichFailedOrSkipped: pending.length - (scored.length - before),
      });
    };

    // Lean pass: one Discover page + enrich up to limit.
    await runDiscoverPage(discoverCursor);
    discoverCursor += 1;
    await enrichNeeded();

    // Overfetch only when this window is empty or every title is a weak taste fit.
    const needsMore =
      scored.length === 0 || bestMatchScore() < WEAK_FIT_SCORE;
    if (needsMore) {
      console.info("[recs] overfetch", {
        reason: scored.length === 0 ? "empty_pool" : "weak_fit",
        scored: scored.length,
        bestMatch: bestMatchScore(),
      });
      for (let extra = 0; extra < 2; extra++) {
        if (scored.length >= readyTarget && bestMatchScore() >= WEAK_FIT_SCORE) {
          break;
        }
        const added = await runDiscoverPage(discoverCursor);
        discoverCursor += 1;
        await enrichNeeded();
        if (added === 0) break;
      }
    }

    nextPage = discoverCursor;
  }

  const pool = scored;

  console.info("[recs] done", {
    page,
    nextPage,
    genres: selectedGenres,
    languages: selectedLanguages,
    countries: selectedCountries,
    returned: pool.length,
    bestMatch: pool.reduce((m, c) => Math.max(m, c.matchScore), 0),
  });

  if (pool.length === 0) {
    return { movies: [], nextPage };
  }

  pool.sort((a, b) => {
    if (Math.abs(b.matchScore - a.matchScore) > 0.01) {
      return b.matchScore - a.matchScore;
    }
    const votesA = parseVoteCount(a.imdbVotes);
    const votesB = parseVoteCount(b.imdbVotes);
    return votesB - votesA;
  });

  const ranked = browseMode
    ? pool.slice(0, readyTarget)
    : interleaveByGenre(mmrRank(pool, readyTarget, 0.85));

  return {
    movies: ranked.slice(0, readyTarget),
    nextPage,
  };
}

function watchedFromImport(row: ImportedRating): MovieCandidate {
  const genres =
    row.genres
      ?.split(",")
      .map((g) => g.trim())
      .filter(Boolean) ?? [];

  return {
    tmdbId: row.tmdbId ?? 0,
    imdbId: row.imdbId,
    title: row.title,
    overview: "",
    year: row.year ?? 0,
    runtime: row.runtime,
    genres,
    genreIds: [],
    posterPath: null,
    backdropPath: null,
    images: ["/placeholder-poster.svg"],
    imdbRating: row.imdbRating,
    imdbVotes: row.imdbVotes != null ? String(row.imdbVotes) : null,
    yourRating: row.yourRating,
    matchScore: 0,
    matchPercent: 0,
    cast: [],
  };
}

async function enrichWatchedRow(row: ImportedRating): Promise<MovieCandidate> {
  const fallback = watchedFromImport(row);
  if (!row.tmdbId) return fallback;

  try {
    const movie = await getEnrichedMovie(row.tmdbId);
    return {
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId ?? row.imdbId,
      title: movie.title,
      originalTitle: movie.originalTitle,
      originalLanguage: movie.originalLanguage,
      overview: movie.overview,
      tagline: movie.tagline,
      year: movie.year || fallback.year,
      runtime: movie.runtime ?? row.runtime,
      genres: movie.genres.length > 0 ? movie.genres : fallback.genres,
      genreIds: movie.genreIds,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      images:
        movie.images.length > 0 ? movie.images : fallback.images,
      imdbRating: row.imdbRating ?? null,
      imdbVotes: row.imdbVotes != null ? String(row.imdbVotes) : null,
      yourRating: row.yourRating,
      matchScore: 0,
      matchPercent: 0,
      director: movie.director,
      cast: movie.cast,
    };
  } catch {
    return fallback;
  }
}

async function loadCachedOriginalLanguages(
  tmdbIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (tmdbIds.length === 0) return map;

  const chunkSize = 200;
  for (let i = 0; i < tmdbIds.length; i += chunkSize) {
    const chunk = tmdbIds.slice(i, i + chunkSize);
    const cached = await db
      .select()
      .from(movieCache)
      .where(inArray(movieCache.tmdbId, chunk));
    for (const row of cached) {
      try {
        const parsed = JSON.parse(row.payload) as { originalLanguage?: string };
        const lang = parsed.originalLanguage?.trim().toLowerCase();
        if (lang) map.set(row.tmdbId, lang);
      } catch {
        /* ignore bad cache payload */
      }
    }
  }
  return map;
}

export async function getWatchedMovies(options?: {
  page?: number;
  limit?: number;
  genres?: string[];
  languages?: string[];
}): Promise<{ movies: MovieCandidate[]; total: number; nextPage: number | null }> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 48);
  const genreFilters = options?.genres ?? [];
  const languageFilters = (options?.languages ?? []).map((l) => l.toLowerCase());

  const rows = await db.select().from(importedRatings);
  let eligible = rows
    .filter((row) => isGlobeEligibleTitleType(row.titleType))
    .sort((a, b) => {
      const dateA = a.dateRated ?? "";
      const dateB = b.dateRated ?? "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.year ?? 0) - (a.year ?? 0);
    });

  if (genreFilters.length > 0) {
    eligible = eligible.filter((row) =>
      importRowMatchesGenreFilter(row.genres, genreFilters),
    );
  }

  if (languageFilters.length > 0) {
    const tmdbIds = eligible
      .map((row) => row.tmdbId)
      .filter((id): id is number => id != null);
    const langByTmdb = await loadCachedOriginalLanguages(tmdbIds);
    eligible = eligible.filter((row) => {
      if (!row.tmdbId) return false;
      const lang = langByTmdb.get(row.tmdbId);
      return lang != null && languageFilters.includes(lang);
    });
  }

  const total = eligible.length;
  const slice = eligible.slice((page - 1) * limit, page * limit);

  const ENRICH_CONCURRENCY = 6;
  const movies: MovieCandidate[] = new Array(slice.length);
  let cursor = 0;

  await Promise.all(
    Array.from(
      { length: Math.min(ENRICH_CONCURRENCY, slice.length) },
      async () => {
        while (cursor < slice.length) {
          const index = cursor++;
          movies[index] = await enrichWatchedRow(slice[index]!);
        }
      },
    ),
  );

  const nextPage = page * limit < total ? page + 1 : null;
  return { movies, total, nextPage };
}

export async function getListMovies(
  action: "like" | "wishlist"
): Promise<MovieCandidate[]> {
  const wishlistIds = new Set(
    (
      await db
        .select({ tmdbId: swipeActions.tmdbId })
        .from(swipeActions)
        .where(eq(swipeActions.action, "wishlist"))
    ).map((r) => r.tmdbId)
  );

  const rows = await db
    .select()
    .from(swipeActions)
    .where(eq(swipeActions.action, action))
    .orderBy(desc(swipeActions.createdAt));

  const seen = new Set<number>();
  const results: MovieCandidate[] = [];

  for (const row of rows) {
    if (seen.has(row.tmdbId)) continue;
    if (action === "like" && wishlistIds.has(row.tmdbId)) continue;

    seen.add(row.tmdbId);

    try {
      const cached = row.payload
        ? (JSON.parse(row.payload) as MovieCandidate)
        : null;
      if (cached) {
        results.push(cached);
        continue;
      }
      const movie = await getEnrichedMovie(row.tmdbId);
      const imdb = await getImdbRatingForMovie(row.tmdbId, movie.imdbId);
      results.push({
        tmdbId: movie.tmdbId,
        imdbId: movie.imdbId,
        title: movie.title,
        originalTitle: movie.originalTitle,
        originalLanguage: movie.originalLanguage,
        overview: movie.overview,
        tagline: movie.tagline,
        year: movie.year,
        runtime: movie.runtime,
        genres: movie.genres,
        genreIds: movie.genreIds,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        images: movie.images,
        imdbRating: imdb.imdbRating,
        imdbVotes: imdb.imdbVotes,
        yourRating: null,
        matchScore: row.matchScore ?? 0,
        matchPercent: toMatchPercent(row.matchScore ?? 0),
        director: movie.director,
        cast: movie.cast,
      });
    } catch {
      continue;
    }
  }
  return results;
}

export async function removeFromLiked(tmdbId: number): Promise<boolean> {
  const existing = await db
    .select({ id: swipeActions.id })
    .from(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "like"))
    )
    .limit(1);

  if (existing.length === 0) return false;

  await db
    .delete(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "like"))
    );

  return true;
}

export async function removeFromWishlist(tmdbId: number): Promise<boolean> {
  const existing = await db
    .select({ id: swipeActions.id })
    .from(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "wishlist"))
    )
    .limit(1);

  if (existing.length === 0) return false;

  await db
    .delete(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "wishlist"))
    );

  return true;
}

export async function promoteToWishlist(tmdbId: number): Promise<boolean> {
  const rows = await db
    .select()
    .from(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "like"))
    )
    .orderBy(desc(swipeActions.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return false;

  const existingWishlist = await db
    .select({ id: swipeActions.id })
    .from(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "wishlist"))
    )
    .limit(1);

  if (existingWishlist.length === 0) {
    await db.insert(swipeActions).values({
      tmdbId: row.tmdbId,
      imdbId: row.imdbId,
      title: row.title,
      action: "wishlist",
      matchScore: row.matchScore,
      payload: row.payload,
      createdAt: new Date(),
    });
  }

  await db
    .delete(swipeActions)
    .where(
      and(eq(swipeActions.tmdbId, tmdbId), eq(swipeActions.action, "like"))
    );

  return true;
}

function parseImdbVotes(votes: string | null | undefined): number | null {
  if (!votes) return null;
  const n = Number.parseInt(String(votes).replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export async function isMovieInWatchedLibrary(
  tmdbId: number,
  imdbId?: string | null,
): Promise<boolean> {
  const rows = await db
    .select({ imdbId: importedRatings.imdbId })
    .from(importedRatings)
    .where(
      imdbId
        ? or(
            eq(importedRatings.tmdbId, tmdbId),
            eq(importedRatings.imdbId, imdbId),
          )
        : eq(importedRatings.tmdbId, tmdbId),
    )
    .limit(1);

  return rows.length > 0;
}

export async function markMovieAsWatched(
  tmdbId: number,
): Promise<{ alreadyWatched: boolean }> {
  if (await isMovieInWatchedLibrary(tmdbId)) {
    return { alreadyWatched: true };
  }

  const movie = await getEnrichedMovie(tmdbId);
  const imdb = await getImdbRatingForMovie(tmdbId, movie.imdbId).catch(() => ({
    imdbRating: null as number | null,
    imdbVotes: null as string | null,
  }));

  const imdbId = movie.imdbId ?? `tmdb:${tmdbId}`;

  if (imdbId !== `tmdb:${tmdbId}`) {
    const byImdb = await db
      .select()
      .from(importedRatings)
      .where(eq(importedRatings.imdbId, imdbId))
      .limit(1);
    if (byImdb.length > 0) {
      if (!byImdb[0].tmdbId) {
        await db
          .update(importedRatings)
          .set({ tmdbId })
          .where(eq(importedRatings.imdbId, imdbId));
      }
      return { alreadyWatched: true };
    }
  }

  await db.insert(importedRatings).values({
    imdbId,
    tmdbId,
    title: movie.title,
    originalTitle: movie.originalTitle,
    yourRating: null,
    imdbRating: imdb.imdbRating,
    imdbVotes: parseImdbVotes(imdb.imdbVotes),
    genres: movie.genres.join(", "),
    directors: movie.director || null,
    year: movie.year || null,
    runtime: movie.runtime,
    titleType: "movie",
    dateRated: new Date().toISOString().slice(0, 10),
    url: imdbTitleUrl(movie.imdbId),
  });

  return { alreadyWatched: false };
}

export async function getImportedCount(): Promise<number> {
  const rows = await db.select().from(importedRatings);
  return rows.length;
}

export async function getTopGenres(): Promise<string[]> {
  const profile = await getTasteProfile();
  if (!profile) return [];
  return Object.entries(profile.genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);
}
