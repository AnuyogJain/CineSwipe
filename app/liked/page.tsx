"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListPageActions } from "@/components/ListPageActions";
import { MovieDetailPanel } from "@/components/MovieDetailPanel";
import {
  filterMoviesByListFilters,
  type ListFilters,
} from "@/lib/list-filters";
import { movieLeftListTab } from "@/lib/handle-list-state-change";
import type { MovieListState } from "@/lib/movie-list-state";
import type { MovieCandidate } from "@/lib/types";

const TAB_LIST_STATE: MovieListState = "liked";
import { MovieGrid } from "@/components/MovieGrid";

export default function LikedPage() {
  const [movies, setMovies] = useState<MovieCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<MovieCandidate | null>(null);
  const [filters, setFilters] = useState<ListFilters>({
    genres: [],
    languages: [],
    countries: [],
  });

  const filteredMovies = useMemo(
    () => filterMoviesByListFilters(movies, filters),
    [movies, filters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/liked");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMovies(data.movies ?? []);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (tmdbId: number) => {
    const res = await fetch("/api/liked", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    if (res.ok) {
      setMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleWishlist = async (tmdbId: number) => {
    const res = await fetch("/api/liked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    if (res.ok) {
      setMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-white/50">
        Loading liked movies…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">Liked</h2>
          <p className="text-sm text-white/50">Movies you swiped right on</p>
          {message ? (
            <p className="mt-2 text-sm text-amber-300">{message}</p>
          ) : null}
        </div>
        <ListPageActions
          globeSource="liked"
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <MovieGrid
        movies={filteredMovies}
        emptyMessage={
          movies.length === 0
            ? "No liked movies yet. Start swiping on Discover!"
            : "No liked movies match these filters."
        }
        showWishlistButton
        onWishlist={handleWishlist}
        showDeleteButton
        onDelete={handleRemove}
        onSelectMovie={setSelected}
      />
      <MovieDetailPanel
        movie={selected}
        onListStateChange={({ tmdbId, state }) => {
          void load();
          if (movieLeftListTab(TAB_LIST_STATE, state)) {
            setMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
            setSelected(null);
          }
        }}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
