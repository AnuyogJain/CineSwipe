"use client";

import Link from "next/link";
import {
  Clapperboard,
  ChevronRight,
  Globe,
  iconActionClass,
} from "@/components/icons";

interface HomeDiscoverHeroProps {
  keysReady: boolean;
  hasProfile: boolean;
  topGenres: string[];
}

export function HomeDiscoverHero({
  keysReady,
  hasProfile,
  topGenres,
}: HomeDiscoverHeroProps) {
  let discoverHref = "/discover";
  let discoverLabel = "Start swiping";
  let subtitle =
    "Swipe through taste-matched picks, then explore your library on the world map.";

  if (!keysReady) {
    discoverHref = "/settings";
    discoverLabel = "Add API keys";
    subtitle = "Add TMDB and OMDb keys to unlock Discover and the globe map.";
  } else if (!hasProfile) {
    discoverHref = "/import";
    discoverLabel = "Import ratings";
    subtitle =
      "Import your IMDb CSV to personalize Discover and plot watched titles on the globe.";
  } else if (topGenres.length > 0) {
    subtitle = `Picks tuned to ${topGenres
      .slice(0, 3)
      .join(", ")} and more, map liked and watched movies by country.`;
  }

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-rose-950/90 via-zinc-950 to-sky-950/50 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 ring-1 ring-rose-400/30">
            <Clapperboard
              className={`${iconActionClass} text-rose-200`}
              strokeWidth={2}
              aria-hidden
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/90">
            Discover &amp; Globe
          </p>
          <h2 className="mt-0.5 text-lg font-bold leading-snug text-white">
            Find films and see them on the map
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55">
            {subtitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={discoverHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-950/40 transition hover:bg-rose-400"
            >
              {discoverLabel}
              <ChevronRight
                className="h-4 w-4 shrink-0 opacity-90"
                aria-hidden
              />
            </Link>
            <Link
              href="/globe?source=viewed"
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-600/90 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-950/30 ring-1 ring-sky-400/25 transition hover:bg-sky-500"
            >
              Open globe
              <ChevronRight
                className="h-4 w-4 shrink-0 opacity-90"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
