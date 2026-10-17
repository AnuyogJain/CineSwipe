"use client";

import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/images";
import type { MovieCandidate } from "@/lib/types";

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
      <div className="mb-3 flex items-end justify-between gap-3 px-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-medium text-rose-300/90 transition hover:text-rose-200"
        >
          View all
        </Link>
      </div>
      {preview.length === 0 ? (
        <p className="px-4 text-sm text-white/40">{emptyHint}</p>
      ) : (
        <div className="home-row-scroll flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory">
          {preview.map((movie) => {
            const src = rowPoster(movie);
            return (
              <button
                key={movie.tmdbId}
                type="button"
                onClick={() => onSelectMovie(movie)}
                className="group relative w-[29vw] max-w-[132px] shrink-0 snap-start overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition hover:ring-rose-400/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/60"
              >
                <div className="relative aspect-[2/3] w-full">
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="132px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-800 text-xs text-white/30">
                      No poster
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-90" />
                  <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs font-semibold text-white">
                    {movie.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
