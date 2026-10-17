"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { GlobeCountry, GlobeMovie } from "@/lib/globe-types";
import { posterUrl } from "@/lib/images";

interface GlobeMovieListProps {
  country: GlobeCountry | null;
  movies: GlobeMovie[];
  onClose: () => void;
  onSelectMovie: (movie: GlobeMovie) => void;
}

export function GlobeMovieList({
  country,
  movies,
  onClose,
  onSelectMovie,
}: GlobeMovieListProps) {
  const filtered = country
    ? movies.filter((m) => m.countryIso === country.iso)
    : movies;

  return (
    <AnimatePresence>
      {country ? (
        <>
          <motion.button
            type="button"
            aria-label="Close movie list"
            className="globe-list-panel__scrim fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="globe-list-panel fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[70dvh] max-w-lg overflow-hidden rounded-t-3xl border shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-rose-300/80">
                  Your library
                </p>
                <h3 className="text-lg font-bold text-white">{country.name}</h3>
                <p className="text-sm text-white/50">
                  {filtered.length} movie{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="scrollbar-hide max-h-[calc(70dvh-88px)] overflow-y-auto px-3 py-3">
              {filtered.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-white/50">
                  No movies found for this country.
                </p>
              ) : (
                <ul className="space-y-2">
                  {filtered
                    .sort((a, b) => (b.yourRating ?? 0) - (a.yourRating ?? 0))
                    .map((movie) => (
                      <li key={movie.tmdbId}>
                        <button
                          type="button"
                          onClick={() => onSelectMovie(movie)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-2.5 text-left ring-1 ring-white/5 transition hover:bg-white/10 hover:ring-rose-400/30"
                        >
                          <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                            {movie.posterPath ? (
                              <Image
                                src={posterUrl(movie.posterPath, "w185")!}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="44px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">
                              {movie.title}
                            </p>
                            <p className="text-xs text-white/45">
                              {movie.year || "—"}
                              {movie.yourRating != null
                                ? ` · Your rating ${movie.yourRating}/10`
                                : ""}
                            </p>
                          </div>
                          {movie.imdbRating != null ? (
                            <span className="shrink-0 rounded-md bg-[#f5c518]/15 px-2 py-1 text-xs font-semibold text-[#f5c518]">
                              {movie.imdbRating.toFixed(1)}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
