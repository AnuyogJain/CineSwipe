"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { sanitizeRelativeNext } from "@/lib/safe-next-path";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = sanitizeRelativeNext(searchParams.get("next"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      // Full navigation so session cookie + ?tmdbId= deep links apply reliably
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="text-center">
        <h1 className="auth-title font-display text-2xl font-bold text-foreground">
          <span className="auth-title-accent">Cine</span>Swipe
        </h1>
        <p className="mt-2 text-sm text-muted">Sign in to your library</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error ? <p className="auth-error text-sm">{error}</p> : null}
        <div className="space-y-2">
          <label className="text-xs text-subtle" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="app-input auth-field w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-subtle" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="app-input auth-field w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="auth-submit w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="auth-link font-medium underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
