/** Relative in-app path only — blocks open redirects. */
export function sanitizeRelativeNext(raw: string | null | undefined): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("://")) return "/";
  return trimmed;
}
