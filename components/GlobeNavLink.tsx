import Link from "next/link";
import type { GlobeSource } from "@/lib/globe-types";

interface GlobeNavLinkProps {
  source: GlobeSource;
}

export function GlobeNavLink({ source }: GlobeNavLinkProps) {
  return (
    <Link
      href={`/globe?source=${source}`}
      className="cursor-pointer flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface px-3 py-2 text-lg transition hover:bg-white/10"
      aria-label="View on globe"
      title="Globe"
    >
      🌍
    </Link>
  );
}
