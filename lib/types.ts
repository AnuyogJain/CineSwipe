export interface TasteProfileData {
  genres: Record<string, number>;
  directors: Record<string, number>;
  cast: Record<string, number>;
  decades: Record<string, number>;
  avgRuntime: number;
  titleTypeBias: Record<string, number>;
  genrePenalties: Record<string, number>;
}

export interface MovieCandidate {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle?: string;
  originalLanguage?: string;
  overview: string;
  tagline?: string;
  year: number;
  runtime: number | null;
  genres: string[];
  genreIds: number[];
  posterPath: string | null;
  backdropPath: string | null;
  images: string[];
  imdbRating: number | null;
  imdbVotes: string | null;
  yourRating: number | null;
  matchScore: number;
  matchPercent: number;
  reason?: string;
  director?: string;
  writers?: string[];
  releaseDate?: string | null;
  status?: string | null;
  countries?: string[];
  cast: Array<{ id: number; name: string; character: string; profilePath: string | null }>;
}

export interface ApiKeys {
  tmdbApiKey: string | null;
  omdbApiKey: string | null;
}

export interface OmdbRating {
  imdbRating: number | null;
  imdbVotes: string | null;
}
