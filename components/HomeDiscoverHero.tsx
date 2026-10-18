"use client";

import Link from "next/link";
import {
  Clapperboard,
  ChevronRight,
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
  } else if (topGenres.length > 0) {
    subtitle = `Picks tuned to ${topGenres
      .slice(0, 3)
      .join(", ")} and more, map liked and watched movies by country.`;
  } else if (hasProfile) {
    subtitle =
      "Swipe to train your taste — import IMDb CSV anytime for richer picks.";
  }

  return (
    <section className="home-discover-hero">
      <div className="home-discover-hero__icon">
        <Clapperboard className={iconActionClass} strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="home-discover-hero__eyebrow">Discover &amp; Globe</p>
        <h2 className="home-discover-hero__title">
          Find films and see them on the map
        </h2>
        <p className="home-discover-hero__body">{subtitle}</p>
        <div className="home-discover-hero__actions">
          <Link
            href={discoverHref}
            className="home-discover-hero__cta home-discover-hero__cta--primary"
          >
            {discoverLabel}
            <ChevronRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          </Link>
          <Link
            href="/globe?source=viewed"
            className="home-discover-hero__cta home-discover-hero__cta--secondary"
          >
            Open globe
            <ChevronRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
