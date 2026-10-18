"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp, User, iconHeaderClass } from "@/components/icons";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.displayName) setDisplayName(data.user.displayName);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="header-icon-btn glass-panel h-10 gap-1 px-3 py-0 hover:bg-[var(--surface-hover)]"
      >
        <User className={iconHeaderClass} strokeWidth={2} aria-hidden />
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={listId}
          role="menu"
          className="glass-panel absolute right-0 top-full z-[60] mt-1 min-w-[11rem] overflow-hidden rounded-xl py-1"
        >
          <p className="truncate px-3 py-2 text-xs font-medium text-foreground">
            {displayName ?? "Account"}
          </p>
          <Link
            href="/settings"
            role="menuitem"
            className="block px-3 py-2 text-sm text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
            onClick={() => void logout()}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
