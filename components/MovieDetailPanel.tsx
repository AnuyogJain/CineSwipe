"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { markMovieWatched } from "@/lib/mark-watched-client";
import { motion, AnimatePresence } from "framer-motion";
import type { GlobeMovieDetail } from "@/lib/globe-types";
import { movieCarouselImages, posterUrl } from "@/lib/images";
import type { MovieCandidate } from "@/lib/types";
import { ImdbRatingBadge } from "./ImdbRatingBadge";
import { CastRow } from "./CastRow";

export interface MovieDetailPanelProps {
  movie: MovieCandidate | null;
  onClose: () => void;
  onBack?: () => void;
  /** Small label above title in header (e.g. country on globe) */
  headerContext?: string;
}

function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
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
      return year ? String(year) : null;
    }
  }
  return year ? String(year) : null;
}

function candidateToDetail(movie: MovieCandidate): GlobeMovieDetail {
  return {
    tmdbId: movie.tmdbId,
    imdbId: movie.imdbId,
    title: movie.title,
    originalTitle: movie.originalTitle ?? movie.title,
    originalLanguage: movie.originalLanguage ?? "",
    overview: movie.overview,
    tagline: movie.tagline ?? "",
    year: movie.year,
    releaseDate: movie.releaseDate ?? null,
    runtime: movie.runtime,
    status: movie.status ?? null,
    genres: movie.genres,
    genreIds: movie.genreIds,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    images:
      movie.images.length > 0 ? movie.images : ["/placeholder-poster.svg"],
    director: movie.director ?? "",
    writers: movie.writers ?? [],
    countries: movie.countries ?? [],
    cast: movie.cast,
    imdbRating: movie.imdbRating,
    imdbVotes: movie.imdbVotes,
    yourRating: movie.yourRating,
  };
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="globe-modal__stat">
      <p className="globe-modal__stat-label">{label}</p>
      <p className="globe-modal__stat-value">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/10] w-full bg-white/5" />
      <div className="space-y-4 px-5 py-5">
        <div className="h-7 w-4/5 rounded-lg bg-white/10" />
        <div className="h-4 w-2/5 rounded bg-white/5" />
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-full bg-white/10" />
          <div className="h-8 w-16 rounded-full bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-3/4 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="globe-modal__icon-btn"
    >
      {children}
    </button>
  );
}

