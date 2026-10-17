import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { TimeoutError, withTimeout } from "@/lib/fetch-timeout";
import { getRecommendations } from "@/lib/recommender";
import { ORIGIN_LANGUAGES } from "@/lib/languages";

const RECOMMENDATIONS_TIMEOUT_MS = 50_000;

const ALLOWED_LANG = new Set(ORIGIN_LANGUAGES.map((l) => l.code));

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const GET = withUser(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const genres = [
      ...parseListParam(searchParams.get("genres")),
      ...(searchParams.get("genre") ? [searchParams.get("genre")!] : []),
    ]
      .map((g) => g.slice(0, 64))
      .filter(Boolean);
    const languages = parseListParam(searchParams.get("languages"))
      .map((l) => l.toLowerCase())
      .filter((l) => ALLOWED_LANG.has(l));
    const countries = parseListParam(searchParams.get("countries"))
      .map((c) => c.toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c));
    const castId = searchParams.get("castId");
    const castName = searchParams.get("castName") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "20");
    const page = Number(searchParams.get("page") ?? "1");

    const result = await withTimeout(
      getRecommendations({
        limit: Number.isFinite(limit) ? Math.min(limit, 40) : 20,
        page: Number.isFinite(page) && page > 0 ? page : 1,
        genres: [...new Set(genres)],
        languages: [...new Set(languages)],
        countries: [...new Set(countries)],
        castId: castId ? Number(castId) : undefined,
        castName: castName?.slice(0, 120),
      }),
      RECOMMENDATIONS_TIMEOUT_MS,
      "Recommendations took too long. Check your TMDB key in Settings or try again.",
    );

    return NextResponse.json({
      movies: result.movies,
      page: Number.isFinite(page) ? page : 1,
      nextPage: result.nextPage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load recommendations";
    const status = error instanceof TimeoutError ? 504 : 400;
    return NextResponse.json({ error: message }, { status });
  }
});
