import "server-only";

import type { ApiKeys } from "./types";

function trimEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function demoApiKeysEnabled(): boolean {
  if (process.env.ALLOW_DEMO_API_KEYS === "true") return true;
  return process.env.NODE_ENV === "development";
}

export function getDemoApiKeysFromEnv(): ApiKeys | null {
  if (!demoApiKeysEnabled()) return null;
  const tmdbApiKey = trimEnv("CINESWIPE_DEMO_TMDB_API_KEY");
  const omdbApiKey = trimEnv("CINESWIPE_DEMO_OMDB_API_KEY");
  if (!tmdbApiKey || !omdbApiKey) return null;
  return { tmdbApiKey, omdbApiKey };
}

export function demoApiKeysAvailable(): boolean {
  return getDemoApiKeysFromEnv() !== null;
}
