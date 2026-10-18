"use client";

import Image from "next/image";
import { useEffect, useMemo, type ReactNode } from "react";
import { backdropUrl, posterUrl } from "@/lib/images";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { MovieCandidate } from "@/lib/types";
import { ImdbRatingBadge } from "./ImdbRatingBadge";
import { GenreChip } from "./GenreChip";
import { CastRow } from "./CastRow";
import { ActionBar, actionSideButtonClass } from "./ActionBar";
import { iconActionClass, Undo2 } from "@/components/icons";
import { MovieMetaPill } from "./ui/MovieMetaPill";

const PROFILE_IMAGE_MAX = 5;

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

/** Up to 5 unique stills — poster first for tall “profile” hero, then API gallery. */
function profileGalleryImages(movie: MovieCandidate): string[] {
  const ordered: string[] = [];
  const push = (url: string | null) => {
    if (!url || !url.startsWith("http")) return;
    if (!ordered.includes(url)) ordered.push(url);
  };

  push(posterUrl(movie.posterPath, "w780"));
  push(backdropUrl(movie.backdropPath, "w780"));
  for (const url of movie.images) push(url);

  if (ordered.length === 0) {
    return ["/placeholder-poster.svg"];
  }
  return ordered.slice(0, PROFILE_IMAGE_MAX);
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
  undoAvailable?: boolean;
  onUndo?: () => void;
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
  undoAvailable = false,
  onUndo,
}: MovieCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-6, 6]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  /** Match like ramp; [0,1] on [-120,-20] extrapolates to full opacity at x=0. */
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);
  const likeGlow = useTransform(
    likeOpacity,
    [0, 1],
    [
      "0 0 0 rgba(52,211,153,0)",
      "0 0 28px rgba(52,211,153,0.95), 0 0 56px rgba(16,185,129,0.45)",
    ]
  );
  const nopeGlow = useTransform(
    nopeOpacity,
    [0, 1],
    [
      "0 0 0 rgba(251,113,133,0)",
      "0 0 28px rgba(251,113,133,0.95), 0 0 56px rgba(244,63,94,0.45)",
    ]
  );

  const gallery = useMemo(() => profileGalleryImages(movie), [movie]);

  useEffect(() => {
    x.set(0);
  }, [movie.tmdbId, x]);

  const extraImages = gallery.slice(1);

  return (
    <div className="theme-keep-dark relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-3xl bg-zinc-950 shadow-2xl ring-1 ring-white/10">
      <div className="relative min-h-0 flex-1">
        <div className="card-scroll  h-full overflow-y-auto overscroll-contain pb-24">
          <motion.div
            style={{ x, rotate, touchAction: "pan-y pinch-zoom" }}
            drag={disabled ? false : "x"}
            dragListener={true}
            dragElastic={0.82}
            dragConstraints={{ left: 0, right: 0 }}
            dragDirectionLock
            onDrag={(_, info) => x.set(info.offset.x)}
            onDragEnd={(_, info) => {
              if (disabled) return;
              if (info.offset.x > 120 || info.velocity.x > 600) {
                x.set(0);
                onSwipe("right");
              } else if (info.offset.x < -120 || info.velocity.x < -600) {
                x.set(0);
                onSwipe("left");
              } else {
                x.set(0);
              }
            }}
            className="swipe-card-profile relative select-none touch-pan-y"
          >
            <section className="relative min-h-[58dvh] w-full overflow-hidden sm:min-h-[52dvh]">
              <ProfileImage
                src={gallery[0]!}
                priority
                sizes="(max-width: 768px) 100vw, 420px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-black/30" />

              <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                <h2 className="font-display text-3xl font-bold leading-tight text-white drop-shadow-md">
                  {movie.title}
                  {movie.year ? (
                    <span className="font-normal text-white/75">
                      , {movie.year}
                    </span>
                  ) : null}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {movie.genres.slice(0, 2).map((g) => (
                    <MovieMetaPill key={g}>{g}</MovieMetaPill>
                  ))}
                  {movie.runtime ? (
                    <MovieMetaPill>
                      {formatRuntime(movie.runtime)}
                    </MovieMetaPill>
                  ) : null}
                </div>
                {movie.originalTitle && movie.originalTitle !== movie.title ? (
                  <p className="mt-1.5 text-sm text-white/60">
                    {movie.originalTitle}
                  </p>
                ) : null}
                {movie.tagline ? (
                  <p className="mt-2 text-sm italic text-white/80">
                    &ldquo;{movie.tagline}&rdquo;
                  </p>
                ) : null}
              </div>
            </section>

            <ProfileBlock title="The pitch">
              {movie.reason ? (
                <p className="text-sm leading-relaxed text-emerald-100/95">
                  {movie.reason}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/70">
                  Scroll for the full story — swipe right if it&apos;s your kind
                  of film.
                </p>
              )}
              <div className="mt-3">
                <ImdbRatingBadge
                  rating={movie.imdbRating}
                  imdbId={movie.imdbId}
                  votes={movie.imdbVotes}
                  size="lg"
                />
              </div>
            </ProfileBlock>

            {extraImages[0] ? (
              <>
                <ProfileStill src={extraImages[0]} aspect="wide" />
                <ProfileBlock title="Quick facts">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <DetailItem
                      label="Release"
                      value={formatReleaseDate(movie.releaseDate, movie.year)}
                    />
                    <DetailItem
                      label="Runtime"
                      value={formatRuntime(movie.runtime)}
                    />
                    <DetailItem
                      label="Director"
                      value={movie.director || "—"}
                    />
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
                </ProfileBlock>
              </>
            ) : (
              <ProfileBlock title="Quick facts">
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
                </div>
              </ProfileBlock>
            )}

            {extraImages[1] ? (
              <>
                <ProfileStill src={extraImages[1]} aspect="wide" />
                {movie.genres.length > 0 ? (
                  <ProfileBlock title="Vibes & genres">
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
                  </ProfileBlock>
                ) : null}
              </>
            ) : movie.genres.length > 0 ? (
              <ProfileBlock title="Vibes & genres">
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
              </ProfileBlock>
            ) : null}

            {extraImages[2] ? (
              <>
                <ProfileStill src={extraImages[2]} aspect="wide" />
                <ProfileBlock title="About the film">
                  <p className="text-sm leading-relaxed text-white/80">
                    {movie.overview || "No description available."}
                  </p>
                </ProfileBlock>
              </>
            ) : (
              <ProfileBlock title="About the film">
                <p className="text-sm leading-relaxed text-white/80">
                  {movie.overview || "No description available."}
                </p>
              </ProfileBlock>
            )}

            {extraImages[3] ? (
              <ProfileStill src={extraImages[3]} aspect="wide" />
            ) : null}

            {(movie.writers && movie.writers.length > 0) ||
            movie.cast.length > 0 ? (
              <ProfileBlock title="People">
                {movie.writers && movie.writers.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Writers
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      {movie.writers.join(", ")}
                    </p>
                  </div>
                ) : null}
                <CastRow
                  cast={movie.cast}
                  activeCastId={activeCastId}
                  onSelect={(m) => onCastSelect?.(m)}
                />
              </ProfileBlock>
            ) : null}

            {extraImages[4] ? (
              <ProfileStill
                src={extraImages[4]}
                aspect="wide"
                className="mb-2"
              />
            ) : null}

            <p className="px-4 pb-4 text-center text-[11px] text-white/35">
              Swipe left or right to pass or like · scroll for more
            </p>
          </motion.div>
        </div>

        <motion.div
          aria-hidden
          style={{ x, rotate }}
          className="pointer-events-none absolute inset-0 z-40 flex items-start justify-between px-5 pt-14"
        >
          <motion.div
            style={{ opacity: likeOpacity, boxShadow: likeGlow }}
            className="swipe-stamp swipe-stamp--like rotate-[-12deg] rounded-lg border-4 border-emerald-400 bg-zinc-950/55 px-4 py-2 text-2xl font-black uppercase tracking-widest text-emerald-300 backdrop-blur-sm"
          >
            Like
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity, boxShadow: nopeGlow }}
            className="swipe-stamp swipe-stamp--nope rotate-[12deg] rounded-lg border-4 border-rose-400 bg-zinc-950/55 px-4 py-2 text-2xl font-black uppercase tracking-widest text-rose-300 backdrop-blur-sm"
          >
            Nope
          </motion.div>
        </motion.div>

        {onUndo ? (
          <div className="pointer-events-none absolute right-0 top-0 z-20 flex pr-3 pt-3">
            <button
              type="button"
              disabled={disabled || !undoAvailable}
              onClick={onUndo}
              aria-label="Undo last pass"
              title={
                undoAvailable
                  ? "Bring back last passed movie"
                  : "Undo last pass"
              }
              className={`pointer-events-auto ${actionSideButtonClass} ${
                undoAvailable
                  ? "bg-amber-500/15 text-amber-200 ring-amber-400/40 hover:bg-amber-400/10"
                  : "text-amber-300/45 ring-amber-300/20"
              }`}
            >
              <Undo2 className={iconActionClass} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3">
          <ActionBar
            className="pointer-events-auto"
            onPass={onPass}
            onLike={onLike}
            onWishlist={onWishlist}
            onWatched={onWatched}
            watched={watched}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileImage({
  src,
  priority,
  sizes,
}: {
  src: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div className="absolute inset-0">
      {src.startsWith("http") ? (
        <Image
          src={src}
          alt=""
          fill
          draggable={false}
          className="swipe-card-media object-cover object-top"
          priority={priority}
          sizes={sizes}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/30">
          No poster
        </div>
      )}
    </div>
  );
}

function ProfileStill({
  src,
  aspect,
  className = "",
}: {
  src: string;
  aspect: "tall" | "wide";
  className?: string;
}) {
  const aspectClass =
    aspect === "tall"
      ? "aspect-[4/5] min-h-[220px]"
      : "aspect-video min-h-[160px]";

  return (
    <div
      className={`relative w-full touch-pan-y overflow-hidden bg-zinc-900 ${aspectClass} ${className}`}
    >
      {src.startsWith("http") ? (
        <Image
          src={src}
          alt=""
          fill
          draggable={false}
          className="swipe-card-media object-cover"
          sizes="(max-width: 768px) 100vw, 420px"
        />
      ) : null}
    </div>
  );
}

function ProfileBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="my-3 rounded-2xl bg-[var(--pill-bg)] px-4 py-4 ring-1 ring-white/8">
      <h3 className="font-display mb-2.5 text-xs font-bold uppercase tracking-[0.15em] text-[var(--cinema-gold)]">
        {title}
      </h3>
      {children}
    </section>
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
    <div className={`rounded-xl bg-black/25 px-3 py-2 ${className}`}>
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white/85">{value}</p>
    </div>
  );
}
