import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { withUser } from "@/lib/api/run-with-user";
import { forUser } from "@/lib/db/user-scope";
import { db } from "@/lib/db";
import { swipeActions } from "@/lib/db/schema";
import { updateTasteProfileFromSwipe } from "@/lib/taste-profile";
import { requestUserId } from "@/lib/user-context";
import type { MovieCandidate } from "@/lib/types";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["pass", "like", "wishlist"]),
  movie: z.object({
    tmdbId: z.number(),
    imdbId: z.string().nullable().optional(),
    title: z.string(),
    matchScore: z.number().optional(),
    genres: z.array(z.string()),
    director: z.string().optional(),
    cast: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        character: z.string(),
        profilePath: z.string().nullable(),
      }),
    ),
    year: z.number(),
    runtime: z.number().nullable(),
  }),
  fullPayload: z.custom<MovieCandidate>().optional(),
});

export const POST = withUser(async (request: Request) => {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid swipe payload" }, { status: 400 });
    }

    const { action, movie, fullPayload } = parsed.data;
    const userId = requestUserId();

    if (action === "wishlist") {
      const existing = await db
        .select({ id: swipeActions.id })
        .from(swipeActions)
        .where(
          and(
            forUser(swipeActions),
            eq(swipeActions.tmdbId, movie.tmdbId),
            eq(swipeActions.action, "wishlist"),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(swipeActions).values({
          userId,
          tmdbId: movie.tmdbId,
          imdbId: movie.imdbId ?? null,
          title: movie.title,
          action,
          matchScore: movie.matchScore ?? null,
          payload: fullPayload ? JSON.stringify(fullPayload) : null,
          createdAt: new Date(),
        });
      }

      await db
        .delete(swipeActions)
        .where(
          and(
            forUser(swipeActions),
            eq(swipeActions.tmdbId, movie.tmdbId),
            eq(swipeActions.action, "like"),
          ),
        );
    } else {
      if (action === "pass" || action === "like") {
        await db
          .delete(swipeActions)
          .where(
            and(
              forUser(swipeActions),
              eq(swipeActions.tmdbId, movie.tmdbId),
              eq(swipeActions.action, action),
            ),
          );
      }
      await db.insert(swipeActions).values({
        userId,
        tmdbId: movie.tmdbId,
        imdbId: movie.imdbId ?? null,
        title: movie.title,
        action,
        matchScore: movie.matchScore ?? null,
        payload: fullPayload ? JSON.stringify(fullPayload) : null,
        createdAt: new Date(),
      });
    }

    await updateTasteProfileFromSwipe(
      {
        genres: movie.genres,
        director: movie.director,
        cast: movie.cast.map((c) => c.name),
        year: movie.year,
        runtime: movie.runtime,
      },
      action,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swipe failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
