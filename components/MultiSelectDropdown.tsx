"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "@/components/icons";

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
  /** Show selection styling but do not open the list (e.g. globe-locked country). */
  readOnly?: boolean;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = "Any",
  disabled,
  readOnly = false,
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
      <p className="mb-1 px-0.5 text-[10px] font-medium uppercase tracking-wider text-subtle">
        {label}
      </p>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={readOnly ? undefined : open}
        aria-controls={readOnly ? undefined : listId}
        aria-readonly={readOnly || undefined}
        onClick={() => {
          if (disabled || readOnly) return;
          setOpen((v) => !v);
        }}
        className={`select-dropdown-trigger${
          selected.length > 0 ? " select-dropdown-trigger--selected" : ""
        } ${readOnly ? "cursor-default" : ""}`}
      >
        <span className="truncate">{summary}</span>
        {readOnly ? null : open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
        )}
      </button>

      {open && !readOnly ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable
          className="select-dropdown-menu select-dropdown-menu--down z-40"
        >
          {selected.length > 0 ? (
            <button
              type="button"
              className="select-dropdown-option text-xs text-subtle"
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
                {opt.highlight && !checked ? (
                  <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--warning-text)]">
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
