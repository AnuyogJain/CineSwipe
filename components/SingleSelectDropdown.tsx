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
  /** Open menu above trigger (better inside scroll panels) */
  menuPlacement?: "down" | "up";
}

export function SingleSelectDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  busy,
  compact = false,
  menuPlacement = "down",
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
      {label ? (
        <p className="mb-1 px-0.5 text-[10px] font-medium uppercase tracking-wider text-subtle">
          {label}
        </p>
      ) : null}
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
        className={`select-dropdown-trigger${
          hasSelection ? " select-dropdown-trigger--selected" : ""
        }`}
      >
        <span className="truncate">{summary}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className={`select-dropdown-menu select-dropdown-menu--${menuPlacement} z-[80]`}
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
                className={`select-dropdown-option${
                  checked ? " select-dropdown-option--selected" : ""
                }`}
              >
                <span className="select-dropdown-check" aria-hidden>
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
