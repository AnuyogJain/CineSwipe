export async function markMovieWatched(
  tmdbId: number,
): Promise<{ ok: boolean; alreadyWatched: boolean; error?: string }> {
  try {
    const res = await fetch("/api/watched", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      alreadyWatched?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        alreadyWatched: false,
        error: data.error ?? "Failed to mark as watched",
      };
    }
    return { ok: true, alreadyWatched: Boolean(data.alreadyWatched) };
  } catch {
    return {
      ok: false,
      alreadyWatched: false,
      error: "Failed to mark as watched",
    };
  }
}
