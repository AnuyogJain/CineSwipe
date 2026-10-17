"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Soft highlight (e.g. taste-preferred genres) */
  highlight?: boolean;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = "Any",
  disabled,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected
            .map((v) => options.find((o) => o.value === v)?.label ?? v)
            .join(", ")
        : `${selected.length} selected`;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <p className="mb-1 px-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </p>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition disabled:opacity-50 ${
          selected.length > 0
            ? "bg-rose-500/15 text-rose-50 ring-rose-400/40"
            : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"
        }`}
      >
        <span className="truncate">{summary}</span>
        <span className="shrink-0 text-white/45" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-xl bg-zinc-950/98 py-1 shadow-xl ring-1 ring-white/15 backdrop-blur-xl"
        >
          {selected.length > 0 ? (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          ) : null}
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(opt.value)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-white/8 ${
                  checked
                    ? "bg-rose-500/15 text-rose-100"
                    : opt.highlight
                      ? "text-amber-100/90"
                      : "text-white/80"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                    checked
                      ? "border-rose-400/60 bg-rose-500/40 text-white"
                      : "border-white/25 bg-transparent text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="truncate">{opt.label}</span>
                {opt.highlight && !checked ? (
                  <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wide text-amber-400/70">
                    taste
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
