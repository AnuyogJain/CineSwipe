interface GenreChipProps {
  label: string;
  active?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

export function GenreChip({ label, active, highlight, onClick }: GenreChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-[var(--accent-soft)] text-accent-text ring-1 ring-[var(--accent)]/40"
          : highlight
            ? "bg-[rgb(245_197_24/0.12)] text-[var(--cinema-gold)] ring-1 ring-[rgb(245_197_24/0.35)] hover:brightness-110"
            : "bg-[var(--pill-bg)] text-white/80 ring-1 ring-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {label}
    </button>
  );
}
