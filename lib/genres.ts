/** Map IMDb export genre labels to TMDB genre names. */
const IMDB_TO_TMDB: Record<string, string> = {
  "Sci-Fi": "Science Fiction",
  "Film-Noir": "Crime",
  "Talk-Show": "Documentary",
  "Game-Show": "Documentary",
  "Reality-TV": "Documentary",
};

export function normalizeGenreName(name: string): string {
  return IMDB_TO_TMDB[name] ?? name;
}

export function resolveGenreId(
  genreMap: Record<string, number>,
  genreName: string,
): number | undefined {
  const normalized = normalizeGenreName(genreName);

  if (genreMap[normalized]) return genreMap[normalized];

  const lower = normalized.toLowerCase();
  for (const [name, id] of Object.entries(genreMap)) {
    if (name.toLowerCase() === lower) return id;
  }

  for (const [name, id] of Object.entries(genreMap)) {
    if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
      return id;
    }
  }

  return undefined;
}

export function movieHasGenre(movieGenres: string[], filterGenre: string): boolean {
  const target = normalizeGenreName(filterGenre).toLowerCase();
  return movieGenres.some((g) => {
    const normalized = normalizeGenreName(g).toLowerCase();
    return normalized === target || normalized.includes(target) || target.includes(normalized);
  });
}

/** True if the movie matches at least one selected genre. */
export function movieHasAnyGenre(movieGenres: string[], filterGenres: string[]): boolean {
  if (filterGenres.length === 0) return true;
  return filterGenres.some((g) => movieHasGenre(movieGenres, g));
}
