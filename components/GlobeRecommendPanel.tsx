"use client";

import { useEffect } from "react";
import type { GlobeCountry } from "@/lib/globe-types";
import { SwipeDeck } from "./SwipeDeck";

interface GlobeRecommendPanelProps {
  country: GlobeCountry | null;
  onClose: () => void;
}

export function GlobeRecommendPanel({
  country,
  onClose,
}: GlobeRecommendPanelProps) {
  useEffect(() => {
    if (!country) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [country, onClose]);

  if (!country) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close recommendations"
        className="globe-recommend-deck__scrim"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Discover movies from ${country.name}`}
        className="globe-recommend-deck fixed flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="globe-recommend-deck__header flex shrink-0 items-center justify-between px-3 py-3">
          <div className="min-w-0">
            <p className="globe-recommend-deck__eyebrow">
              Discover · {country.iso}
            </p>
            <h3 className="globe-recommend-deck__title truncate font-display text-lg font-bold">
              {country.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="globe-recommend-deck__back shrink-0 rounded-full px-3 py-1.5 text-sm transition"
          >
            Back to map
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2">
          <SwipeDeck
            key={country.iso}
            initialCountry={country.iso}
            countryLabel={country.name}
            lockCountries
            showGlobeNavLink={false}
          />
        </div>
      </div>
    </>
  );
}
