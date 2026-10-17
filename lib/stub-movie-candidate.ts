import type { GlobeMovie } from "./globe-types";
import { posterUrl } from "./images";
import type { MovieCandidate } from "./types";

export interface StubMovieCandidateInput {
  tmdbId: number;
  title: string;
  year?: number;
  posterPath?: string | null;
  imdbId?: string | null;
  imdbRating?: number | null;
  yourRating?: number | null;
  /** Use `/placeholder-poster.svg` when TMDB has no poster */
  fallbackPlaceholder?: boolean;
  posterImageSize?: "w92" | "w185" | "w342" | "w500";
}

/** Minimal candidate for MovieDetailPanel — full detail loaded via `/api/movies/[tmdbId]`. */
export function stubMovieCandidate(
  input: StubMovieCandidateInput,
): MovieCandidate {
  const size = input.posterImageSize ?? "w500";
  const poster = posterUrl(input.posterPath ?? null, size);
  let images: string[];
  if (poster) {
    images = [poster];
  } else if (input.fallbackPlaceholder) {
    images = ["/placeholder-poster.svg"];
  } else {
    images = [];
  }

  return {
    tmdbId: input.tmdbId,
    imdbId: input.imdbId ?? null,
    title: input.title,
    overview: "",
    year: input.year ?? 0,
    runtime: null,
    genres: [],
    genreIds: [],
    posterPath: input.posterPath ?? null,
    backdropPath: null,
    images,
    imdbRating: input.imdbRating ?? null,
    imdbVotes: null,
    yourRating: input.yourRating ?? null,
    matchScore: 0,
    matchPercent: 0,
    cast: [],
  };
}

export function stubMovieCandidateFromGlobe(movie: GlobeMovie): MovieCandidate {
  return stubMovieCandidate({
    tmdbId: movie.tmdbId,
    title: movie.title,
    year: movie.year,
    posterPath: movie.posterPath,
    imdbRating: movie.imdbRating,
    yourRating: movie.yourRating,
    fallbackPlaceholder: true,
  });
}
