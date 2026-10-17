import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { normalizeGenreName } from "@/lib/genres";
import { getGenreMap } from "@/lib/tmdb";

export const GET = withUser(async () => {
  try {
    const map = await getGenreMap();
    const genres = Object.entries(map)
      .map(([name, id]) => ({
        name: normalizeGenreName(name),
        id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ genres });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load genres";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
