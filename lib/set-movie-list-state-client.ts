import type { MovieListState } from "@/lib/movie-list-state";
import type { MovieCandidate } from "@/lib/types";

export async function setMovieListStateClient(
  tmdbId: number,
  state: MovieListState,
  fullPayload?: MovieCandidate,
): Promise<{ ok: boolean; state?: MovieListState; error?: string }> {
  try {
    const res = await fetch("/api/library/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId, state, fullPayload }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      state?: MovieListState;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Failed to update list" };
    }
    return { ok: true, state: data.state ?? state };
  } catch {
    return { ok: false, error: "Failed to update list" };
  }
}
