"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWithTimeout, TimeoutError } from "@/lib/fetch-timeout";
import { Globe } from "@/components/icons";
import { LoadingProgress } from "@/components/LoadingProgress";

const GLOBE_CLIENT_TIMEOUT_MS = 55_000;
import { MovieDetailPanel } from "@/components/MovieDetailPanel";
import { GlobeMovieList } from "@/components/GlobeMovieList";
import { GlobeRecommendPanel } from "@/components/GlobeRecommendPanel";
import {
  parseGlobeSource,
  type GlobeCountry,
  type GlobeDataset,
  type GlobeMovie,
  type GlobeSource,
} from "@/lib/globe-types";
import { stubMovieCandidateFromGlobe } from "@/lib/stub-movie-candidate";

const GlobeScene = dynamic(
  () => import("@/components/GlobeScene").then((m) => m.GlobeScene),
  { ssr: false, loading: () => null }
);

const SOURCES: Array<{
  id: GlobeSource;
  label: string;
  empty: string;
}> = [
  {
    id: "viewed",
    label: "Viewed",
    empty:
      "Mark movies as watched on Discover, or import ratings from Settings.",
  },
  {
    id: "liked",
    label: "Liked",
    empty: "Swipe right on Discover to add liked movies here.",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    empty: "Super-like movies on Discover to pin them here.",
  },
  {
    id: "recommend",
    label: "Recommend",
    empty: "Add API keys in Settings, then swipe on Discover to build taste.",
  },
];

