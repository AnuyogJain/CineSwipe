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
      className="toolbar-chip"
      aria-label="View on globe"
      title="Globe"
    >
      <Globe className={iconHeaderClass} strokeWidth={2} aria-hidden />
    </Link>
  );
}
