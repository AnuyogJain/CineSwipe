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
      <div className="flex min-w-0 items-center gap-1 rounded-xl border border-violet-400/35 bg-violet-500/15 px-2 py-1.5 text-xs text-violet-100">
        <User className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        <span className="min-w-0 truncate font-medium">{selected.name}</span>
        <button
          type="button"
          disabled={disabled}
          aria-label="Clear actor filter"
          onClick={onClear}
          className="shrink-0 rounded p-0.5 text-violet-200/80 hover:bg-violet-500/20 hover:text-white disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
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
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35"
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
          className="w-full rounded-xl border border-white/10 bg-surface py-2 pl-8 pr-2 text-xs text-white/90 outline-none ring-rose-400/30 placeholder:text-white/35 focus:ring-1 disabled:opacity-50"
        />
      </div>
      {open && results.length > 0 ? (
        <ul
          id={listId}
          className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full min-w-[12rem] overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/98 py-1 shadow-xl backdrop-blur-xl"
        >
          {results.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs text-white/85 hover:bg-white/8"
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
