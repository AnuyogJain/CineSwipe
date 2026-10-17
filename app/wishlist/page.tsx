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

const TAB_LIST_STATE: MovieListState = "wishlist";
import { MovieGrid } from "@/components/MovieGrid";

export default function WishlistPage() {
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
      const res = await fetch("/api/wishlist");
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

  const handleDelete = async (tmdbId: number) => {
    const res = await fetch("/api/wishlist", {
      method: "DELETE",
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
        Loading wishlist…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">Wishlist</h2>
          <p className="text-sm text-white/50">
            Your wishlisted must-watch picks
          </p>
          {message ? (
            <p className="mt-2 text-sm text-rose-300">{message}</p>
          ) : null}
        </div>
        <ListPageActions
          globeSource="wishlist"
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <MovieGrid
        movies={filteredMovies}
        emptyMessage={
          movies.length === 0
            ? "No wishlist items yet. Use the star button while swiping or from Liked!"
            : "No wishlist items match these filters."
        }
        showDeleteButton
        onDelete={handleDelete}
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
