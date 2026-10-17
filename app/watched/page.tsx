"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ListPageActions } from "@/components/ListPageActions";
import type { ListFilters } from "@/lib/list-filters";
import { movieLeftListTab } from "@/lib/handle-list-state-change";
import type { MovieListState } from "@/lib/movie-list-state";
import type { MovieCandidate } from "@/lib/types";

const TAB_LIST_STATE: MovieListState = "watched";
import { ListPagination } from "@/components/ListPagination";
import { MovieDetailPanel } from "@/components/MovieDetailPanel";
import { MovieGrid } from "@/components/MovieGrid";

const PAGE_SIZE = 24;

export default function WatchedPage() {
  const [movies, setMovies] = useState<MovieCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MovieCandidate | null>(null);
  const [filters, setFilters] = useState<ListFilters>({
    genres: [],
    languages: [],
    countries: [],
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive =
    filters.genres.length > 0 ||
    filters.languages.length > 0 ||
    filters.countries.length > 0;

  const loadPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(PAGE_SIZE),
        });
        if (filters.genres.length > 0) {
          params.set("genres", filters.genres.join(","));
        }
        if (filters.languages.length > 0) {
          params.set("languages", filters.languages.join(","));
        }
        if (filters.countries.length > 0) {
          params.set("countries", filters.countries.join(","));
        }
        const res = await fetch(`/api/watched?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setMovies((data.movies ?? []) as MovieCandidate[]);
        setTotal(data.total ?? 0);
        setPage(pageNum);
      } catch {
        setMovies([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [filters.genres, filters.languages, filters.countries]
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  const handleFiltersChange = (next: ListFilters) => {
    setSelected(null);
    setFilters(next);
  };

  const handleRemove = async (tmdbId: number) => {
    const res = await fetch("/api/watched", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    if (!res.ok) return;

    setMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
    setTotal((prev) => Math.max(0, prev - 1));
    if (selected?.tmdbId === tmdbId) setSelected(null);
  };

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped === page) return;
    setSelected(null);
    void loadPage(clamped);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && movies.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-white/50">
        Loading watched movies…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">Watched</h2>
          <p className="text-sm text-white/50">
            {total > 0
              ? filtersActive
                ? `${total} matching titles`
                : `${total} titles`
              : filtersActive
              ? "No titles match these filters"
              : "Movies you rated on IMDb"}
          </p>
        </div>
        <ListPageActions
          globeSource="viewed"
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {movies.length === 0 && !loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          {filtersActive ? (
            <p className="text-white/50">
              No watched titles match these filters.
            </p>
          ) : (
            <>
              <p className="text-white/50">
                No imported ratings yet. Import your IMDb CSV to see everything
                you&apos;ve watched.
              </p>
              <Link
                href="/settings"
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white"
              >
                Import in Settings
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div
            className={loading ? "pointer-events-none opacity-60" : undefined}
          >
            <MovieGrid
              movies={movies}
              emptyMessage=""
              showDeleteButton
              onDelete={handleRemove}
              onSelectMovie={setSelected}
            />
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            loading={loading}
            onPageChange={goToPage}
          />
        </>
      )}
      <MovieDetailPanel
        movie={selected}
        onListStateChange={({ tmdbId, state }) => {
          void loadPage(page);
          if (movieLeftListTab(TAB_LIST_STATE, state)) {
            setMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
            setTotal((prev) => Math.max(0, prev - 1));
            setSelected(null);
          }
        }}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
