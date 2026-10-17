/** IMDb CSV title types that are not feature films for the globe. */
const EXCLUDED_GLOBE_TYPES = new Set([
  "tvseries",
  "tvminiseries",
  "tvepisode",
  "tvspecial",
  "tvshort",
  "tvseason",
]);

export function normalizeTitleType(titleType: string | null | undefined): string {
  return (titleType ?? "movie").trim().toLowerCase().replace(/\s+/g, "");
}

/** True for movies and similar; false for TV shows, episodes, etc. */
export function isGlobeEligibleTitleType(titleType: string | null | undefined): boolean {
  const normalized = normalizeTitleType(titleType);
  if (EXCLUDED_GLOBE_TYPES.has(normalized)) return false;
  if (normalized.startsWith("tv") && normalized !== "tvmovie") return false;
  return true;
}
