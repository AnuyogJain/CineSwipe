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

export async function unmarkMovieWatched(
  tmdbId: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/watched", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Failed to remove from watched" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to remove from watched" };
  }
}
