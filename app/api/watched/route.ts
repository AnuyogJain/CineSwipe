import { NextResponse } from "next/server";
import { z } from "zod";
import { getWatchedMovies, markMovieAsWatched } from "@/lib/recommender";

const markWatchedSchema = z.object({
  tmdbId: z.number().int().positive(),
});

export async function GET(request: Request) {
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

    const result = await getWatchedMovies({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) ? limit : 24,
      genres,
      languages,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load watched movies";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
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
}
