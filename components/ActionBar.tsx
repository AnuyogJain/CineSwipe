interface ActionBarProps {
  onPass: () => void;
  onLike: () => void;
  onWishlist: () => void;
  onWatched: () => void;
  watched?: boolean;
  disabled?: boolean;
}

const sideButtonClass =
  "flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl ring-1 transition hover:scale-105 disabled:opacity-40";

export function ActionBar({
  onPass,
  onLike,
  onWishlist,
  onWatched,
  watched = false,
  disabled,
}: ActionBarProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onWishlist}
        aria-label="Add to wishlist"
        className={`${sideButtonClass} text-amber-300 ring-amber-300/40 hover:bg-amber-400/10`}
      >
        ★
      </button>
      <div className="flex items-center gap-5">
        <button
          type="button"
          disabled={disabled}
          onClick={onPass}
          aria-label="Pass"
          className={`${sideButtonClass} text-rose-400 ring-rose-400/30 hover:bg-rose-500/10`}
        >
          ✕
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onLike}
          aria-label="Like"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-2xl text-white shadow-lg shadow-rose-500/30 transition hover:scale-105 disabled:opacity-40"
        >
          ♥
        </button>
      </div>
      <button
        type="button"
        disabled={disabled || watched}
        onClick={onWatched}
        aria-label={watched ? "Already in watched" : "Mark as watched"}
        title={watched ? "In watched" : "Mark watched"}
        className={`${sideButtonClass} ${
          watched
            ? "bg-sky-500/15 text-sky-200 ring-sky-400/40"
            : "text-sky-300 ring-sky-400/40 hover:bg-sky-400/10"
        }`}
      >
        👁
      </button>
    </div>
  );
}
