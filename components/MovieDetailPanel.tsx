"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MovieListStateSelect } from "@/components/MovieListStateSelect";
import {
  resolveMovieListState,
  type MovieListState,
} from "@/lib/movie-list-state";
import { setMovieListStateClient } from "@/lib/set-movie-list-state-client";
import type { GlobeMovieDetail } from "@/lib/globe-types";
import type { MovieCandidate } from "@/lib/types";
import { actionSideButtonClass } from "./ActionBar";
import { X, iconActionClass } from "@/components/icons";
import { MovieProfileSkeleton, MovieProfileView } from "./MovieProfileView";

export interface MovieDetailPanelProps {
  movie: MovieCandidate | null;
  onClose: () => void;
  headerContext?: string;
  showListStatePicker?: boolean;
  onListStateChange?: (info: { tmdbId: number; state: MovieListState }) => void;
  layout?: "sheet" | "dock-top";
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

function mergeListPayload(
  movie: MovieCandidate,
  detail: GlobeMovieDetail
): MovieCandidate {
  return {
    ...movie,
    tmdbId: detail.tmdbId,
    imdbId: detail.imdbId ?? movie.imdbId,
    title: detail.title,
    originalTitle: detail.originalTitle,
    originalLanguage: detail.originalLanguage,
    overview: detail.overview,
    tagline: detail.tagline,
    year: detail.year,
    runtime: detail.runtime,
    genres: detail.genres,
    genreIds: detail.genreIds,
    posterPath: detail.posterPath,
    backdropPath: detail.backdropPath,
    images: detail.images.length > 0 ? detail.images : movie.images,
    director: detail.director,
    writers: detail.writers,
    countries: detail.countries,
    cast: detail.cast,
    releaseDate: detail.releaseDate,
    status: detail.status,
    imdbRating: detail.imdbRating ?? movie.imdbRating,
    imdbVotes: detail.imdbVotes ?? movie.imdbVotes,
    matchScore: movie.matchScore ?? 0,
    matchPercent: movie.matchPercent ?? 0,
    yourRating: detail.yourRating ?? movie.yourRating,
  };
}

function applyListStateFlags(state: MovieListState): {
  inLiked: boolean;
  inWishlist: boolean;
  inWatched: boolean;
} {
  return {
    inLiked: state === "liked",
    inWishlist: state === "wishlist",
    inWatched: state === "watched",
  };
}

export function MovieDetailPanel({
  movie,
  onClose,
  headerContext,
  showListStatePicker = true,
  onListStateChange,
  layout = "dock-top",
}: MovieDetailPanelProps) {
  const dockTop = layout === "dock-top";
  const router = useRouter();
  const [detail, setDetail] = useState<GlobeMovieDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionsBusy, setActionsBusy] = useState(false);
  const [listState, setListState] = useState<MovieListState>("none");

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
    setListState("none");
    setActionsBusy(false);

    if (!movie.tmdbId) {
      setDetail(candidateToDetail(movie));
      setListState(movie.yourRating != null ? "watched" : "none");
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
          const flags = applyListStateFlags(
            (data.listState as MovieListState | undefined) ??
              resolveMovieListState({
                inLiked: Boolean(data.inLiked),
                inWishlist: Boolean(data.inWishlist),
                inWatched: Boolean(data.inWatchedLibrary),
              })
          );
          setListState(
            resolveMovieListState({
              inLiked: flags.inLiked,
              inWishlist: flags.inWishlist,
              inWatched: flags.inWatched,
            })
          );
        }
      } catch (err) {
        if (!cancelled) {
          setDetail(candidateToDetail(movie));
          setListState(movie.yourRating != null ? "watched" : "none");
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

  const profileMovie = useMemo(() => {
    if (!movie) return null;
    if (!detail) return movie;
    return mergeListPayload(movie, detail);
  }, [movie, detail]);

  const handleCastSelect = useCallback(
    (member: { id: number; name: string }) => {
      onClose();
      const params = new URLSearchParams({
        castId: String(member.id),
        castName: member.name,
      });
      router.push(`/discover?${params.toString()}`);
    },
    [onClose, router]
  );

  const handleListStateChange = async (next: MovieListState) => {
    if (!movie?.tmdbId || !detail || actionsBusy || next === listState) return;
    setActionsBusy(true);
    const previous = listState;
    setListState(next);
    try {
      const result = await setMovieListStateClient(
        movie.tmdbId,
        next,
        mergeListPayload(movie, detail)
      );
      if (!result.ok) {
        setListState(previous);
        return;
      }
      const applied = result.state ?? next;
      setListState(applied);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              inWatchedLibrary: applied === "watched",
              yourRating: applied === "watched" ? prev.yourRating : null,
            }
          : prev
      );
      onListStateChange?.({ tmdbId: movie.tmdbId, state: applied });
    } finally {
      setActionsBusy(false);
    }
  };

  if (!movie) return null;

  const pitchAside =
    showListStatePicker && profileMovie ? (
      <MovieListStateSelect
        value={listState}
        busy={actionsBusy}
        disabled={!movie.tmdbId}
        onChange={(next) => void handleListStateChange(next)}
      />
    ) : null;

  return (
    <>
      <button
        type="button"
        aria-label="Close movie details"
        className={
          dockTop
            ? "globe-modal__scrim globe-modal__scrim--dock-top"
            : "globe-modal__scrim"
        }
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        className={`theme-keep-dark ${
          dockTop
            ? "globe-modal globe-modal--dock-top globe-modal--profile"
            : "globe-modal globe-modal--profile"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {!dockTop ? (
          <div className="globe-modal__handle" aria-hidden="true" />
        ) : null}

        <div className="pointer-events-none absolute right-0 top-0 z-20 flex pr-3 pt-3">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`pointer-events-auto ${actionSideButtonClass} text-muted`}
          >
            <X className={iconActionClass} strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        {headerContext ? (
          <p className="absolute left-0 top-0 z-20 max-w-[50%] truncate px-4 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--cinema-gold)]">
            {headerContext}
          </p>
        ) : null}

        <div className="globe-modal__body scrollbar-hide relative min-h-0 flex-1 bg-background">
          {loading ? (
            <MovieProfileSkeleton />
          ) : error && !profileMovie ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-rose-300">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted transition hover:bg-[var(--surface-hover)]"
              >
                Dismiss
              </button>
            </div>
          ) : profileMovie ? (
            <>
              {error ? (
                <p className="px-4 pt-3 text-center text-xs text-amber-300/90">
                  Showing saved info — {error}
                </p>
              ) : null}
              <MovieProfileView
                movie={profileMovie}
                onCastSelect={handleCastSelect}
                pitchAside={pitchAside}
                footerHint={null}
              />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
