"use client";

import Image from "next/image";
import type { MovieCandidate } from "@/lib/types";
import { Star } from "@/components/icons";
import { ImdbRatingBadge } from "./ImdbRatingBadge";

interface MovieGridProps {
  movies: MovieCandidate[];
  emptyMessage: string;
  showWishlistButton?: boolean;
  showDeleteButton?: boolean;
  onWishlist?: (tmdbId: number) => void;
  onDelete?: (tmdbId: number) => void;
  onSelectMovie?: (movie: MovieCandidate) => void;
}

export function MovieGrid({
  movies,
  emptyMessage,
  showWishlistButton,
  showDeleteButton,
  onWishlist,
  onDelete,
  onSelectMovie,
}: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-white/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-1 p-4 sm:grid-cols-3">
      {movies.map((movie) => {
        const image = movie.images[0];
        return (
          <article
            key={movie.imdbId ?? `tmdb-${movie.tmdbId}`}
            className={`poster-card${onSelectMovie ? " cursor-pointer" : ""}`}
          >
            <div
              className="relative aspect-[2/3] w-full"
              role={onSelectMovie ? "button" : undefined}
              tabIndex={onSelectMovie ? 0 : undefined}
              onClick={() => onSelectMovie?.(movie)}
              onKeyDown={(event) => {
                if (!onSelectMovie) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectMovie(movie);
                }
              }}
            >
              {image?.startsWith("http") ? (
                <Image
                  src={image}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-white/30">
                  ?
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              {showDeleteButton ? (
                <button
                  type="button"
                  aria-label={`Remove ${movie.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.(movie.tmdbId);
                  }}
                  className="cursor-pointer absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xl leading-none text-white backdrop-blur-sm ring-1 ring-white/25 transition hover:bg-black/75"
                >
                  ×
                </button>
              ) : null}
              <div className="absolute bottom-2 left-2 right-2 space-y-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-white">
                  {movie.title}
                </h3>
                <ImdbRatingBadge
                  rating={movie.imdbRating}
                  imdbId={movie.imdbId}
                  votes={movie.imdbVotes}
                  compact
                />
              </div>
            </div>
            {showWishlistButton ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onWishlist?.(movie.tmdbId);
                }}
                className="flex w-full items-center justify-center gap-1.5 border-t border-white/5 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-400/10"
              >
                <Star
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                Move to Wishlist
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
