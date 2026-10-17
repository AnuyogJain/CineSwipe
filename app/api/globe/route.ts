import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { TimeoutError, withTimeout } from "@/lib/fetch-timeout";
import { buildGlobeDataset, parseGlobeSource } from "@/lib/globe-data";

const GLOBE_TIMEOUT_MS = 50_000;

export const GET = withUser(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const source = parseGlobeSource(searchParams.get("source"));
    const data = await withTimeout(
      buildGlobeDataset(source),
      GLOBE_TIMEOUT_MS,
      "Globe data took too long. Check your TMDB key in Settings or try again.",
    );
    return NextResponse.json({ ...data, source });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load globe data";
    const status = error instanceof TimeoutError ? 504 : 400;
    return NextResponse.json({ error: message }, { status });
  }
});
