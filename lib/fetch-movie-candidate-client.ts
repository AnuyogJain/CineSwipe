import { stubMovieCandidate } from "@/lib/stub-movie-candidate";
import type { MovieCandidate } from "@/lib/types";

export async function fetchMovieCandidateByTmdbId(
  tmdbId: number,
): Promise<MovieCandidate | null> {
  const res = await fetch(`/api/movies/${tmdbId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.tmdbId) return null;
  return stubMovieCandidate({
    tmdbId: data.tmdbId,
    title: data.title,
    year: data.year,
    posterPath: data.posterPath,
    imdbId: data.imdbId,
    imdbRating: data.imdbRating ?? null,
    yourRating: data.yourRating ?? null,
    fallbackPlaceholder: true,
  });
}
