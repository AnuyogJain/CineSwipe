"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    topGenres: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
      <div>
        <h2 className="text-2xl font-bold">Import IMDb Ratings</h2>
        <p className="mt-2 text-sm text-white/60">
          Export your rated titles from IMDb as CSV, then upload here. We&apos;ll
          learn your taste from genres, directors, and your star ratings.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center transition hover:bg-white/[0.07]">
        <span className="text-3xl">📄</span>
        <span className="text-sm font-medium text-white/80">
          {file ? file.name : "Tap to choose CSV file"}
        </span>
        <span className="text-xs text-white/40">IMDb list export format</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <button
        type="button"
        disabled={!file || loading}
        onClick={handleImport}
        className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3 font-semibold text-white disabled:opacity-40"
      >
        {loading ? "Importing…" : "Import & Build Taste Profile"}
      </button>

      {error ? (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/20">
          <p className="font-semibold text-emerald-200">
            {result.imported} ratings loaded — taste profile ready!
          </p>
          {result.topGenres.length > 0 ? (
            <p className="text-sm text-white/70">
              Top genres: {result.topGenres.join(", ")}
            </p>
          ) : null}
          <Link
            href="/discover"
            className="inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Start swiping →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
