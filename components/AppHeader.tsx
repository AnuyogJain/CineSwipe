"use client";

import { useState } from "react";
import { Search, iconHeaderClass } from "@/components/icons";
import { MovieSearchDialog } from "./MovieSearchDialog";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="app-header relative z-50 shrink-0 border-b border-[var(--border-subtle)] px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <h1 className="font-display text-xl font-bold leading-none tracking-wide">
            <span className="text-[var(--cinema-gold)]">Cine</span>
            <span className="text-foreground">Swipe</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search movies"
              title="Search movies"
              onClick={() => setSearchOpen(true)}
              className="glass-panel flex shrink-0 items-center justify-center rounded-full p-2.5 transition hover:brightness-110"
            >
              <Search className={iconHeaderClass} strokeWidth={2} aria-hidden />
            </button>
            <UserMenu />
          </div>
        </div>
      </header>
      <MovieSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
