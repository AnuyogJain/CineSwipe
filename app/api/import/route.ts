import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { parseImdbCsv } from "@/lib/csv-parser";
import { forUser } from "@/lib/db/user-scope";
import { db } from "@/lib/db";
import { importedRatings } from "@/lib/db/schema";
import { rebuildTasteProfile, enrichCastFromTopRated } from "@/lib/taste-profile";
import { findTmdbIdByImdbId } from "@/lib/tmdb";
import { hasRequiredKeys } from "@/lib/settings";
import { requestUserId } from "@/lib/user-context";

export const POST = withUser(async (request: Request) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    const csvText = await file.text();
    const ratings = parseImdbCsv(csvText);

    await db.delete(importedRatings).where(forUser(importedRatings));

    for (const rating of ratings) {
      await db.insert(importedRatings).values({
        userId: requestUserId(),
        imdbId: rating.imdbId,
        title: rating.title,
        originalTitle: rating.originalTitle,
        yourRating: rating.yourRating,
        imdbRating: rating.imdbRating,
        imdbVotes: rating.imdbVotes,
        genres: rating.genres,
        directors: rating.directors,
        year: rating.year,
        runtime: rating.runtime,
        titleType: rating.titleType,
        dateRated: rating.dateRated,
        url: rating.url,
      });
    }

    const profile = await rebuildTasteProfile();

    if (await hasRequiredKeys()) {
      const topRows = ratings
        .sort((a, b) => (b.yourRating ?? 0) - (a.yourRating ?? 0))
        .slice(0, 20);
      for (const row of topRows) {
        try {
          const tmdbId = await findTmdbIdByImdbId(row.imdbId);
          if (tmdbId) {
            await db
              .update(importedRatings)
              .set({ tmdbId })
              .where(
                and(
                  forUser(importedRatings),
                  eq(importedRatings.imdbId, row.imdbId),
                ),
              );
          }
        } catch {
          // mapping optional during import
        }
      }
      await enrichCastFromTopRated(12);
    }

    return NextResponse.json({
      imported: ratings.length,
      topGenres: Object.entries(profile.genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
