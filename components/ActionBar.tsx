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
  "action-side-btn flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface backdrop-blur-md transition hover:scale-105 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40";

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
        className={`${actionSideButtonClass} action-side-btn--wishlist text-amber-500 hover:bg-amber-500/10`}
      >
        <Star className={iconActionClass} strokeWidth={2} aria-hidden />
      </button>
      <div className="flex items-center gap-5">
        <button
          type="button"
          disabled={disabled}
          onClick={onPass}
          aria-label="Pass"
          className={`${actionSideButtonClass} action-side-btn--pass text-rose-500 hover:bg-rose-500/10`}
        >
          <X className={iconActionClass} strokeWidth={2.5} aria-hidden />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onLike}
          aria-label="Like"
          className="action-bar-like"
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
        className={`${actionSideButtonClass} action-side-btn--watched ${
          watched
            ? "bg-sky-500/15 text-sky-600"
            : "text-sky-600 hover:bg-sky-500/10"
        }`}
      >
        <Eye className={iconActionClass} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
