"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { ExternalLink, Film, X, iconHeaderClass } from "@/components/icons";
interface CinedleAboutDialogProps {
  open: boolean;
  onClose: () => void;
  appUrl: string | null;
}

export function CinedleAboutDialog({
  open,
  onClose,
  appUrl,
}: CinedleAboutDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="search-dialog-scrim fixed inset-0 z-[60] bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cinedle-about-title"
            className="glass-panel cinedle-about-dialog fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="cinedle-about-dialog__icon">
                  <Film
                    className={iconHeaderClass}
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                    Word game
                  </p>
                  <h2
                    id="cinedle-about-title"
                    className="mt-0.5 text-lg font-bold text-foreground"
                  >
                    Cinedle
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface p-2 text-muted transition hover:bg-[var(--surface-hover)]"
              >
                <X className={iconHeaderClass} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Wordle, but for films. Letter colors tell you what&apos;s in the
              title and where.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>• One fresh puzzle every day</li>
              <li>• Unlimited mode with genre and country filters</li>
              <li>• No login required</li>
            </ul>

            {appUrl ? (
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="home-discover-hero__cta home-discover-hero__cta--primary cinedle-about-dialog__cta mt-5"
              >
                Play on Cinedle
                <ExternalLink
                  className="h-4 w-4 shrink-0 opacity-90"
                  aria-hidden
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <p className="mt-5 text-sm text-subtle">
                Set{" "}
                <code className="text-foreground">CINEDLE_APP_URL</code>{" "}
                to enable the play link.
              </p>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
