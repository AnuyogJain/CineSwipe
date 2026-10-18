"use client";

import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import { backdropUrl, posterUrl } from "@/lib/images";
import type { MovieCandidate } from "@/lib/types";
import { ImdbRatingBadge } from "./ImdbRatingBadge";
import { GenreChip } from "./GenreChip";
import { CastRow } from "./CastRow";
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

export function profileGalleryImages(movie: MovieCandidate): string[] {
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

export interface MovieProfileViewProps {
  movie: MovieCandidate;
  activeGenres?: string[];
  activeCastId?: number;
  onGenreSelect?: (genre: string) => void;
  onCastSelect?: (member: { id: number; name: string }) => void;
  pitchAside?: ReactNode;
  footerHint?: string | null;
  compactHero?: boolean;
}

export function MovieProfileView({
  movie,
  activeGenres = [],
  activeCastId,
  onGenreSelect,
  onCastSelect,
  pitchAside,
  footerHint = "Swipe left or right to pass or like · scroll for more",
  compactHero = false,
}: MovieProfileViewProps) {
  const gallery = useMemo(() => profileGalleryImages(movie), [movie]);
  const extraImages = gallery.slice(1);

  return (
    <>
      <section
        className={`relative w-full overflow-hidden ${
          compactHero
            ? "min-h-[42dvh] max-h-[48dvh] sm:min-h-[38dvh]"
            : "min-h-[58dvh] sm:min-h-[52dvh]"
        }`}
      >
        <ProfileImage
          src={gallery[0]!}
          priority
          sizes="(max-width: 768px) 100vw, 420px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-black/30 rounded-md" />

        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
          <h2
            id="movie-detail-title"
            className="font-display text-3xl font-bold leading-tight text-white drop-shadow-md"
          >
            {movie.title}
            {movie.year ? (
              <span className="font-normal text-white/75">, {movie.year}</span>
            ) : null}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {movie.genres.slice(0, 2).map((g) => (
              <MovieMetaPill key={g}>{g}</MovieMetaPill>
            ))}
            {movie.runtime ? (
              <MovieMetaPill>{formatRuntime(movie.runtime)}</MovieMetaPill>
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

      <ProfileBlock title="The pitch" aside={pitchAside}>
        {movie.reason ? (
          <p className="text-sm leading-relaxed text-emerald-100/95">
            {movie.reason}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-white/70">
            {movie.overview
              ? movie.overview.slice(0, 280) +
                (movie.overview.length > 280 ? "…" : "")
              : "Scroll for the full story."}
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
          <ProfileStill src={extraImages[0]} />
          <ProfileBlock title="Quick facts">
            <QuickFactsGrid movie={movie} />
          </ProfileBlock>
        </>
      ) : (
        <ProfileBlock title="Quick facts">
          <QuickFactsGrid movie={movie} />
        </ProfileBlock>
      )}

      {extraImages[1] ? (
        <>
          <ProfileStill src={extraImages[1]} />
          {movie.genres.length > 0 ? (
            <ProfileBlock title="Vibes & genres">
              <GenresList
                genres={movie.genres}
                activeGenres={activeGenres}
                onGenreSelect={onGenreSelect}
              />
            </ProfileBlock>
          ) : null}
        </>
      ) : movie.genres.length > 0 ? (
        <ProfileBlock title="Vibes & genres">
          <GenresList
            genres={movie.genres}
            activeGenres={activeGenres}
            onGenreSelect={onGenreSelect}
          />
        </ProfileBlock>
      ) : null}

      {extraImages[2] ? (
        <>
          <ProfileStill src={extraImages[2]} />
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

      {extraImages[3] ? <ProfileStill src={extraImages[3]} /> : null}

      {(movie.writers && movie.writers.length > 0) || movie.cast.length > 0 ? (
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
        <ProfileStill src={extraImages[4]} className="mb-2" />
      ) : null}

      {footerHint ? (
        <p className="px-4 pb-4 text-center text-[11px] text-white/35">
          {footerHint}
        </p>
      ) : null}
    </>
  );
}

function QuickFactsGrid({ movie }: { movie: MovieCandidate }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <DetailItem
        label="Release"
        value={formatReleaseDate(movie.releaseDate, movie.year)}
      />
      <DetailItem label="Runtime" value={formatRuntime(movie.runtime)} />
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
  );
}

function GenresList({
  genres,
  activeGenres,
  onGenreSelect,
}: {
  genres: string[];
  activeGenres: string[];
  onGenreSelect?: (genre: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
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
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md relative aspect-video min-h-[160px] w-full overflow-hidden bg-zinc-900 ${className}`}
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
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="my-3 rounded-md bg-[var(--pill-bg)] px-4 py-4 ring-1 ring-white/8">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.15em] text-[var(--cinema-gold)]">
          {title}
        </h3>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
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

export function MovieProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="min-h-[52dvh] w-full bg-white/5" />
      <div className="mx-3 my-3 space-y-3 rounded-2xl bg-white/5 p-4">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-8 w-32 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
