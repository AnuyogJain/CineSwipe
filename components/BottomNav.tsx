"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Discover", icon: "🎬" },
  { href: "/liked", label: "Liked", icon: "♥" },
  { href: "/wishlist", label: "Wishlist", icon: "★" },
  { href: "/watched", label: "Watched", icon: "👁" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav z-50 shrink-0 border-t backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`app-nav__link flex min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[9px] font-medium transition ${
                active ? "app-nav__link--active" : ""
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
