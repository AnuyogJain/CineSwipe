/** User-safe message when Turso/Drizzle queries fail (no SQL leakage). */
export function publicDbErrorMessage(error: unknown, fallback: string): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (
    lower.includes("no such table") ||
    lower.includes("not configured") ||
    lower.includes("turso_database_url")
  ) {
    return "Database not set up. Add Turso env vars to .env.local and run npm run db:push.";
  }
  if (msg.startsWith("Failed query:")) {
    return "Database unavailable. Confirm Turso credentials and run npm run db:push.";
  }
  return fallback;
}
