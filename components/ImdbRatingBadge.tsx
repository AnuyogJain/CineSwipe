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
  const href = imdbTitleUrl(imdbId);
  const votesLabel = votes ? formatVotesShort(votes) : null;

  const badge = (
    <span
      className={[
        "imdb-rating-badge",
        size === "lg" ? "imdb-rating-badge--lg" : "",
        compact ? "imdb-rating-badge--compact" : "",
        href ? "imdb-rating-badge--interactive" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Star className="imdb-rating-badge__star" strokeWidth={2} fill="currentColor" aria-hidden />
      <span className="imdb-rating-badge__label">IMDb</span>
      <span className="imdb-rating-badge__score tabular-nums">
        {rating != null ? rating.toFixed(1) : "N/A"}
      </span>
      {votesLabel ? (
        <span
          className="imdb-rating-badge__votes min-w-0 shrink truncate"
          title={votes ? `${votes} votes` : undefined}
        >
          · {votesLabel}
        </span>
      ) : null}
      {href ? (
        <ExternalLink className="imdb-rating-badge__link-icon" strokeWidth={2} aria-hidden />
      ) : null}
    </span>
  );

  return (
    <div
      className={[
        "imdb-rating-badge-wrap",
        size === "lg" ? "imdb-rating-badge-wrap--lg" : "",
        compact ? "imdb-rating-badge-wrap--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Open on IMDb"
          className="imdb-rating-badge__anchor min-w-0 max-w-full shrink"
        >
          {badge}
        </a>
      ) : (
        badge
      )}
    </div>
  );
}
