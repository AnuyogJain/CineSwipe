"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function SettingsPage() {
  const [tmdbApiKey, setTmdbApiKey] = useState("");
  const [omdbApiKey, setOmdbApiKey] = useState("");
  const [status, setStatus] = useState<{
    tmdbConfigured: boolean;
    omdbConfigured: boolean;
    tmdbMasked: string;
    omdbMasked: string;
  } | null>(null);
  const [appStatus, setAppStatus] = useState<{
    importedCount: number;
    hasProfile: boolean;
    keysReady: boolean;
    topGenres: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [castQuery, setCastQuery] = useState("");
  const [castResults, setCastResults] = useState<
    Array<{ id: number; name: string; profilePath: string | null }>
  >([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
    fetch("/api/status")
      .then((r) => r.json())
      .then(setAppStatus)
      .catch(() => null);
  }, []);

  const saveKeys = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, string> = {};
      if (tmdbApiKey.trim()) payload.tmdbApiKey = tmdbApiKey.trim();
      if (omdbApiKey.trim()) payload.omdbApiKey = omdbApiKey.trim();

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save keys");

      setTmdbApiKey("");
      setOmdbApiKey("");
      setMessage("API keys saved securely on this device.");
      const updated = await fetch("/api/settings").then((r) => r.json());
      setStatus(updated);
      const stat = await fetch("/api/status").then((r) => r.json());
      setAppStatus(stat);
    } catch {
      setMessage("Could not save keys. Try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (castQuery.length < 2) {
      setCastResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search/cast?q=${encodeURIComponent(castQuery)}`)
        .then((r) => r.json())
        .then((d) => setCastResults(d.results ?? []))
        .catch(() => setCastResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [castQuery]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 pb-8">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-1 text-sm text-muted">
          Add your free API keys here — stored locally, never sent to the browser bundle.
        </p>
      </div>

      <section className="app-panel space-y-3 rounded-2xl p-4">
        <h3 className="font-semibold">Import ratings</h3>
        <p className="text-sm text-muted">
          Upload your IMDb ratings export (CSV) to build your taste profile and unlock
          recommendations.
        </p>
        <Link
          href="/import"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl app-btn-secondary py-2.5 text-sm font-medium"
        >
          <span aria-hidden>📥</span>
          Import IMDb CSV
        </Link>
      </section>

      <section className="app-panel space-y-4 rounded-2xl p-4">
        <ThemeSwitcher />
      </section>

      {appStatus ? (
        <div className="app-panel rounded-2xl p-4 text-sm text-muted">
          <p>{appStatus.importedCount} ratings imported</p>
          <p>Taste profile: {appStatus.hasProfile ? "Ready" : "Not built yet"}</p>
          <p>API keys: {appStatus.keysReady ? "Configured" : "Missing"}</p>
          {appStatus.topGenres.length > 0 ? (
            <p className="mt-2">Your top genres: {appStatus.topGenres.join(", ")}</p>
          ) : null}
        </div>
      ) : null}

      <section className="app-panel space-y-4 rounded-2xl p-4">
        <h3 className="font-semibold">API Keys</h3>

        <div className="space-y-2">
          <label className="text-xs text-subtle" htmlFor="tmdb">
            TMDB API Key{" "}
            {status?.tmdbConfigured ? `(saved ${status.tmdbMasked})` : "(not set)"}
          </label>
          <input
            id="tmdb"
            type="password"
            value={tmdbApiKey}
            onChange={(e) => setTmdbApiKey(e.target.value)}
            placeholder="Paste TMDB v3 API key"
            className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none ring-rose-400/30 focus:ring-2"
          />
          <p className="text-xs text-subtle">
            Get free key at{" "}
            <a
              className="text-rose-300 underline"
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noreferrer"
            >
              themoviedb.org
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-subtle" htmlFor="omdb">
            OMDb API Key{" "}
            {status?.omdbConfigured ? `(saved ${status.omdbMasked})` : "(not set)"}
          </label>
          <input
            id="omdb"
            type="password"
            value={omdbApiKey}
            onChange={(e) => setOmdbApiKey(e.target.value)}
            placeholder="Paste OMDb API key"
            className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none ring-rose-400/30 focus:ring-2"
          />
          <p className="text-xs text-subtle">
            Get free key at{" "}
            <a
              className="text-rose-300 underline"
              href="https://www.omdbapi.com/apikey.aspx"
              target="_blank"
              rel="noreferrer"
            >
              omdbapi.com
            </a>
          </p>
        </div>

        <button
          type="button"
          onClick={saveKeys}
          disabled={saving || (!tmdbApiKey.trim() && !omdbApiKey.trim())}
          className="w-full rounded-xl app-btn-secondary py-2.5 text-sm font-medium disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save API Keys"}
        </button>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </section>

      <section className="app-panel space-y-3 rounded-2xl p-4">
        <h3 className="font-semibold">Explore by cast</h3>
        <input
          type="search"
          value={castQuery}
          onChange={(e) => setCastQuery(e.target.value)}
          placeholder="Search actor name…"
          className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400/30"
        />
        <ul className="space-y-1">
          {castResults.map((person) => (
            <li key={person.id}>
              <Link
                href={`/?castId=${person.id}&castName=${encodeURIComponent(person.name)}`}
                className="block rounded-lg px-2 py-2 text-sm hover:bg-white/5"
              >
                {person.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
