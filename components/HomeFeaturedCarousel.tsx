"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { backdropUrl, posterUrl } from "@/lib/images";
import type { MovieCandidate } from "@/lib/types";
import { MovieMetaPill } from "./ui/MovieMetaPill";
import { GlassButton } from "./ui/GlassButton";
import { ChevronRight, Clapperboard, Globe } from "@/components/icons";

const MAX_SLIDES = 8;

function featuredImage(movie: MovieCandidate): string | null {
  const backdrop = backdropUrl(movie.backdropPath, "w780");
  if (backdrop) return backdrop;
  const poster = posterUrl(movie.posterPath, "w780");
  if (poster) return poster;
  const first = movie.images[0];
  return first?.startsWith("http") ? first : null;
}

function buildFeaturedList(
  wishlist: MovieCandidate[],
  liked: MovieCandidate[],
  watched: MovieCandidate[]
): MovieCandidate[] {
  const seen = new Set<number>();
  const out: MovieCandidate[] = [];
  for (const movie of [...wishlist, ...liked, ...watched]) {
    if (seen.has(movie.tmdbId)) continue;
    seen.add(movie.tmdbId);
    out.push(movie);
    if (out.length >= MAX_SLIDES) break;
  }
  return out;
}

interface HomeFeaturedCarouselProps {
  wishlist: MovieCandidate[];
  liked: MovieCandidate[];
  watched: MovieCandidate[];
  keysReady: boolean;
  hasProfile: boolean;
  topGenres: string[];
  onSelectMovie: (movie: MovieCandidate) => void;
}

export function HomeFeaturedCarousel({
  wishlist,
  liked,
  watched,
  keysReady,
  hasProfile,
  topGenres,
  onSelectMovie,
}: HomeFeaturedCarouselProps) {
  const slides = buildFeaturedList(wishlist, liked, watched);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1 });
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  let discoverHref = "/discover";
  let discoverLabel = "Start swiping";
  let subtitle =
    "Swipe taste-matched picks, then explore your library on the world map.";

  if (!keysReady) {
    discoverHref = "/settings";
    discoverLabel = "Add API keys";
    subtitle = "Add TMDB and OMDb keys to unlock Discover and the globe map.";
  } else if (topGenres.length > 0) {
    subtitle = `Picks tuned to ${topGenres.slice(0, 3).join(", ")} and more.`;
  } else if (hasProfile) {
    subtitle =
      "Swipe to train your taste — import IMDb CSV anytime for richer picks.";
  }

  return (
    <section className="px-4 pb-2 pt-2">
      {slides.length > 0 ? (
        <div className="glass-panel relative overflow-hidden rounded-3xl">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {slides.map((movie) => {
                const src = featuredImage(movie);
                return (
                  <button
                    key={movie.tmdbId}
                    type="button"
                    onClick={() => onSelectMovie(movie)}
                    className="relative min-w-0 flex-[0_0_100%] text-left"
                  >
                    <div className="relative aspect-[16/10] w-full sm:aspect-[2/1]">
                      {src ? (
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 512px) 100vw, 512px"
                          priority
                        />
                      ) : (
                        <div className="h-full bg-zinc-900" />
                      )}
                      <div className="absolute inset-0 hero-backdrop-scrim" />
                      <div
                        className={`absolute bottom-0 left-0 right-0 p-4 ${
                          slides.length > 1 ? "pb-9" : ""
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--cinema-gold)]">
                          Featured
                        </p>
                        <h2 className="font-display mt-1 text-2xl font-bold leading-tight text-white">
                          {movie.title}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {movie.year ? (
                            <MovieMetaPill>{movie.year}</MovieMetaPill>
                          ) : null}
                          {movie.genres[0] ? (
                            <MovieMetaPill>{movie.genres[0]}</MovieMetaPill>
                          ) : null}
                          {movie.imdbRating != null ? (
                            <MovieMetaPill variant="gold">
                              ★ {movie.imdbRating.toFixed(1)}
                            </MovieMetaPill>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {slides.length > 1 ? (
            <div
              className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5"
              aria-hidden
            >
              {slides.map((s, i) => (
                <span
                  key={s.tmdbId}
                  className={`h-1.5 rounded-full shadow-sm transition-all ${
                    i === index
                      ? "w-5 bg-[var(--cinema-gold)]"
                      : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--cinema-gold)]">
            Your cinema
          </p>
          <h2 className="font-display mt-1 text-xl font-bold text-white">
            Start building your library
          </h2>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
      )}

      <p className="mt-3 px-1 text-sm leading-relaxed text-subtle">
        {subtitle}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <GlassButton href={discoverHref} variant="gold">
          <Clapperboard className="h-4 w-4" aria-hidden />
          {discoverLabel}
          <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
        </GlassButton>
        <GlassButton href="/globe?source=viewed" variant="ghost">
          <Globe className="h-4 w-4" aria-hidden />
          Open globe
        </GlassButton>
      </div>
    </section>
  );
}
