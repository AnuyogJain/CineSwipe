"use client";

import Image from "next/image";

interface PosterCardProps {
  title: string;
  imageSrc: string | null;
  onClick?: () => void;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function PosterCard({
  title,
  imageSrc,
  onClick,
  className = "",
  sizes = "132px",
  priority = false,
}: PosterCardProps) {
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`poster-card group w-[29vw] max-w-[132px] shrink-0 snap-start text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cinema-gold)] disabled:cursor-default ${className}`}
    >
      <div className="relative aspect-[2/3] w-full">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes={sizes}
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800 text-xs text-white/30">
            No poster
          </div>
        )}
        <div className="poster-card__scrim" />
        <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-semibold text-white">
          {title}
        </p>
      </div>
    </button>
  );
}
