import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser } from "@/lib/api/run-with-user";
import {
  getWatchedMovies,
  markMovieAsWatched,
  removeFromWatched,
} from "@/lib/recommender";

const markWatchedSchema = z.object({
  tmdbId: z.number().int().positive(),
});

export const GET = withUser(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "24");
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) ?? [];
    const languages =
      searchParams
        .get("languages")
        ?.split(",")
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean) ?? [];
    const countries =
      searchParams
        .get("countries")
        ?.split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean) ?? [];

    const result = await getWatchedMovies({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) ? limit : 24,
      genres,
      languages,
      countries,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load watched movies";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

export const POST = withUser(async (request: Request) => {
  try {
    const json = await request.json();
    const parsed = markWatchedSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await markMovieAsWatched(parsed.data.tmdbId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark as watched";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

export const DELETE = withUser(async (request: Request) => {
  try {
    const json = await request.json();
    const parsed = markWatchedSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ok = await removeFromWatched(parsed.data.tmdbId);
    if (!ok) {
      return NextResponse.json(
        { error: "Movie not found in watched library" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove from watched";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
