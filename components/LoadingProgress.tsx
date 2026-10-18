"use client";

import { useEffect, useState } from "react";
import { MinimalLoader } from "./MinimalLoader";
import { useTheme } from "./ThemeProvider";

interface LoadingProgressProps {
  active: boolean;
  label: string;
  /** Smaller inline variant for overlays */
  compact?: boolean;
}

export function LoadingProgress({ active, label, compact = false }: LoadingProgressProps) {
  const { isMinimal, hydrated } = useTheme();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }

    setDisplay(8);
    const interval = window.setInterval(() => {
      setDisplay((value) => {
        if (value >= 92) return value;
        const step = value < 40 ? 7 : value < 70 ? 4 : 2;
        return Math.min(92, value + step);
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [active]);

  if (hydrated && isMinimal) {
    return (
      <div className="flex w-full max-w-sm justify-center px-4">
        <MinimalLoader
          label={label}
          compact={compact}
          progress={active ? display : 0}
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex w-full max-w-xs flex-col items-center gap-2">
        <p className="text-sm text-muted">{label}</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-[width] duration-200 ease-out"
            style={{ width: `${display}%` }}
          />
        </div>
        <p className="text-xs font-medium tabular-nums text-subtle">{display}%</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 px-4">
      <p className="text-center text-base text-muted">{label}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 transition-[width] duration-200 ease-out"
          style={{ width: `${display}%` }}
        />
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{display}%</p>
    </div>
  );
}
