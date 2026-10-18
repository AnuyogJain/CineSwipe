import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type GlassButtonProps = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "gold";
  className?: string;
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary:
    "bg-accent text-white shadow-lg shadow-black/30 hover:brightness-110 cta-glow",
  gold: "bg-[var(--cinema-gold)] text-black font-bold hover:brightness-110 cta-glow",
  ghost:
    "border border-[var(--border)] bg-[var(--pill-bg)] text-foreground hover:bg-[var(--surface-hover)]",
};

export function GlassButton({
  children,
  variant = "primary",
  className = "",
  href,
  type = "button",
  ...props
}: GlassButtonProps) {
  const classes = `ui-btn ui-btn--${variant} inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
