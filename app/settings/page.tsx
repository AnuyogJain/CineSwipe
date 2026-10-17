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
    demoKeysAvailable?: boolean;
  } | null>(null);
  const [appStatus, setAppStatus] = useState<{
    importedCount: number;
    hasProfile: boolean;
    keysReady: boolean;
    topGenres: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  useEffect(() => {
    document.querySelector("main")?.scrollTo(0, 0);
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
    fetch("/api/status")
      .then((r) => r.json())
      .then(setAppStatus)
      .catch(() => null);
  }, []);

  const exportBackup = () => {
    window.location.href = "/api/backup/export";
  };

  const importBackup = async (file: File) => {
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/backup/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setBackupMessage("Library restored from backup.");
      const stat = await fetch("/api/status").then((r) => r.json());
      setAppStatus(stat);
    } catch (err) {
      setBackupMessage(
        err instanceof Error ? err.message : "Could not import backup",
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const uploadServerBackup = async () => {
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const res = await fetch("/api/backup/upload", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setBackupMessage("Backup saved on server.");
    } catch (err) {
      setBackupMessage(
        err instanceof Error ? err.message : "Server backup failed",
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const downloadServerBackup = async () => {
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const res = await fetch("/api/backup/download");
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cineswipe-backup-server.csv";
      link.click();
      URL.revokeObjectURL(url);
      setBackupMessage("Server backup downloaded.");
    } catch (err) {
      setBackupMessage(
        err instanceof Error ? err.message : "Could not download backup",
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const useTemporaryKeys = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Temporary keys unavailable");
      }
      setMessage("Temporary demo keys saved to your account.");
      const updated = await fetch("/api/settings").then((r) => r.json());
      setStatus(updated);
      const stat = await fetch("/api/status").then((r) => r.json());
      setAppStatus(stat);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not apply temporary keys.",
      );
    } finally {
      setSaving(false);
    }
  };

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
      setMessage("API keys saved to your account.");
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 pb-8">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-1 text-sm text-muted">
          Your library and API keys are private to your account.
        </p>
      </div>

      <section className="app-panel space-y-4 rounded-2xl p-4">
        <h3 className="font-semibold">API Keys</h3>
        {appStatus && !appStatus.keysReady ? (
          <p className="text-sm text-amber-200/90">
            Add both keys below to use Discover, search, and the globe.
          </p>
        ) : null}

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

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={saveKeys}
            disabled={saving || (!tmdbApiKey.trim() && !omdbApiKey.trim())}
            className="w-full rounded-xl app-btn-secondary py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save API Keys"}
          </button>
          {status?.demoKeysAvailable ? (
            <button
              type="button"
              onClick={() => void useTemporaryKeys()}
              disabled={saving}
              className="w-full rounded-xl border border-amber-400/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-100 disabled:opacity-40"
            >
              Use temporary keys
            </button>
          ) : null}
        </div>

        {message ? (
          <p
            className={`text-sm ${
              message.includes("unavailable") || message.includes("Could not")
                ? "text-rose-300"
                : "text-emerald-300"
            }`}
          >
            {message}
          </p>
        ) : null}
      </section>

      <section className="app-panel space-y-3 rounded-2xl p-4">
        <h3 className="font-semibold">Backup library</h3>
        <p className="text-sm text-muted">
          Export a CineSwipe CSV (likes, passes, wishlist, ratings, taste). Import
          replaces your current library on this account.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={backupBusy}
            onClick={exportBackup}
            className="w-full rounded-xl app-btn-secondary py-2.5 text-sm font-medium disabled:opacity-40"
          >
            Export CSV
          </button>
          <label className="w-full cursor-pointer rounded-xl border border-white/10 py-2.5 text-center text-sm font-medium transition hover:bg-white/5">
            Import CSV (replace)
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={backupBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importBackup(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            disabled={backupBusy}
            onClick={() => void uploadServerBackup()}
            className="w-full rounded-xl bg-rose-500/20 py-2.5 text-sm font-medium text-rose-100 ring-1 ring-rose-400/30 disabled:opacity-40"
          >
            Backup to server
          </button>
          <button
            type="button"
            disabled={backupBusy}
            onClick={downloadServerBackup}
            className="w-full rounded-xl app-btn-secondary py-2.5 text-sm font-medium disabled:opacity-40"
          >
            Download server backup
          </button>
        </div>
        {backupMessage ? (
          <p className="text-sm text-emerald-300">{backupMessage}</p>
        ) : null}
      </section>

      <section className="app-panel space-y-3 rounded-2xl p-4">
        <h3 className="font-semibold">Import ratings (optional)</h3>
        <p className="text-sm text-muted">
          IMDb CSV import still boosts recommendations — not required to start swiping.
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

    </div>
  );
}
