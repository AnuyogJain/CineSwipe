import type { ReactNode } from "react";

interface MovieMetaPillProps {
  children: ReactNode;
  variant?: "default" | "gold";
  className?: string;
}

export function MovieMetaPill({
  children,
  variant = "default",
  className = "",
}: MovieMetaPillProps) {
  return (
    <span
      className={`movie-pill ${variant === "gold" ? "movie-pill--gold" : ""} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
