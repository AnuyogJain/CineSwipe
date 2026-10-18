import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { withUser } from "@/lib/api/run-with-user";
import { forUser } from "@/lib/db/user-scope";
import { db } from "@/lib/db";
import { swipeActions } from "@/lib/db/schema";
import { updateTasteProfileFromSwipe } from "@/lib/taste-profile";

const bodySchema = z.object({
  movie: z.object({
    tmdbId: z.number(),
    genres: z.array(z.string()),
    director: z.string().optional(),
    cast: z.array(z.object({ name: z.string() })),
    year: z.number(),
    runtime: z.number().nullable(),
  }),
});

export const POST = withUser(async (request: Request) => {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid undo payload" }, { status: 400 });
    }

    const { movie } = parsed.data;

    const removed = await db
      .delete(swipeActions)
      .where(
        and(
          forUser(swipeActions),
          eq(swipeActions.tmdbId, movie.tmdbId),
          eq(swipeActions.action, "pass"),
        ),
      )
      .returning({ id: swipeActions.id });

    if (removed.length === 0) {
      return NextResponse.json({ error: "Nothing to undo" }, { status: 404 });
    }

    await updateTasteProfileFromSwipe(
      {
        genres: movie.genres,
        director: movie.director,
        cast: movie.cast.map((c) => c.name),
        year: movie.year,
        runtime: movie.runtime,
      },
      "revert_pass",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Undo failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
