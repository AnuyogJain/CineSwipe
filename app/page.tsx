"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { HomeMovieRow } from "@/components/HomeMovieRow";
import { MovieDetailPanel } from "@/components/MovieDetailPanel";
import type { MovieCandidate } from "@/lib/types";
import { HomeDiscoverHero } from "@/components/HomeDiscoverHero";
import { LoadingProgress } from "@/components/LoadingProgress";
import { fetchMovieCandidateByTmdbId } from "@/lib/fetch-movie-candidate-client";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkTmdbId = searchParams.get("tmdbId");

  const [liked, setLiked] = useState<MovieCandidate[]>([]);
  const [wishlist, setWishlist] = useState<MovieCandidate[]>([]);
  const [watched, setWatched] = useState<MovieCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MovieCandidate | null>(null);
  const [setup, setSetup] = useState<{
    keysReady: boolean;
    hasProfile: boolean;
    topGenres: string[];
  }>({ keysReady: false, hasProfile: false, topGenres: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, likedRes, wishlistRes, watchedRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/liked"),
        fetch("/api/wishlist"),
        fetch("/api/watched?limit=24&page=1"),
      ]);

      const status = await statusRes.json();
      if (statusRes.ok) {
        setSetup({
          keysReady: Boolean(status.keysReady),
          hasProfile: Boolean(status.hasProfile),
          topGenres: status.topGenres ?? [],
        });
      }

      const likedJson = await likedRes.json();
      const wishlistJson = await wishlistRes.json();
      const watchedJson = await watchedRes.json();

      setLiked(likedRes.ok ? likedJson.movies ?? [] : []);
      setWishlist(wishlistRes.ok ? wishlistJson.movies ?? [] : []);
      setWatched(watchedRes.ok ? watchedJson.movies ?? [] : []);
    } catch {
      setLiked([]);
      setWishlist([]);
      setWatched([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const raw = deepLinkTmdbId?.trim();
    if (!raw) return;
    const tmdbId = Number(raw);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) return;

    let cancelled = false;
    void fetchMovieCandidateByTmdbId(tmdbId).then((movie) => {
      if (!cancelled && movie) setSelected(movie);
    });

    return () => {
      cancelled = true;
    };
  }, [deepLinkTmdbId]);

  const closeDetail = useCallback(() => {
    setSelected(null);
    if (deepLinkTmdbId) {
      router.replace("/", { scroll: false });
    }
  }, [deepLinkTmdbId, router]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 scrollbar-hide">
      <div className="pt-3">
        <HomeDiscoverHero
          keysReady={setup.keysReady}
          hasProfile={setup.hasProfile}
          topGenres={setup.topGenres}
        />
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <LoadingProgress active label="Loading your lists…" compact />
        </div>
      ) : (
        <div className="mt-6">
          <HomeMovieRow
            title="Liked"
            viewAllHref="/liked"
            movies={liked}
            emptyHint="Nothing liked yet — open Discover and swipe right on a match."
            onSelectMovie={setSelected}
          />
          <HomeMovieRow
            title="Wishlist"
            viewAllHref="/wishlist"
            movies={wishlist}
            emptyHint="Save must-watch titles with a super-like on Discover."
            onSelectMovie={setSelected}
          />
          <HomeMovieRow
            title="Watched"
            viewAllHref="/watched"
            movies={watched}
            emptyHint="Import IMDb ratings or mark movies watched from Discover."
            onSelectMovie={setSelected}
          />
        </div>
      )}

      <MovieDetailPanel
        movie={selected}
        onListStateChange={() => {
          void load();
        }}
        onClose={closeDetail}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <LoadingProgress active label="Loading home…" compact />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
