"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { movieCarouselImages } from "@/lib/images";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { MovieCandidate } from "@/lib/types";
import { ImdbRatingBadge } from "./ImdbRatingBadge";
import { GenreChip } from "./GenreChip";
import { CastRow } from "./CastRow";
import { ActionBar } from "./ActionBar";

function formatRuntime(minutes: number | null) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatReleaseDate(date: string | null | undefined, year: number) {
  if (date) {
    try {
      return new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return year ? String(year) : "—";
    }
  }
  return year ? String(year) : "—";
}

interface MovieCardProps {
  movie: MovieCandidate;
  activeGenres?: string[];
  activeCastId?: number;
  onSwipe: (direction: "left" | "right") => void;
  onPass: () => void;
  onLike: () => void;
  onWishlist: () => void;
  onWatched: () => void;
  watched?: boolean;
  onGenreSelect?: (genre: string) => void;
  onCastSelect?: (cast: { id: number; name: string }) => void;
  disabled?: boolean;
}

export function MovieCard({
  movie,
  activeGenres = [],
  activeCastId,
  onSwipe,
  onPass,
  onLike,
  onWishlist,
  onWatched,
  watched = false,
  onGenreSelect,
  onCastSelect,
  disabled,
}: MovieCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);

  const images = useMemo(
    () =>
      movieCarouselImages(
        movie.images.length > 0 ? movie.images : ["/placeholder-poster.svg"],
      ),
    [movie.images],
  );
  const currentImage = images[imageIndex % images.length];

  useEffect(() => {
    setImageIndex(0);
  }, [movie.tmdbId]);

  return (
    <div className="theme-keep-dark relative mx-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
      {/* Only scroll container in the app */}
      <div className="card-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <motion.div
          style={{ x, rotate }}
          drag={disabled ? false : "x"}
          dragElastic={0.85}
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(_, info) => x.set(info.offset.x)}
          onDragEnd={(_, info) => {
            if (disabled) return;
            if (info.offset.x > 120 || info.velocity.x > 600) {
              onSwipe("right");
            } else if (info.offset.x < -120 || info.velocity.x < -600) {
              onSwipe("left");
            } else {
              x.set(0);
            }
          }}
          className="relative touch-pan-y"
        >
          <button
            type="button"
            className="relative block h-56 w-full overflow-hidden sm:h-64"
            onClick={() => setImageIndex((i) => i + 1)}
          >
            {currentImage.startsWith("http") ? (
              <Image
                src={currentImage}
                alt={movie.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 420px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-white/30">
                No poster
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

            <motion.div
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute left-6 top-6 rotate-[-12deg] rounded-lg border-4 border-emerald-400 px-4 py-2 text-2xl font-black uppercase tracking-widest text-emerald-400"
            >
              Like
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="pointer-events-none absolute right-6 top-6 rotate-[12deg] rounded-lg border-4 border-rose-400 px-4 py-2 text-2xl font-black uppercase tracking-widest text-rose-400"
            >
              Nope
            </motion.div>

            {images.length > 1 ? (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white/70">
                Tap to change image · {(imageIndex % images.length) + 1}/
                {images.length}
              </span>
            ) : null}
          </button>

          <div className="space-y-4 px-4 pb-5 pt-3">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-white">
                {movie.title}
              </h2>
              {movie.originalTitle && movie.originalTitle !== movie.title ? (
                <p className="mt-1 text-sm text-white/50">
                  {movie.originalTitle}
                </p>
              ) : null}
              {movie.tagline ? (
                <p className="mt-2 text-sm italic text-rose-200/70">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              ) : null}
            </div>

            <ImdbRatingBadge
              rating={movie.imdbRating}
              imdbId={movie.imdbId}
              votes={movie.imdbVotes}
              size="lg"
            />

            {movie.reason ? (
              <p className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm leading-relaxed text-emerald-200/90 ring-1 ring-emerald-400/20">
                {movie.reason}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <DetailItem
                label="Release"
                value={formatReleaseDate(movie.releaseDate, movie.year)}
              />
              <DetailItem
                label="Runtime"
                value={formatRuntime(movie.runtime)}
              />
              <DetailItem label="Director" value={movie.director || "—"} />
              <DetailItem
                label="Status"
                value={movie.status?.replace(/_/g, " ") || "—"}
              />
              {movie.countries && movie.countries.length > 0 ? (
                <DetailItem
                  label="Country"
                  value={movie.countries.slice(0, 2).join(", ")}
                  className="col-span-2"
                />
              ) : null}
            </div>

            {movie.genres.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
                  Genres
                </p>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => {
                    const active = activeGenres.some(
                      (g) => g.toLowerCase() === genre.toLowerCase()
                    );
                    return (
                      <GenreChip
                        key={genre}
                        label={genre}
                        active={active}
                        onClick={() => onGenreSelect?.(genre)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            {movie.writers && movie.writers.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Writers
                </p>
                <p className="mt-1 text-sm text-white/75">
                  {movie.writers.join(", ")}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
                Synopsis
              </p>
              <p className="text-sm leading-relaxed text-white/75">
                {movie.overview || "No description available."}
              </p>
            </div>

            <CastRow
              cast={movie.cast}
              activeCastId={activeCastId}
              onSelect={(m) => onCastSelect?.(m)}
            />

            <div className="rounded-xl bg-white/5 p-3 text-xs text-white/45">
              Swipe the poster left/right to pass or like. Scroll for full
              details.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky CTAs only — genre browse stays in the top bar */}
      <div className="z-20 shrink-0 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl">
        <ActionBar
          onPass={onPass}
          onLike={onLike}
          onWishlist={onWishlist}
          onWatched={onWatched}
          watched={watched}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white/5 px-3 py-2 ${className}`}>
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white/85">{value}</p>
    </div>
  );
}