export function MovieDetailPanel({
  movie,
  onClose,
  onBack,
  headerContext,
}: MovieDetailPanelProps) {
  const [detail, setDetail] = useState<GlobeMovieDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [watchedBusy, setWatchedBusy] = useState(false);
  const [inWatchedLibrary, setInWatchedLibrary] = useState(false);

  const handleBack = onBack ?? onClose;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!movie) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [movie, handleKeyDown]);

  useEffect(() => {
    if (!movie) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setImageIndex(0);
    setInWatchedLibrary(false);
    setWatchedBusy(false);

    if (!movie.tmdbId) {
      setDetail(candidateToDetail(movie));
      setInWatchedLibrary(Boolean(movie.yourRating != null));
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const res = await fetch(`/api/movies/${movie.tmdbId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load movie");
        if (!cancelled) {
          setDetail({
            ...(data as GlobeMovieDetail),
            yourRating: data.yourRating ?? movie.yourRating,
            inWatchedLibrary: Boolean(data.inWatchedLibrary),
          });
          setInWatchedLibrary(Boolean(data.inWatchedLibrary));
        }
      } catch (err) {
        if (!cancelled) {
          setDetail(candidateToDetail(movie));
          setInWatchedLibrary(Boolean(movie.yourRating != null));
          setError(
            err instanceof Error ? err.message : "Failed to load full details"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [movie]);

  const images = useMemo(() => {
    const raw =
      detail && detail.images.length > 0
        ? detail.images
        : detail?.posterPath
          ? [posterUrl(detail.posterPath)!]
          : ["/placeholder-poster.svg"];
    return movieCarouselImages(raw);
  }, [detail]);
  const currentImage = images[imageIndex % images.length];
  const releaseLabel = detail
    ? formatReleaseDate(detail.releaseDate, detail.year)
    : movie
    ? String(movie.year || "")
    : null;
  const runtimeLabel = detail ? formatRuntime(detail.runtime) : null;
  const contextLabel =
    headerContext ?? (movie?.year ? String(movie.year) : "Movie");

  const watchedActive = inWatchedLibrary || Boolean(detail?.inWatchedLibrary);

  const handleMarkWatched = async () => {
    if (!movie?.tmdbId || watchedActive || watchedBusy) return;
    setWatchedBusy(true);
    try {
      const result = await markMovieWatched(movie.tmdbId);
      if (result.ok) {
        setInWatchedLibrary(true);
        setDetail((prev) =>
          prev ? { ...prev, inWatchedLibrary: true } : prev,
        );
      }
    } finally {
      setWatchedBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {movie ? (
        <>
          <motion.button
            type="button"
            aria-label="Close movie details"
            className="globe-modal__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="movie-detail-title"
            className="globe-modal"
            initial={{ y: "100%", opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.9 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="globe-modal__handle" aria-hidden="true" />

            <header className="globe-modal__header">
              <IconButton label="Back" onClick={handleBack}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
              <div className="min-w-0 flex-1 px-2 text-center">
                <p className="truncate text-xs font-medium uppercase tracking-wider text-accent-text">
                  {contextLabel}
                </p>
                <p className="truncate text-sm font-semibold">{movie.title}</p>
              </div>
              <IconButton label="Close" onClick={onClose}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
            </header>

            <div className="globe-modal__body card-scroll">
              {loading ? (
                <DetailSkeleton />
              ) : error && !detail ? (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <p className="text-sm text-rose-300">{error}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/15"
                  >
                    Dismiss
                  </button>
                </div>
              ) : detail ? (
                <>
                  {error ? (
                    <p className="px-5 pt-4 text-center text-xs text-amber-300/90">
                      Showing saved info — {error}
                    </p>
                  ) : null}
                  <div className="globe-modal__hero">
                    <Image
                      src={currentImage}
                      alt={detail.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 480px"
                      priority
                    />
                    <div className="globe-modal__hero-gradient" />

                    {images.length > 1 ? (
                      <>
                        <button
                          type="button"
                          aria-label="Previous image"
                          className="globe-modal__nav globe-modal__nav--prev"
                          onClick={() =>
                            setImageIndex(
                              (i) => (i - 1 + images.length) % images.length
                            )
                          }
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label="Next image"
                          className="globe-modal__nav globe-modal__nav--next"
                          onClick={() =>
                            setImageIndex((i) => (i + 1) % images.length)
                          }
                        >
                          ›
                        </button>
                        <div className="globe-modal__dots">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              aria-label={`Show image ${i + 1} of ${
                                images.length
                              }`}
                              aria-current={i === imageIndex % images.length}
                              className={`globe-modal__dot${
                                i === imageIndex % images.length
                                  ? " globe-modal__dot--active"
                                  : ""
                              }`}
                              onClick={() => setImageIndex(i)}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="globe-modal__content">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2
                          id="movie-detail-title"
                          className="globe-modal__title min-w-0 flex-1"
                        >
                          {detail.title}
                        </h2>
                        <button
                          type="button"
                          disabled={!movie?.tmdbId || watchedActive || watchedBusy}
                          onClick={() => void handleMarkWatched()}
                          aria-label={
                            watchedActive
                              ? detail.yourRating != null
                                ? `In watched · your rating ${detail.yourRating} out of 10`
                                : "In watched library"
                              : "Mark as watched"
                          }
                          title={
                            watchedActive
                              ? detail.yourRating != null
                                ? `Watched · ${detail.yourRating}/10`
                                : "In watched"
                              : "Mark watched"
                          }
                          className={`globe-modal__icon-btn text-base ${
                            watchedActive
                              ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/35"
                              : "text-sky-300/90 ring-1 ring-sky-400/25"
                          }`}
                        >
                          👁
                        </button>
                      </div>
                      {detail.originalTitle &&
                      detail.originalTitle !== detail.title ? (
                        <p className="globe-modal__subtitle">
                          {detail.originalTitle}
                        </p>
                      ) : null}
                      {detail.tagline ? (
                        <p className="globe-modal__tagline">
                          &ldquo;{detail.tagline}&rdquo;
                        </p>
                      ) : null}
                    </div>

                    <div className="globe-modal__meta-row">
                      {releaseLabel ? (
                        <span className="globe-modal__chip">
                          {releaseLabel}
                        </span>
                      ) : null}
                      {runtimeLabel ? (
                        <span className="globe-modal__chip">
                          {runtimeLabel}
                        </span>
                      ) : null}
                      {detail.countries[0] ? (
                        <span className="globe-modal__chip">
                          {detail.countries[0]}
                        </span>
                      ) : null}
                    </div>

                    <ImdbRatingBadge
                      rating={detail.imdbRating}
                      imdbId={detail.imdbId}
                      votes={detail.imdbVotes}
                      size="lg"
                    />

                    <div className="globe-modal__stats">
                      <DetailItem
                        label="Release"
                        value={
                          formatReleaseDate(detail.releaseDate, detail.year) ??
                          "—"
                        }
                      />
                      <DetailItem
                        label="Runtime"
                        value={formatRuntime(detail.runtime) ?? "—"}
                      />
                      <DetailItem
                        label="Director"
                        value={detail.director || "—"}
                      />
                      <DetailItem
                        label="Status"
                        value={detail.status?.replace(/_/g, " ") || "—"}
                      />
                    </div>

                    {detail.genres.length > 0 ? (
                      <section className="globe-modal__section">
                        <h3 className="globe-modal__section-title">Genres</h3>
                        <div className="flex flex-wrap gap-2">
                          {detail.genres.map((genre) => (
                            <span key={genre} className="globe-modal__chip">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {detail.writers.length > 0 ? (
                      <section className="globe-modal__section">
                        <h3 className="globe-modal__section-title">Writers</h3>
                        <p className="text-sm leading-relaxed text-white/75">
                          {detail.writers.join(", ")}
                        </p>
                      </section>
                    ) : null}

                    <section className="globe-modal__section">
                      <h3 className="globe-modal__section-title">Synopsis</h3>
                      <p className="text-sm leading-relaxed text-white/75">
                        {detail.overview || "No description available."}
                      </p>
                    </section>

                    <CastRow cast={detail.cast} />
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
