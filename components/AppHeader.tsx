"use client";

import Link from "next/link";
import { useState } from "react";
import { Film, Search, iconHeaderClass } from "@/components/icons";
import { CineSwipeLogo } from "./CineSwipeLogo";
import { CinedleAboutDialog } from "./CinedleAboutDialog";
import { MovieSearchDialog } from "./MovieSearchDialog";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  cinedleAppUrl: string | null;
}

export function AppHeader({ cinedleAppUrl }: AppHeaderProps) {
  const [cinedleOpen, setCinedleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="app-header flex h-10 shrink-0 items-center border-b border-border bg-[var(--header-bg)] px-3 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <h1 className="font-display text-lg font-bold leading-none tracking-wide">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
              aria-label="CineSwipe Home"
            >
              <CineSwipeLogo size={20} className="shrink-0 drop-shadow-sm" />
              <span>
                <span className="text-[var(--cinema-gold)]">Cine</span>
                <span className="text-foreground">Swipe</span>
              </span>
            </Link>
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="About Cinedle"
              title="Cinedle"
              onClick={() => setCinedleOpen(true)}
              className="header-icon-btn glass-panel size-8 p-0 hover:bg-[var(--surface-hover)]"
            >
              <Film className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Search movies"
              title="Search movies"
              onClick={() => setSearchOpen(true)}
              className="header-icon-btn glass-panel size-8 p-0 hover:bg-[var(--surface-hover)]"
            >
              <Search className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            </button>
            <UserMenu />
          </div>
        </div>
      </header>
      <CinedleAboutDialog
        open={cinedleOpen}
        onClose={() => setCinedleOpen(false)}
        appUrl={cinedleAppUrl}
      />
      <MovieSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
