"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SwipeDeck } from "@/components/SwipeDeck";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const castId = searchParams.get("castId");
  const castName = searchParams.get("castName");

  const initialCast =
    castId && castName
      ? { id: Number(castId), name: castName }
      : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgb(251 113 133 / 0.08), transparent 50%)",
        }}
      />
      <SwipeDeck
        initialGenre={searchParams.get("genre") ?? undefined}
        initialCast={Number.isFinite(initialCast?.id) ? initialCast : null}
      />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-white/50">
          Loading…
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
