import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

const MAX_QUERY_LEN = 120;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }
    if (query.length > MAX_QUERY_LEN) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 });
    }

    const results = await searchMovies(query);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
