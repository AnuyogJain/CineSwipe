import "server-only";

import { eq } from "drizzle-orm";
import { requestUserId } from "./auth/user-context";
import { db } from "./db";
import { userApiKeys } from "./db/schema";
import type { ApiKeys } from "./types";

export async function getApiKeys(): Promise<ApiKeys> {
  const userId = requestUserId();
  const rows = await db
    .select()
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))
    .limit(1);
  const row = rows[0];
  return {
    tmdbApiKey: row?.tmdbApiKey ?? null,
    omdbApiKey: row?.omdbApiKey ?? null,
  };
}

export async function setApiKeys(keys: {
  tmdbApiKey?: string;
  omdbApiKey?: string;
}): Promise<void> {
  const userId = requestUserId();
  const existing = await db
    .select()
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))
    .limit(1);
  const now = new Date();
  const current = existing[0];

  const nextTmdb =
    keys.tmdbApiKey !== undefined && keys.tmdbApiKey.length > 0
      ? keys.tmdbApiKey
      : current?.tmdbApiKey ?? null;
  const nextOmdb =
    keys.omdbApiKey !== undefined && keys.omdbApiKey.length > 0
      ? keys.omdbApiKey
      : current?.omdbApiKey ?? null;

  if (!current) {
    if (!nextTmdb && !nextOmdb) return;
    await db.insert(userApiKeys).values({
      userId,
      tmdbApiKey: nextTmdb,
      omdbApiKey: nextOmdb,
      updatedAt: now,
    });
    return;
  }

  const patch: Partial<typeof userApiKeys.$inferInsert> = { updatedAt: now };
  if (keys.tmdbApiKey !== undefined && keys.tmdbApiKey.length > 0) {
    patch.tmdbApiKey = keys.tmdbApiKey;
  }
  if (keys.omdbApiKey !== undefined && keys.omdbApiKey.length > 0) {
    patch.omdbApiKey = keys.omdbApiKey;
  }

  if (Object.keys(patch).length <= 1) return;

  await db.update(userApiKeys).set(patch).where(eq(userApiKeys.userId, userId));
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
