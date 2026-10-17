"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { normalizeGenreName } from "@/lib/genres";
import type { ListFilters } from "@/lib/list-filters";
import type { MovieCandidate } from "@/lib/types";
import { CastSearchField } from "./CastSearchField";
import { GlobeNavLink } from "./GlobeNavLink";
import { ListFilterMenu } from "./ListFilterMenu";
import { MovieCard } from "./MovieCard";
import {
  fetchWithTimeout,
  isLikelyApiKeyError,
  TimeoutError,
} from "@/lib/fetch-timeout";
import { markMovieWatched } from "@/lib/mark-watched-client";
import { LoadingProgress } from "./LoadingProgress";

const RECOMMENDATIONS_CLIENT_TIMEOUT_MS = 55_000;

function DiscoverDeckShell({
  toolbar,
  overlay,
  children,
}: {
  toolbar?: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pb-2 pt-2">
      {overlay}
      {toolbar}
      {children}
    </div>
  );
}

interface SwipeDeckProps {
  initialGenre?: string;
  initialCast?: { id: number; name: string } | null;
  /** Single ISO country code locked for globe recommend mode */
  initialCountry?: string;
  /** Display name when country is locked (e.g. "Poland") */
  countryLabel?: string;
  /** Keep country filter fixed (globe country discover panel) */
  lockCountries?: boolean;
  /** Show link to globe tab (off when already in globe country discover) */
  showGlobeNavLink?: boolean;
}

