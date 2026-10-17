"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GlobeCountry } from "@/lib/globe-types";
import { SwipeDeck } from "./SwipeDeck";

interface GlobeRecommendPanelProps {
  country: GlobeCountry | null;
  onClose: () => void;
}

export function GlobeRecommendPanel({ country, onClose }: GlobeRecommendPanelProps) {
  useEffect(() => {
    if (!country) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [country, onClose]);

  return (
    <AnimatePresence>
      {country ? (
        <>
          <motion.button
            type="button"
            aria-label="Close recommendations"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Discover movies from ${country.name}`}
            className="globe-recommend-deck theme-keep-dark fixed inset-x-0 top-[57px] bottom-14 z-50 mx-auto flex max-w-lg flex-col overflow-hidden border-x border-white/10 bg-zinc-950 shadow-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-rose-300/80">
                  Discover · {country.iso}
                </p>
                <h3 className="truncate text-lg font-bold text-white">{country.name}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/15"
              >
                Back to map
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SwipeDeck
                key={country.iso}
                initialCountry={country.iso}
                countryLabel={country.name}
                lockCountries
                showGlobeNavLink={false}
              />
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
