import { Eye, Heart, iconActionClass, Star, X } from "@/components/icons";

interface ActionBarProps {
  onPass: () => void;
  onLike: () => void;
  onWishlist: () => void;
  onWatched: () => void;
  watched?: boolean;
  disabled?: boolean;
  className?: string;
}

export const actionSideButtonClass =
  "flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950/75 shadow-lg shadow-black/40 ring-1 backdrop-blur-md transition hover:scale-105 disabled:opacity-40";

export function ActionBar({
  onPass,
  onLike,
  onWishlist,
  onWatched,
  watched = false,
  disabled,
  className = "",
}: ActionBarProps) {
  return (
    <div
      className={`flex w-full items-center justify-between gap-3 ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onWishlist}
        aria-label="Add to wishlist"
        className={`${actionSideButtonClass} text-amber-300 ring-amber-300/40 hover:bg-amber-400/10`}
      >
        <Star className={iconActionClass} strokeWidth={2} aria-hidden />
      </button>
      <div className="flex items-center gap-5">
        <button
          type="button"
          disabled={disabled}
          onClick={onPass}
          aria-label="Pass"
          className={`${actionSideButtonClass} text-rose-400 ring-rose-400/30 hover:bg-rose-500/10`}
        >
          <X className={iconActionClass} strokeWidth={2.5} aria-hidden />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onLike}
          aria-label="Like"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/45 ring-2 ring-rose-400/25 transition hover:scale-105 disabled:opacity-40"
        >
          <Heart
            className="h-7 w-7 shrink-0"
            strokeWidth={2}
            fill="currentColor"
            aria-hidden
          />
        </button>
      </div>
      <button
        type="button"
        disabled={disabled || watched}
        onClick={onWatched}
        aria-label={watched ? "Already in watched" : "Mark as watched"}
        title={watched ? "In watched" : "Mark watched"}
        className={`${actionSideButtonClass} ${
          watched
            ? "bg-sky-500/15 text-sky-200 ring-sky-400/40"
            : "text-sky-300 ring-sky-400/40 hover:bg-sky-400/10"
        }`}
      >
        <Eye className={iconActionClass} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
