"use client";

import { useState } from "react";
import { Search, iconHeaderClass } from "@/components/icons";
import { MovieSearchDialog } from "./MovieSearchDialog";

export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="app-header z-40 shrink-0 border-b px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <h1 className="text-lg font-bold leading-none">
            <span className="font-normal text-accent-text">Cine</span>
            Swipe
          </h1>
          <button
            type="button"
            aria-label="Search movies"
            title="Search movies"
            onClick={() => setSearchOpen(true)}
            className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface px-3 py-2 transition hover:bg-white/10"
          >
            <Search className={iconHeaderClass} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </header>
      <MovieSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
