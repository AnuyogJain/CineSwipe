"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, User, X } from "@/components/icons";

export interface CastSearchSelection {
  id: number;
  name: string;
}

interface CastSearchFieldProps {
  selected: CastSearchSelection | null;
  onSelect: (person: CastSearchSelection) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function CastSearchField({
  selected,
  onSelect,
  onClear,
  disabled,
}: CastSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: number; name: string; profilePath: string | null }>
  >([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (selected) {
      setQuery("");
      setResults([]);
      setOpen(false);
    }
  }, [selected]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search/cast?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (selected) {
    return (
      <div className="min-w-0 flex-1">
        <div className="discover-toolbar-cast-chip">
          <User className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <span className="discover-toolbar-cast-chip__name min-w-0 truncate font-semibold">
            {selected.name}
          </span>
          <button
            type="button"
            disabled={disabled}
            aria-label="Clear actor filter"
            onClick={onClear}
            className="discover-toolbar-cast-chip__clear ml-auto shrink-0 rounded-full p-0.5 disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <label htmlFor={`${listId}-cast`} className="sr-only">
        Search by actor
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          id={`${listId}-cast`}
          type="search"
          value={query}
          disabled={disabled}
          placeholder="Actor…"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="discover-toolbar-input disabled:opacity-50"
        />
      </div>
      {open && results.length > 0 ? (
        <ul
          id={listId}
          className="glass-panel absolute left-0 top-full z-50 mt-1 max-h-48 w-full min-w-[12rem] overflow-y-auto rounded-2xl py-1"
        >
          {results.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs text-muted hover:bg-[var(--surface-hover)]"
                onClick={() => {
                  onSelect({ id: person.id, name: person.name });
                  setQuery("");
                  setOpen(false);
                }}
              >
                {person.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
