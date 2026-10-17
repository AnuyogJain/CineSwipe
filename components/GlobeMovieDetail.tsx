"use client";

import type { GlobeMovie } from "@/lib/globe-types";
import { posterUrl } from "@/lib/images";
import type { MovieCandidate } from "@/lib/types";
import { MovieDetailPanel } from "./MovieDetailPanel";

interface GlobeMovieDetailPanelProps {
  movie: GlobeMovie | null;
  onClose: () => void;
  onBack: () => void;
}

function globeMovieToCandidate(movie: GlobeMovie): MovieCandidate {
  const poster = movie.posterPath ? posterUrl(movie.posterPath) : null;
  return {
    tmdbId: movie.tmdbId,
    imdbId: null,
    title: movie.title,
    overview: "",
    year: movie.year,
    runtime: null,
    genres: [],
    genreIds: [],
    posterPath: movie.posterPath,
    backdropPath: null,
    images: poster ? [poster] : ["/placeholder-poster.svg"],
    imdbRating: movie.imdbRating,
    imdbVotes: null,
    yourRating: movie.yourRating,
    matchScore: 0,
    matchPercent: 0,
    cast: [],
  };
}

export function GlobeMovieDetailPanel({
  movie,
  onClose,
  onBack,
}: GlobeMovieDetailPanelProps) {
  return (
    <MovieDetailPanel
      movie={movie ? globeMovieToCandidate(movie) : null}
      headerContext={movie?.countryName}
      onClose={onClose}
      onBack={onBack}
    />
  );
}
