"use client";

import { useState } from "react";
import { Search, iconHeaderClass } from "@/components/icons";
import { MovieSearchDialog } from "./MovieSearchDialog";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="app-header shrink-0 border-b border-border bg-[var(--header-bg)] px-4 py-2.5 backdrop-blur-xl">
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
              className="header-icon-btn glass-panel size-10 p-0 hover:bg-[var(--surface-hover)]"
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
