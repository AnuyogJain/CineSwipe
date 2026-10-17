import { ExternalLink, Star } from "@/components/icons";
import { imdbTitleUrl } from "@/lib/imdb-url";

interface ImdbRatingBadgeProps {
  rating: number | null;
  imdbId?: string | null;
  votes?: string | null;
  size?: "sm" | "lg";
  /** Single-line pill for tight grid cards */
  compact?: boolean;
}

function formatVotesShort(votes: string): string {
  const n = Number.parseInt(votes.replace(/,/g, ""), 10);
  if (!Number.isFinite(n)) return votes;
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return votes;
}

export function ImdbRatingBadge({
  rating,
  imdbId,
  votes,
  size = "sm",
  compact = false,
}: ImdbRatingBadgeProps) {
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  const starClass = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  const href = imdbTitleUrl(imdbId);
  const votesLabel = votes ? formatVotesShort(votes) : null;

  const badge = (
    <span
      className={`inline-flex max-w-full flex-nowrap items-center gap-1 rounded-full bg-black/60 py-1 font-medium text-imdb-yellow backdrop-blur-sm ${
        compact ? "px-2 text-[10px] leading-none" : "px-2.5"
      } ${
        href
          ? "transition hover:bg-black/80 hover:ring-1 hover:ring-imdb-yellow/40"
          : ""
      }`}
    >
      <Star
        className={`shrink-0 ${starClass} text-imdb-yellow`}
        strokeWidth={2}
        fill="currentColor"
        aria-hidden
      />
      <span className="shrink-0 text-white/90">IMDb</span>
      <span className="shrink-0 font-semibold tabular-nums text-white">
        {rating != null ? rating.toFixed(1) : "N/A"}
      </span>
      {votesLabel ? (
        <span
          className="min-w-0 shrink truncate text-white/60"
          title={votes ? `${votes} votes` : undefined}
        >
          · {votesLabel}
        </span>
      ) : null}
      {href ? (
        <ExternalLink
          className="h-3 w-3 shrink-0 text-white/40"
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
    </span>
  );

  return (
    <div
      className={`items-center gap-2 ${textSize} ${
        compact ? "flex min-w-0 max-w-full flex-nowrap" : "flex flex-wrap"
      }`}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Open on IMDb"
          className="min-w-0 max-w-full shrink"
        >
          {badge}
        </a>
      ) : (
        badge
      )}
    </div>
  );
}
