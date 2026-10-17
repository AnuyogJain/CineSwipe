import { NextResponse } from "next/server";
import { isMovieInWatchedLibrary } from "@/lib/recommender";
import { getEnrichedMovie } from "@/lib/tmdb";
import { getImdbRatingForMovie } from "@/lib/omdb";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { importedRatings } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tmdbId: string }> },
) {
  try {
    const { tmdbId: tmdbIdParam } = await context.params;
    const tmdbId = Number(tmdbIdParam);
    if (!Number.isFinite(tmdbId)) {
      return NextResponse.json({ error: "Invalid TMDB id" }, { status: 400 });
    }

    const movie = await getEnrichedMovie(tmdbId);
    const imdb = await getImdbRatingForMovie(tmdbId, movie.imdbId);

    let yourRating: number | null = null;
    if (movie.imdbId) {
      const imported = await db
        .select()
        .from(importedRatings)
        .where(eq(importedRatings.imdbId, movie.imdbId))
        .limit(1);
      yourRating = imported[0]?.yourRating ?? null;
    }

    const inWatchedLibrary = await isMovieInWatchedLibrary(
      tmdbId,
      movie.imdbId,
    );

    return NextResponse.json({
      ...movie,
      imdbRating: imdb.imdbRating,
      imdbVotes: imdb.imdbVotes,
      yourRating,
      inWatchedLibrary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load movie";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
