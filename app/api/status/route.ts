import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import { getImportedCount } from "@/lib/recommender";
import { getTasteProfile } from "@/lib/taste-profile";
import { hasRequiredKeys } from "@/lib/settings";

export const GET = withUser(async () => {
  const [importedCount, profile, keysReady] = await Promise.all([
    getImportedCount(),
    getTasteProfile(),
    hasRequiredKeys(),
  ]);

  return NextResponse.json({
    importedCount,
    hasProfile: Boolean(profile),
    keysReady,
    topGenres: profile
      ? Object.entries(profile.genres)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name]) => name)
      : [],
  });
});
