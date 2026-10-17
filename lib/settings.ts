import "server-only";

import { eq } from "drizzle-orm";
import { db } from "./db";
import { appSettings } from "./db/schema";
import type { ApiKeys } from "./types";

const TMDB_KEY = "tmdb_api_key";
const OMDB_KEY = "omdb_api_key";

export async function getApiKeys(): Promise<ApiKeys> {
  const rows = await db.select().from(appSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    tmdbApiKey: map[TMDB_KEY] ?? null,
    omdbApiKey: map[OMDB_KEY] ?? null,
  };
}

export async function setApiKeys(keys: {
  tmdbApiKey?: string;
  omdbApiKey?: string;
}): Promise<void> {
  const now = new Date();
  if (keys.tmdbApiKey !== undefined && keys.tmdbApiKey.length > 0) {
    await db
      .insert(appSettings)
      .values({ key: TMDB_KEY, value: keys.tmdbApiKey, updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: keys.tmdbApiKey, updatedAt: now },
      });
  }
  if (keys.omdbApiKey !== undefined && keys.omdbApiKey.length > 0) {
    await db
      .insert(appSettings)
      .values({ key: OMDB_KEY, value: keys.omdbApiKey, updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: keys.omdbApiKey, updatedAt: now },
      });
  }
}

export async function hasRequiredKeys(): Promise<boolean> {
  const keys = await getApiKeys();
  return Boolean(keys.tmdbApiKey && keys.omdbApiKey);
}

export function maskKey(key: string | null): string {
  if (!key) return "";
  if (key.length <= 4) return "****";
  return `${"*".repeat(key.length - 4)}${key.slice(-4)}`;
}
