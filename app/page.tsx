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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SwipeDeck
        initialGenre={searchParams.get("genre") ?? undefined}
        initialCast={Number.isFinite(initialCast?.id) ? initialCast : null}
      />
    </div>
  );
}

export default function HomePage() {
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
