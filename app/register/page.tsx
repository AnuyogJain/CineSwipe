"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setFormError(null);

    if (password.length < 8) {
      setPasswordError("At least 8 characters");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error ?? "Registration failed";
        if (message === "At least 8 characters") {
          setPasswordError(message);
        } else {
          setFormError(message);
        }
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Registration failed",
      );
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
        <p className="mt-2 text-sm text-muted">Create your account</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {formError ? (
          <p className="text-sm text-rose-300">{formError}</p>
        ) : null}
        <div className="space-y-2">
          <label className="text-xs text-subtle" htmlFor="displayName">
            Name
          </label>
          <input
            id="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none ring-rose-400/30 focus:ring-2"
          />
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
            className="app-input w-full rounded-xl border px-3 py-2 text-sm outline-none ring-rose-400/30 focus:ring-2"
          />
          {passwordError ? (
            <p className="text-xs text-rose-300">{passwordError}</p>
          ) : (
            <p className="text-[10px] text-subtle">At least 8 characters</p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-rose-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-rose-300 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
