import Link from "next/link";
import type { GlobeSource } from "@/lib/globe-types";
import { Globe, iconHeaderClass } from "@/components/icons";

interface GlobeNavLinkProps {
  source: GlobeSource;
}

export function GlobeNavLink({ source }: GlobeNavLinkProps) {
  return (
    <Link
      href={`/globe?source=${source}`}
      className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-surface px-3 py-2 transition hover:bg-white/10"
      aria-label="View on globe"
      title="Globe"
    >
      <Globe className={iconHeaderClass} strokeWidth={2} aria-hidden />
    </Link>
  );
}
