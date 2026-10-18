"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { MovieCandidate } from "@/lib/types";
import { ActionBar, actionSideButtonClass } from "./ActionBar";
import { iconActionClass, Undo2 } from "@/components/icons";
import { MovieProfileView } from "./MovieProfileView";

interface MovieCardProps {
  movie: MovieCandidate;
  activeGenres?: string[];
  activeCastId?: number;
  onSwipe: (direction: "left" | "right") => void;
  onPass: () => void;
  onLike: () => void;
  onWishlist: () => void;
  onWatched: () => void;
  watched?: boolean;
  onGenreSelect?: (genre: string) => void;
  onCastSelect?: (cast: { id: number; name: string }) => void;
  disabled?: boolean;
  undoAvailable?: boolean;
  onUndo?: () => void;
  /** Fill parent (globe country discover) — no floating card chrome */
  fillPanel?: boolean;
}

export function MovieCard({
  movie,
  activeGenres = [],
  activeCastId,
  onSwipe,
  onPass,
  onLike,
  onWishlist,
  onWatched,
  watched = false,
  onGenreSelect,
  onCastSelect,
  disabled,
  undoAvailable = false,
  onUndo,
  fillPanel = false,
}: MovieCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-6, 6]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);
  const likeGlow = useTransform(
    likeOpacity,
    [0, 1],
    [
      "0 0 0 rgba(52,211,153,0)",
      "0 0 28px rgba(52,211,153,0.95), 0 0 56px rgba(16,185,129,0.45)",
    ],
  );
  const nopeGlow = useTransform(
    nopeOpacity,
    [0, 1],
    [
      "0 0 0 rgba(251,113,133,0)",
      "0 0 28px rgba(251,113,133,0.95), 0 0 56px rgba(244,63,94,0.45)",
    ],
  );

  useEffect(() => {
    x.set(0);
  }, [movie.tmdbId, x]);

  return (
    <div
      className={`theme-keep-dark relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 ${
        fillPanel
          ? "rounded-none shadow-none ring-0"
          : "mx-auto rounded-3xl shadow-2xl ring-1 ring-white/10"
      }`}
    >
      <div className="relative min-h-0 flex-1">
        <div className="card-scroll h-full overflow-y-auto overscroll-contain pb-24">
          <motion.div
            style={{ x, rotate, touchAction: "pan-y pinch-zoom" }}
            drag={disabled ? false : "x"}
            dragListener={true}
            dragElastic={0.82}
            dragConstraints={{ left: 0, right: 0 }}
            dragDirectionLock
            onDrag={(_, info) => x.set(info.offset.x)}
            onDragEnd={(_, info) => {
              if (disabled) return;
              if (info.offset.x > 120 || info.velocity.x > 600) {
                x.set(0);
                onSwipe("right");
              } else if (info.offset.x < -120 || info.velocity.x < -600) {
                x.set(0);
                onSwipe("left");
              } else {
                x.set(0);
              }
            }}
            className="swipe-card-profile relative select-none touch-pan-y"
          >
            <MovieProfileView
              movie={movie}
              activeGenres={activeGenres}
              activeCastId={activeCastId}
              onGenreSelect={onGenreSelect}
              onCastSelect={onCastSelect}
              compactHero={fillPanel}
            />
          </motion.div>
        </div>

        <motion.div
          aria-hidden
          style={{ x, rotate }}
          className="pointer-events-none absolute inset-0 z-40 flex items-start justify-between px-5 pt-14"
        >
          <motion.div
            style={{ opacity: likeOpacity, boxShadow: likeGlow }}
            className="swipe-stamp swipe-stamp--like rotate-[-12deg] rounded-lg border-4 border-emerald-400 bg-zinc-950/55 px-4 py-2 text-2xl font-black uppercase tracking-widest text-emerald-300 backdrop-blur-sm"
          >
            Like
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity, boxShadow: nopeGlow }}
            className="swipe-stamp swipe-stamp--nope rotate-[12deg] rounded-lg border-4 border-rose-400 bg-zinc-950/55 px-4 py-2 text-2xl font-black uppercase tracking-widest text-rose-300 backdrop-blur-sm"
          >
            Nope
          </motion.div>
        </motion.div>

        {onUndo ? (
          <div className="pointer-events-none absolute right-0 top-0 z-20 flex pr-3 pt-3">
            <button
              type="button"
              disabled={disabled || !undoAvailable}
              onClick={onUndo}
              aria-label="Undo last pass"
              title={
                undoAvailable
                  ? "Bring back last passed movie"
                  : "Undo last pass"
              }
              className={`pointer-events-auto ${actionSideButtonClass} ${
                undoAvailable
                  ? "bg-amber-500/15 text-amber-200 ring-amber-400/40 hover:bg-amber-400/10"
                  : "text-amber-300/45 ring-amber-300/20"
              }`}
            >
              <Undo2 className={iconActionClass} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3">
          <ActionBar
            className="pointer-events-auto"
            onPass={onPass}
            onLike={onLike}
            onWishlist={onWishlist}
            onWatched={onWatched}
            watched={watched}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
