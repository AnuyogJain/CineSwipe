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
          ? "bg-rose-500/30 text-rose-100 ring-1 ring-rose-400/50"
          : highlight
            ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30 hover:bg-amber-500/25"
            : "bg-white/10 text-white/80 ring-1 ring-white/10 hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}
