"use client";

import { posterUrl } from "@/lib/images";
import type { MovieCandidate } from "@/lib/types";
import { PosterCard } from "./ui/PosterCard";
import { SectionHeader } from "./ui/SectionHeader";

const ROW_PREVIEW = 12;

interface HomeMovieRowProps {
  title: string;
  viewAllHref: string;
  movies: MovieCandidate[];
  emptyHint: string;
  onSelectMovie: (movie: MovieCandidate) => void;
}

function rowPoster(movie: MovieCandidate): string | null {
  const fromPath = posterUrl(movie.posterPath, "w342");
  if (fromPath) return fromPath;
  const first = movie.images[0];
  return first?.startsWith("http") ? first : null;
}

export function HomeMovieRow({
  title,
  viewAllHref,
  movies,
  emptyHint,
  onSelectMovie,
}: HomeMovieRowProps) {
  const preview = movies.slice(0, ROW_PREVIEW);

  return (
    <section className="mb-7">
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      {preview.length === 0 ? (
        <p className="text-sm text-subtle">{emptyHint}</p>
      ) : (
        <div className="row-edge-fade scrollbar-hide flex gap-3 overflow-x-auto overflow-y-hidden pb-1 snap-x snap-mandatory">
          {preview.map((movie) => (
            <PosterCard
              key={movie.tmdbId}
              title={movie.title}
              imageSrc={rowPoster(movie)}
              onClick={() => onSelectMovie(movie)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
