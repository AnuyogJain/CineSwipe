import { COUNTRY_CENTROIDS } from "./countries";
import { normalizeGenreName } from "./genres";
import type { MovieCandidate } from "./types";

export interface ListFilters {
  genres: string[];
  languages: string[];
  countries: string[];
}

export const EMPTY_LIST_FILTERS: ListFilters = {
  genres: [],
  languages: [],
  countries: [],
};

export function normalizeCountryCodes(codes: string[]): string[] {
  return [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
}

function movieCountryCodes(movie: MovieCandidate): Set<string> {
  const codes = new Set<string>();
  for (const raw of movie.countryCodes ?? []) {
    const iso = raw.trim().toUpperCase();
    if (iso) codes.add(iso);
  }
  if (codes.size > 0) return codes;

  for (const name of movie.countries ?? []) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    for (const [iso, info] of Object.entries(COUNTRY_CENTROIDS)) {
      if (info.name === trimmed) codes.add(iso);
    }
  }
  return codes;
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

  if (filters.countries.length > 0) {
    const selected = new Set(normalizeCountryCodes(filters.countries));
    const movieCodes = movieCountryCodes(movie);
    const matchesCountry = [...selected].some((iso) => movieCodes.has(iso));
    if (!matchesCountry) return false;
  }

  return true;
}

export function filterMoviesByListFilters(
  movies: MovieCandidate[],
  filters: ListFilters,
): MovieCandidate[] {
  if (
    filters.genres.length === 0 &&
    filters.languages.length === 0 &&
    filters.countries.length === 0
  ) {
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

export function rowMatchesCountryFilter(
  countryCodes: string[] | undefined,
  selectedCountries: string[],
): boolean {
  if (selectedCountries.length === 0) return true;
  const selected = new Set(normalizeCountryCodes(selectedCountries));
  const rowCodes = new Set(normalizeCountryCodes(countryCodes ?? []));
  return [...selected].some((iso) => rowCodes.has(iso));
}
