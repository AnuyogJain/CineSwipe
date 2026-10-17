import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { getDemoApiKeysFromEnv } from "@/lib/demo-api-keys";
import { setApiKeys } from "@/lib/settings";

export const POST = withUser(async () => {
  const demo = getDemoApiKeysFromEnv();
  if (!demo) {
    return NextResponse.json(
      {
        error:
          "Temporary keys are not configured on this server. Add CINESWIPE_DEMO_TMDB_API_KEY and CINESWIPE_DEMO_OMDB_API_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  await setApiKeys({
    tmdbApiKey: demo.tmdbApiKey!,
    omdbApiKey: demo.omdbApiKey!,
  });

  return NextResponse.json({ ok: true });
});
