import { normalizeGenreName } from "./genres";
import type { MovieCandidate } from "./types";

export interface ListFilters {
  genres: string[];
  languages: string[];
}

export function movieMatchesListFilters(
  movie: MovieCandidate,
  filters: ListFilters,
): boolean {
  if (filters.genres.length > 0) {
    const movieGenres = new Set(movie.genres.map((g) => normalizeGenreName(g)));
    const matchesGenre = filters.genres.some((g) =>
      movieGenres.has(normalizeGenreName(g)),
    );
    if (!matchesGenre) return false;
  }

  if (filters.languages.length > 0) {
    const lang = (movie.originalLanguage ?? "").toLowerCase();
    if (!lang || !filters.languages.includes(lang)) return false;
  }

  return true;
}

export function filterMoviesByListFilters(
  movies: MovieCandidate[],
  filters: ListFilters,
): MovieCandidate[] {
  if (filters.genres.length === 0 && filters.languages.length === 0) {
    return movies;
  }
  return movies.filter((m) => movieMatchesListFilters(m, filters));
}

function parseCsvGenres(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((g) => normalizeGenreName(g.trim()))
    .filter(Boolean);
}

export function importRowMatchesGenreFilter(
  genresCsv: string | null | undefined,
  selectedGenres: string[],
): boolean {
  if (selectedGenres.length === 0) return true;
  const rowGenres = new Set(parseCsvGenres(genresCsv));
  return selectedGenres.some((g) => rowGenres.has(normalizeGenreName(g)));
}
