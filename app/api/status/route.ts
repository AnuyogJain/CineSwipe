import { NextResponse } from "next/server";
import { getImportedCount } from "@/lib/recommender";
import { getTasteProfile } from "@/lib/taste-profile";
import { hasRequiredKeys } from "@/lib/settings";

export async function GET() {
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
}
