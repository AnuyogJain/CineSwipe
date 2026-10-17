import { NextResponse } from "next/server";
import { z } from "zod";
import { setMovieListState } from "@/lib/recommender";
import type { MovieCandidate } from "@/lib/types";
import type { MovieListState } from "@/lib/movie-list-state";

const bodySchema = z.object({
  tmdbId: z.number().int().positive(),
  state: z.enum(["none", "liked", "wishlist", "watched"]),
  fullPayload: z.custom<MovieCandidate>().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await setMovieListState(
      parsed.data.tmdbId,
      parsed.data.state as MovieListState,
      parsed.data.fullPayload,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, state: result.state });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update list state";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
