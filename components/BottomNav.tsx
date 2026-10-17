"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  Eye,
  Heart,
  Home,
  iconNavClass,
  Settings,
  Star,
} from "@/components/icons";

const links: Array<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/discover", label: "Discover", Icon: Clapperboard },
  { href: "/liked", label: "Liked", Icon: Heart },
  { href: "/wishlist", label: "Wishlist", Icon: Star },
  { href: "/watched", label: "Watched", Icon: Eye },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav z-50 shrink-0 border-t backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {links.map((link) => {
          const active =
            link.href === "/discover"
              ? pathname === "/discover"
              : pathname === link.href;
          const { Icon } = link;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`app-nav__link flex min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[9px] font-medium transition ${
                active ? "app-nav__link--active" : ""
              }`}
            >
              <Icon className={iconNavClass} strokeWidth={2} aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
