"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, iconHeaderClass } from "@/components/icons";
import { posterUrl } from "@/lib/images";
import { stubMovieCandidate } from "@/lib/stub-movie-candidate";
import type { MovieCandidate } from "@/lib/types";
import { MovieDetailPanel } from "./MovieDetailPanel";

interface MovieSearchHit {
  tmdbId: number;
  title: string;
  year: number;
  posterPath: string | null;
}

interface MovieSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MovieSearchDialog({ open, onClose }: MovieSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MovieCandidate | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selected) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, selected]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void fetch(`/api/search/movies?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <>
      <AnimatePresence>
        {open && !selected ? (
          <>
            <motion.button
              type="button"
              aria-label="Close search"
              className="fixed inset-0 z-[60] bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search movies"
              className="glass-panel fixed inset-x-0 top-[57px] z-[61] mx-auto flex max-h-[calc(100dvh-57px-3.5rem)] w-full max-w-lg flex-col rounded-b-3xl border-t-0"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
                <label htmlFor={inputId} className="sr-only">
                  Search movies
                </label>
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                    aria-hidden
                  />
                  <input
                    ref={inputRef}
                    id={inputId}
                    type="search"
                    value={query}
                    placeholder="Movie title…"
                    autoComplete="off"
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface py-2.5 pl-10 pr-3 text-sm text-white outline-none ring-rose-400/30 placeholder:text-white/35 focus:ring-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface p-2.5 text-white/70 transition hover:bg-white/10"
                >
                  <X className={iconHeaderClass} strokeWidth={2} aria-hidden />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {query.trim().length < 2 ? (
                  <p className="px-1 py-6 text-center text-sm text-white/45">
                    Type at least 2 characters to search.
                  </p>
                ) : loading ? (
                  <p className="px-1 py-6 text-center text-sm text-white/45">
                    Searching…
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-1 py-6 text-center text-sm text-white/45">
                    No movies found.
                  </p>
                ) : (
                  <ul className="space-y-1 pb-3">
                    {results.map((hit) => {
                      const src = posterUrl(hit.posterPath, "w92");
                      return (
                        <li key={hit.tmdbId}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(
                                stubMovieCandidate({
                                  tmdbId: hit.tmdbId,
                                  title: hit.title,
                                  year: hit.year,
                                  posterPath: hit.posterPath,
                                })
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/8"
                          >
                            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                              {src ? (
                                <Image
                                  src={src}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                                  —
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-white">
                                {hit.title}
                              </p>
                              <p className="text-xs text-white/45">
                                {hit.year > 0 ? hit.year : "Year unknown"}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <MovieDetailPanel
        movie={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
