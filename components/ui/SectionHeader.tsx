import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  trailing?: ReactNode;
}

export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "See all",
  trailing,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <h3 className="section-title">{title}</h3>
      {trailing ??
        (viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-accent-text transition hover:text-foreground"
          >
            {viewAllLabel}
          </Link>
        ) : null)}
    </div>
  );
}
