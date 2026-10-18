"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countryFilterOptions } from "@/lib/countries";
import { normalizeGenreName } from "@/lib/genres";
import { ORIGIN_LANGUAGES } from "@/lib/languages";
import {
  EMPTY_LIST_FILTERS,
  normalizeCountryCodes,
  type ListFilters,
} from "@/lib/list-filters";
import { iconHeaderClass, SlidersHorizontal } from "@/components/icons";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

interface ListFilterMenuProps {
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
  /** Taste-profile genres (Discover) — amber highlight in genre list */
  highlightGenres?: string[];
  showLanguage?: boolean;
  /** Globe recommend mode — country fixed, not editable */
  lockCountries?: boolean;
  /** Display name when country is locked */
  countryLabel?: string | null;
  disabled?: boolean;
  dropdownAlign?: "left" | "right";
  showTasteHint?: boolean;
}

export function ListFilterMenu({
  filters,
  onChange,
  highlightGenres = [],
  showLanguage = true,
  lockCountries = false,
  countryLabel = null,
  disabled,
  dropdownAlign = "right",
  showTasteHint = false,
}: ListFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [allGenres, setAllGenres] = useState<
    Array<{ name: string; id: number }>
  >([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const active =
    filters.genres.length > 0 ||
    filters.languages.length > 0 ||
    filters.countries.length > 0 ||
    Boolean(lockCountries && countryLabel);

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
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const genreOptions = useMemo(
    () =>
      allGenres.map((g) => {
        const name = normalizeGenreName(g.name);
        return {
          value: name,
          label: name,
          highlight: highlightGenres.some(
            (h) => normalizeGenreName(h).toLowerCase() === name.toLowerCase()
          ),
        };
      }),
    [allGenres, highlightGenres]
  );

  const languageOptions = useMemo(
    () =>
      ORIGIN_LANGUAGES.map((l) => ({
        value: l.code,
        label: l.label,
      })),
    []
  );

  const countryOptions = useMemo(
    () =>
      countryFilterOptions().map(({ code, label }) => ({
        value: code,
        label,
      })),
    []
  );

  const panelAlignClass = dropdownAlign === "left" ? "left-0" : "right-0";

  const clearAll = () => {
    if (lockCountries) {
      onChange({
        ...filters,
        genres: [],
        languages: [],
      });
      return;
    }
    onChange(EMPTY_LIST_FILTERS);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Filter"
        title={
          disabled
            ? "Clear the actor filter to change genres and countries"
            : "Filter"
        }
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`toolbar-chip disabled:opacity-50 ${
          active ? "toolbar-chip--active" : ""
        }`}
      >
        <SlidersHorizontal
          className={iconHeaderClass}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className={`filter-menu-panel glass-panel absolute ${panelAlignClass} top-full z-[120] mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-2xl p-3`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            {active ? (
              <button
                type="button"
                className="text-[10px] text-white/45 hover:text-white/70"
                onClick={clearAll}
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
              disabled={disabled}
            />
            {showLanguage ? (
              <MultiSelectDropdown
                label="Language"
                options={languageOptions}
                selected={filters.languages}
                onChange={(languages) => onChange({ ...filters, languages })}
                placeholder="Any language"
                disabled={disabled}
              />
            ) : null}
            <MultiSelectDropdown
              label="Country"
              options={countryOptions}
              selected={filters.countries}
              onChange={(countries) =>
                onChange({
                  ...filters,
                  countries: normalizeCountryCodes(countries),
                })
              }
              placeholder="Any country"
              disabled={disabled}
              readOnly={lockCountries && filters.countries.length > 0}
            />
          </div>
          {showTasteHint ? (
            <p className="mt-2 px-0.5 text-[10px] text-subtle">
              Amber genres match your taste profile
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
