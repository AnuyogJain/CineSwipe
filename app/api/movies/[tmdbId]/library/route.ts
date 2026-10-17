import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { isMovieInWatchedLibrary } from "@/lib/recommender";

/** Lightweight watched-library check for the swipe deck (no TMDB/OMDb). */
export const GET = withUser(
  async (
    request: Request,
    context: { params: Promise<{ tmdbId: string }> },
  ) => {
    const { tmdbId: tmdbIdParam } = await context.params;
    const tmdbId = Number(tmdbIdParam);
    if (!Number.isFinite(tmdbId)) {
      return NextResponse.json({ error: "Invalid TMDB id" }, { status: 400 });
    }

    const imdbId = new URL(request.url).searchParams.get("imdbId");

    const inWatchedLibrary = await isMovieInWatchedLibrary(
      tmdbId,
      imdbId || null,
    );

    return NextResponse.json({ inWatchedLibrary });
  },
);
