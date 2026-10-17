import { NextResponse } from "next/server";
import {
  getListMovies,
  promoteToWishlist,
  removeFromLiked,
} from "@/lib/recommender";

export async function GET() {
  try {
    const movies = await getListMovies("like");
    return NextResponse.json({ movies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load liked movies";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { tmdbId } = (await request.json()) as { tmdbId?: number };
    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }
    const ok = await removeFromLiked(tmdbId);
    if (!ok) {
      return NextResponse.json({ error: "Movie not found in liked list" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove from liked";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { tmdbId } = (await request.json()) as { tmdbId?: number };
    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }
    const ok = await promoteToWishlist(tmdbId);
    if (!ok) {
      return NextResponse.json({ error: "Movie not found in liked list" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to promote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
