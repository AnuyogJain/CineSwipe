"use client";

import type { ReactNode } from "react";

function pageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

function PageControl({
  children,
  active,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition disabled:opacity-40 ${
        active
          ? "bg-rose-500/25 text-rose-100 ring-1 ring-rose-400/40"
          : "bg-white/10 text-white/80 hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}

export function ListPagination({
  page,
  totalPages,
  onPageChange,
  loading = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  if (totalPages <= 1) return null;

  const items = pageWindow(page, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 px-4 pb-6 pt-2"
      aria-label="Pagination"
    >
      <PageControl
        label="Previous page"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </PageControl>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-sm text-white/35"
            aria-hidden
          >
            …
          </span>
        ) : (
          <PageControl
            key={item}
            label={`Page ${item}`}
            active={item === page}
            disabled={loading}
            onClick={() => onPageChange(item)}
          >
            {item}
          </PageControl>
        ),
      )}

      <PageControl
        label="Next page"
        disabled={page >= totalPages || loading}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </PageControl>
    </nav>
  );
}
