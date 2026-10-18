"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "@/components/icons";

export interface SingleSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SingleSelectDropdownProps<T extends string> {
  label: string;
  options: SingleSelectOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  busy?: boolean;
  /** Compact width for detail panel header */
  compact?: boolean;
}

export function SingleSelectDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  busy,
  compact = false,
}: SingleSelectDropdownProps<T>) {
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

  const summary =
    options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";
  const hasSelection = value !== "none";

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 shrink-0 ${compact ? "w-[9.25rem]" : "flex-1"}`}
    >
      <p className="mb-1 px-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </p>
      <button
        type="button"
        disabled={disabled || busy}
        aria-expanded={open}
        aria-controls={listId}
        aria-busy={busy}
        onClick={() => {
          if (disabled || busy) return;
          setOpen((v) => !v);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ring-1 transition disabled:opacity-50 ${
          hasSelection
            ? "bg-rose-500/15 text-rose-50 ring-rose-400/40"
            : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"
        }`}
      >
        <span className="truncate">{summary}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="glass-panel absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl py-1"
        >
          {options.map((opt) => {
            const checked = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => {
                  if (opt.value !== value) onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-white/8 ${
                  checked ? "bg-rose-500/15 text-rose-100" : "text-white/80"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked
                      ? "border-rose-400/60 bg-rose-500/40 text-white"
                      : "border-white/25 bg-transparent"
                  }`}
                  aria-hidden
                >
                  {checked ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
