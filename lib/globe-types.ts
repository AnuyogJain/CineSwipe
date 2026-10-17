export type GlobeSource = "viewed" | "liked" | "wishlist" | "recommend";

export function parseGlobeSource(value: string | null): GlobeSource {
  if (
    value === "liked" ||
    value === "wishlist" ||
    value === "viewed" ||
    value === "recommend"
  ) {
    return value;
  }
  return "viewed";
}

export interface GlobeCountry {
  iso: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
}

export interface GlobeMovie {
  tmdbId: number;
  title: string;
  year: number;
  posterPath: string | null;
  yourRating: number | null;
  imdbRating: number | null;
  countryIso: string;
  countryName: string;
  lat: number;
  lng: number;
}

export interface GlobeDataset {
  countries: GlobeCountry[];
  movies: GlobeMovie[];
  stats: { total: number; mapped: number; unmapped: number; excludedNonMovies: number };
}

export interface GlobeMovieDetail {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
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
  countryCodes?: string[];
  cast: Array<{ id: number; name: string; character: string; profilePath: string | null }>;
  imdbRating: number | null;
  imdbVotes: string | null;
  yourRating: number | null;
  inWatchedLibrary?: boolean;
  inLiked?: boolean;
  inWishlist?: boolean;
}
