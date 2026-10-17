"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeGenreName } from "@/lib/genres";
import { ORIGIN_LANGUAGES } from "@/lib/languages";
import type { ListFilters } from "@/lib/list-filters";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

interface ListFilterMenuProps {
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
}

export function ListFilterMenu({ filters, onChange }: ListFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [allGenres, setAllGenres] = useState<Array<{ name: string; id: number }>>(
    [],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const active =
    filters.genres.length > 0 || filters.languages.length > 0;

  useEffect(() => {
    fetch("/api/genres")
      .then((r) => r.json())
      .then((data) => setAllGenres(data.genres ?? []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const genreOptions = useMemo(
    () =>
      allGenres.map((g) => ({
        value: normalizeGenreName(g.name),
        label: normalizeGenreName(g.name),
      })),
    [allGenres],
  );

  const languageOptions = useMemo(
    () =>
      ORIGIN_LANGUAGES.map((l) => ({
        value: l.code,
        label: l.label,
      })),
    [],
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Filter list"
        title="Filter"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center rounded-xl border px-3 py-2 text-lg transition hover:bg-white/10 ${
          active
            ? "border-rose-400/40 bg-rose-500/15 ring-1 ring-rose-400/30"
            : "border-white/10 bg-surface"
        }`}
      >
        <span aria-hidden>🎛️</span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-white/10 bg-zinc-950/98 p-3 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Filters
            </p>
            {active ? (
              <button
                type="button"
                className="text-[10px] text-white/45 hover:text-white/70"
                onClick={() => onChange({ genres: [], languages: [] })}
              >
                Clear all
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            <MultiSelectDropdown
              label="Genre"
              options={genreOptions}
              selected={filters.genres}
              onChange={(genres) => onChange({ ...filters, genres })}
              placeholder="Any genre"
            />
            <MultiSelectDropdown
              label="Language"
              options={languageOptions}
              selected={filters.languages}
              onChange={(languages) => onChange({ ...filters, languages })}
              placeholder="Any language"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
