function parsePublicHttpUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/** Server-only — set `CINEDLE_APP_URL` in `.env.local` (restart dev after changes). */
export function getCinedleAppUrl(): string | null {
  return parsePublicHttpUrl(process.env.CINEDLE_APP_URL);
}