export function SwipeDeck({
  initialGenre,
  initialCast,
  initialCountry,
  countryLabel,
  lockCountries = false,
  showGlobeNavLink = true,
}: SwipeDeckProps) {
  const [movies, setMovies] = useState<MovieCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreFilters, setGenreFilters] = useState<string[]>(
    initialGenre ? [normalizeGenreName(initialGenre)] : []
  );
  const [originFilters, setOriginFilters] = useState<string[]>([]);
  const [countryFilters, setCountryFilters] = useState<string[]>(
    initialCountry ? [initialCountry.toUpperCase()] : []
  );
  const [castFilter, setCastFilter] = useState(initialCast ?? null);
  const [busy, setBusy] = useState(false);
  const [watchedIds, setWatchedIds] = useState<Set<number>>(() => new Set());
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [deckPage, setDeckPage] = useState(1);
  const [setup, setSetup] = useState<{
    keysReady: boolean;
    hasProfile: boolean;
    importedCount: number;
  } | null>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setSetup({
          keysReady: data.keysReady,
          hasProfile: data.hasProfile,
          importedCount: data.importedCount,
        });
        setTopGenres(data.topGenres ?? []);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (initialGenre) setGenreFilters([normalizeGenreName(initialGenre)]);
  }, [initialGenre]);

  useEffect(() => {
    if (initialCast) setCastFilter(initialCast);
  }, [initialCast]);

  useEffect(() => {
    if (!initialCountry) return;
    const next = initialCountry.toUpperCase();
    setCountryFilters((prev) =>
      prev.length === 1 && prev[0] === next ? prev : [next]
    );
  }, [initialCountry]);

  const hasFilters =
    genreFilters.length > 0 ||
    originFilters.length > 0 ||
    (countryFilters.length > 0 && !lockCountries) ||
    Boolean(castFilter);

  const loadMovies = useCallback(
    async (opts?: {
      page?: number;
      append?: boolean;
      resetSeen?: boolean;
      emptyRetries?: number;
    }) => {
      const page = opts?.page ?? 1;
      const append = opts?.append ?? false;
      const emptyRetries = opts?.emptyRetries ?? 0;
      const requestId = ++requestIdRef.current;

      if (opts?.resetSeen) {
        seenIdsRef.current = new Set();
      }

      // Full-screen loading only on initial / filter reset — not while prefilling on swipe.
      if (!append) {
        setLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams({
          limit: "12",
          page: String(page),
        });
        if (genreFilters.length > 0) {
          params.set("genres", genreFilters.join(","));
        }
        if (originFilters.length > 0) {
          params.set("languages", originFilters.join(","));
        }
        if (countryFilters.length > 0) {
          params.set("countries", countryFilters.join(","));
        }
        if (castFilter) {
          params.set("castId", String(castFilter.id));
          params.set("castName", castFilter.name);
        }
        const res = await fetchWithTimeout(
          `/api/recommendations?${params.toString()}`,
          undefined,
          RECOMMENDATIONS_CLIENT_TIMEOUT_MS
        );
        const data = await res.json();

        // Ignore stale responses from overlapping loads (Strict Mode / filter churn).
        if (requestId !== requestIdRef.current) return;

        if (!res.ok) throw new Error(data.error ?? "Failed to load movies");

        const incoming = (data.movies ?? []) as MovieCandidate[];
        const fresh = incoming.filter((m) => !seenIdsRef.current.has(m.tmdbId));
        for (const m of fresh) seenIdsRef.current.add(m.tmdbId);

        // Server may skip empty TMDB windows — continue from its cursor.
        const serverNext =
          typeof data.nextPage === "number" && data.nextPage > page
            ? data.nextPage
            : page + 1;
        setDeckPage(serverNext);

        if (fresh.length === 0 && emptyRetries < 3 && serverNext > page) {
          await loadMovies({
            page: serverNext,
            append,
            emptyRetries: emptyRetries + 1,
          });
          return;
        }

        if (append) {
          setMovies((prev) => {
            const ids = new Set(prev.map((p) => p.tmdbId));
            return [...prev, ...fresh.filter((m) => !ids.has(m.tmdbId))];
          });
        } else {
          setMovies(fresh);
          setIndex(0);
        }

        // Weak batch while swiping — pull another Discover window in the same chain.
        const bestMatch = fresh.reduce(
          (max, m) => Math.max(max, m.matchScore ?? 0),
          0
        );
        if (
          append &&
          fresh.length > 0 &&
          bestMatch < 0.1 &&
          emptyRetries < 2 &&
          serverNext > page
        ) {
          await loadMovies({
            page: serverNext,
            append: true,
            emptyRetries: emptyRetries + 1,
          });
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        if (!append) {
          const message =
            err instanceof TimeoutError
              ? "Loading took too long. Check your API keys in Settings or tap Retry."
              : err instanceof Error
              ? err.message
              : "Failed to load movies";
          setError(message);
          setMovies([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          if (!append) setLoading(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [genreFilters, originFilters, countryFilters, castFilter]
  );

  useEffect(() => {
    if (!setup) return;
    if (!setup.keysReady) {
      setLoading(false);
      return;
    }
    void loadMovies({ page: 1, append: false, resetSeen: true });
  }, [loadMovies, setup]);

  const applyGenreFromCard = (genre: string) => {
    const normalized = normalizeGenreName(genre);
    setCastFilter(null);
    setGenreFilters((prev) => {
      const has = prev.some(
        (g) => normalizeGenreName(g).toLowerCase() === normalized.toLowerCase()
      );
      if (has) {
        return prev.filter(
          (g) =>
            normalizeGenreName(g).toLowerCase() !== normalized.toLowerCase()
        );
      }
      return [...prev, normalized];
    });
  };

  const applyCastFilter = (member: { id: number; name: string }) => {
    setGenreFilters([]);
    setOriginFilters([]);
    if (!lockCountries) setCountryFilters([]);
    setCastFilter(member);
  };

  const clearFilters = () => {
    setGenreFilters([]);
    setOriginFilters([]);
    if (!lockCountries) setCountryFilters([]);
    setCastFilter(null);
  };

  const onDiscoverFiltersChange = (next: ListFilters) => {
    setCastFilter(null);
    setGenreFilters(next.genres);
    setOriginFilters(next.languages);
    if (!lockCountries) {
      setCountryFilters(next.countries);
    }
  };

  const refreshDeck = () => {
    // deckPage is already the server cursor for the next unseen window.
    void loadMovies({ page: deckPage, append: false, resetSeen: true });
  };

  const current = movies[index];

  const recordSwipe = async (
    action: "pass" | "like" | "wishlist",
    movie: MovieCandidate
  ) => {
    setBusy(true);
    try {
      await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          movie: {
            tmdbId: movie.tmdbId,
            imdbId: movie.imdbId,
            title: movie.title,
            matchScore: movie.matchScore,
            genres: movie.genres,
            director: movie.director,
            cast: movie.cast,
            year: movie.year,
            runtime: movie.runtime,
          },
          fullPayload: movie,
        }),
      });
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    const nextIndex = index + 1;
    setIndex(nextIndex);

    // Prefetch while swiping — not on every initial load.
    const remaining = movies.length - nextIndex;
    if (remaining <= 5 && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      void loadMovies({ page: deckPage, append: true });
    }
  };

  const handlePass = async () => {
    if (!current || busy) return;
    await recordSwipe("pass", current);
    advance();
  };

  const handleLike = async () => {
    if (!current || busy) return;
    await recordSwipe("like", current);
    advance();
  };

  const handleWishlist = async () => {
    if (!current || busy) return;
    await recordSwipe("wishlist", current);
    advance();
  };

  useEffect(() => {
    const tmdbId = current?.tmdbId;
    if (!tmdbId) return;
    let cancelled = false;
    void fetch(`/api/movies/${tmdbId}`)
      .then((r) => r.json())
      .then((data: { inWatchedLibrary?: boolean }) => {
        if (cancelled || !data.inWatchedLibrary) return;
        setWatchedIds((prev) => {
          if (prev.has(tmdbId)) return prev;
          return new Set(prev).add(tmdbId);
        });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [current?.tmdbId]);

  const handleWatched = async () => {
    if (!current || busy || watchedIds.has(current.tmdbId)) return;
    setBusy(true);
    try {
      const result = await markMovieWatched(current.tmdbId);
      if (result.ok) {
        setWatchedIds((prev) => new Set(prev).add(current.tmdbId));
      }
    } finally {
      setBusy(false);
    }
    advance();
  };

  const discoverToolbar =
    setup?.keysReady ? (
      <div className="relative z-30 flex shrink-0 items-start gap-2">
        <CastSearchField
          selected={castFilter}
          onSelect={applyCastFilter}
          onClear={() => setCastFilter(null)}
          disabled={busy || loading}
        />
        <div className="ml-auto flex shrink-0 items-start gap-2">
          <ListFilterMenu
            filters={{
              genres: genreFilters,
              languages: originFilters,
              countries: countryFilters,
            }}
            onChange={onDiscoverFiltersChange}
            highlightGenres={topGenres}
            lockCountries={lockCountries}
            countryLabel={
              lockCountries ? countryLabel ?? countryFilters[0] ?? null : null
            }
            disabled={busy || loading || Boolean(castFilter)}
            dropdownAlign="right"
            showTasteHint={topGenres.length > 0 && !castFilter}
          />
          {showGlobeNavLink ? <GlobeNavLink source="recommend" /> : null}
        </div>
      </div>
    ) : null;

  if (!setup || (loading && movies.length === 0)) {
    const label =
      hasFilters || lockCountries
        ? "Applying filters & loading picks…"
        : "Finding movies matched to your taste…";

    if (setup?.keysReady) {
      return (
        <DiscoverDeckShell toolbar={discoverToolbar}>
          <div className="flex flex-1 items-center justify-center p-8">
            <LoadingProgress active label={label} />
          </div>
        </DiscoverDeckShell>
      );
    }

    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <LoadingProgress active label={label} />
      </div>
    );
  }

  if (!setup.keysReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-white">
          Add your API keys first
        </p>
        <Link
          href="/settings"
          className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white"
        >
          Open Settings
        </Link>
      </div>
    );
  }

  if (error && movies.length === 0) {
    const showSettings = isLikelyApiKeyError(error);
    return (
      <DiscoverDeckShell toolbar={discoverToolbar}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-white">
            Couldn&apos;t load picks
          </p>
          <p className="max-w-sm text-sm text-white/70">{error}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {showSettings ? (
              <Link
                href="/settings"
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
              >
                Open Settings
              </Link>
            ) : null}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={refreshDeck}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        </div>
      </DiscoverDeckShell>
    );
  }

  if (!current) {
    return (
      <DiscoverDeckShell toolbar={discoverToolbar}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-white/70">No more picks in this batch.</p>
          <p className="max-w-xs text-sm text-white/45">
            {lockCountries
              ? `Load more recommendations from ${
                  countryLabel ?? "this country"
                }, or go back to the map.`
              : "Load the next page of recommendations, or clear filters to browse all tastes."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={refreshDeck}
              disabled={loading}
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh deck"}
            </button>
          </div>
        </div>
      </DiscoverDeckShell>
    );
  }

  return (
    <DiscoverDeckShell
      toolbar={discoverToolbar}
      overlay={
        loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
            <LoadingProgress active={loading} label="Updating picks…" compact />
          </div>
        ) : null
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.tmdbId}-${genreFilters.join(
            "|"
          )}-${originFilters.join("|")}-${countryFilters.join("|")}-${
            castFilter?.id ?? ""
          }`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <MovieCard
            movie={current}
            activeGenres={genreFilters}
            activeCastId={castFilter?.id}
            disabled={busy || loading}
            onSwipe={(dir) => (dir === "right" ? handleLike() : handlePass())}
            onPass={handlePass}
            onLike={handleLike}
            onWishlist={handleWishlist}
            onWatched={handleWatched}
            watched={watchedIds.has(current.tmdbId)}
            onGenreSelect={applyGenreFromCard}
            onCastSelect={applyCastFilter}
          />
        </motion.div>
      </AnimatePresence>
    </DiscoverDeckShell>
  );
}
