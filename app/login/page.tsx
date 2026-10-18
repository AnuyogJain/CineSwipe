"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
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
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">
          <span className="text-[var(--cinema-gold)]">Cine</span>Swipe
        </h1>
        <p className="mt-2 text-sm text-muted">Sign in to your library</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="space-y-2">
          <label className="text-xs text-subtle" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none ring-rose-400/30 focus:ring-2"
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
            className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none ring-rose-400/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-rose-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-rose-300 underline">
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