export default function GlobePage() {
  const [source, setSource] = useState<GlobeSource | null>(null);
  const [data, setData] = useState<GlobeDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<GlobeCountry | null>(
    null
  );
  const [selectedMovie, setSelectedMovie] = useState<GlobeMovie | null>(null);

  const isRecommend = source === "recommend";

  const load = useCallback(async (nextSource: GlobeSource) => {
    setLoading(true);
    setError(null);
    setSelectedCountry(null);
    setSelectedMovie(null);
    try {
      const res = await fetchWithTimeout(
        `/api/globe?source=${nextSource}`,
        undefined,
        GLOBE_CLIENT_TIMEOUT_MS
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load globe");
      setData(json as GlobeDataset);
    } catch (err) {
      setData(null);
      setError(
        err instanceof TimeoutError
          ? "Loading took too long. Check your API keys in Settings or tap Retry."
          : err instanceof Error
          ? err.message
          : "Failed to load globe"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = parseGlobeSource(
      new URLSearchParams(window.location.search).get("source")
    );
    setSource(fromUrl);
  }, []);

  useEffect(() => {
    if (source == null) return;
    void load(source);
  }, [load, source]);

  useEffect(() => {
    const main = document.querySelector("main");
    main?.classList.add("!max-w-none", "!overflow-visible", "!p-0");
    return () => {
      main?.classList.remove("!max-w-none", "!overflow-visible", "!p-0");
    };
  }, []);

  const handleCountryClick = useCallback((country: GlobeCountry) => {
    setSelectedMovie(null);
    setSelectedCountry(country);
  }, []);

  const handleMovieClick = useCallback((movie: GlobeMovie) => {
    setSelectedMovie(movie);
  }, []);

  const activeSource = SOURCES.find((s) => s.id === source) ?? SOURCES[0];

  const selectedGlobeCandidate = useMemo(
    () => (selectedMovie ? stubMovieCandidateFromGlobe(selectedMovie) : null),
    [selectedMovie]
  );

  const sourceSwitcher = (
    <div
      className="globe-source-switcher pointer-events-auto"
      role="tablist"
      aria-label="Globe movie source"
    >
      {SOURCES.map((option) => {
        const active = option.id === source;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={loading && active}
            onClick={() => setSource(option.id)}
            className={`globe-source-switcher__btn${
              active ? " globe-source-switcher__btn--active" : ""
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  if (error) {
    const needsSettings = error.toLowerCase().includes("tmdb");
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Globe className="h-12 w-12 text-muted" strokeWidth={1.5} aria-hidden />
        <h2 className="text-xl font-bold">Globe unavailable</h2>
        <p className="text-sm text-muted">{error}</p>
        {needsSettings ? (
          <Link
            href="/settings"
            className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 ring-1 ring-rose-400/30"
          >
            Open Settings
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (source) void load(source);
            }}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const isEmpty = !loading && !isRecommend && (!data || data.stats.total === 0);
  const showStatsPill =
    !loading && (isRecommend || Boolean(data && data.stats.mapped > 0));
  const mapChromeVisible = !selectedCountry && !selectedMovie;

  return (
    <>
      <div className="globe-sky globe-sky--app z-0">
        {loading ? (
          <div className="absolute inset-0 z-[2] flex items-center justify-center">
            <LoadingProgress
              active
              label={
                isRecommend
                  ? "Loading country discover map…"
                  : source === "viewed"
                  ? "Mapping your library to the world…"
                  : source === "liked"
                  ? "Mapping liked movies…"
                  : "Mapping wishlist movies…"
              }
            />
          </div>
        ) : null}

        {!loading && data && (isRecommend || data.stats.mapped > 0) ? (
          <GlobeScene
            countries={data.countries}
            movies={data.movies}
            recommendMode={isRecommend}
            onCountryClick={handleCountryClick}
            onMovieClick={handleMovieClick}
          />
        ) : null}

        {isEmpty ? (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Link
              href="/settings"
              className="rounded-full p-2 transition hover:bg-white/10"
              aria-label="Open settings"
            >
              <Globe
                className="h-12 w-12 text-muted"
                strokeWidth={1.5}
                aria-hidden
              />
            </Link>
            <h2 className="text-xl font-bold">
              No {activeSource.label.toLowerCase()} movies
            </h2>
            <p className="max-w-sm text-sm text-muted">{activeSource.empty}</p>
            {source === "viewed" ? (
              <Link
                href="/settings"
                className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 ring-1 ring-rose-400/30"
              >
                Open Settings
              </Link>
            ) : (
              <Link
                href="/discover"
                className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 ring-1 ring-rose-400/30"
              >
                Open Discover
              </Link>
            )}
          </div>
        ) : null}

        {mapChromeVisible ? (
        <div className="pointer-events-none absolute left-0 right-0 top-3 z-10 flex flex-col items-center gap-2 px-4">
          {sourceSwitcher}
          {showStatsPill ? (
            <div className="globe-chrome__stats rounded-2xl px-4 py-2 text-center text-xs">
              {isRecommend ? (
                <>
                  <span className="globe-chrome__accent">
                    {data?.countries.length ?? 0}
                  </span>{" "}
                  countries · tap a pin to discover
                </>
              ) : data && data.stats.mapped > 0 ? (
                <>
                  <span className="globe-chrome__accent">
                    {data.stats.mapped}
                  </span>{" "}
                  {activeSource.label.toLowerCase()} movies across{" "}
                  <span className="globe-chrome__accent">
                    {data.countries.length}
                  </span>{" "}
                  countries
                  {source === "viewed" && data.stats.excludedNonMovies > 0 ? (
                    <span className="block text-[10px] opacity-70">
                      {data.stats.excludedNonMovies} TV shows/episodes excluded
                    </span>
                  ) : null}
                  {data.stats.unmapped > 0 ? (
                    <span className="block text-[10px] opacity-70">
                      {data.stats.unmapped} titles couldn&apos;t be placed
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        ) : null}

        {mapChromeVisible ? (
        <p className="globe-chrome__hint pointer-events-none absolute left-0 right-0 z-10 text-center text-[10px]">
          {isRecommend
            ? "Tap a country pin to get recommendations from there"
            : "Zoom in to see movies · Tap a dot for details · Tap a country to browse"}
        </p>
        ) : null}
      </div>

      {isRecommend ? (
        <GlobeRecommendPanel
          country={selectedCountry}
          onClose={() => setSelectedCountry(null)}
        />
      ) : (
        <GlobeMovieList
          country={selectedCountry}
          movies={data?.movies ?? []}
          onClose={() => setSelectedCountry(null)}
          onSelectMovie={(movie) => setSelectedMovie(movie)}
        />
      )}

      {!isRecommend ? (
        <MovieDetailPanel
          movie={selectedGlobeCandidate}
          headerContext={selectedMovie?.countryName}
          showListStatePicker={false}
          layout="sheet"
          onClose={() => setSelectedMovie(null)}
        />
      ) : null}
    </>
  );
}
