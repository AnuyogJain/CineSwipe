import "server-only";

import { db } from "@/lib/db";
import { tasteProfile } from "@/lib/db/schema";

export async function insertEmptyTasteProfile(userId: string): Promise<void> {
  const now = new Date();
  await db.insert(tasteProfile).values({
    userId,
    genres: "{}",
    directors: "{}",
    cast: "{}",
    decades: "{}",
    avgRuntime: 120,
    titleTypeBias: "{}",
    genrePenalties: "{}",
    updatedAt: now,
  });
}
