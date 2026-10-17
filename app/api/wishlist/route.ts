import { NextResponse } from "next/server";
import { getListMovies, removeFromWishlist } from "@/lib/recommender";

export async function GET() {
  try {
    const movies = await getListMovies("wishlist");
    return NextResponse.json({ movies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load wishlist";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { tmdbId } = (await request.json()) as { tmdbId?: number };
    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }
    const ok = await removeFromWishlist(tmdbId);
    if (!ok) {
      return NextResponse.json({ error: "Movie not found in wishlist" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove from wishlist";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
