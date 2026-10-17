import { posterUrl } from "./images";
import type { GlobeMovie } from "./globe-types";

function raisePin(pin: HTMLElement): void {
  pin.classList.add("globe-movie-pin--raised");
  let el: HTMLElement | null = pin;
  for (let depth = 0; depth < 3 && el; depth++) {
    el.style.zIndex = "10000";
    el = el.parentElement;
  }
}

function lowerPin(pin: HTMLElement): void {
  pin.classList.remove("globe-movie-pin--raised");
  let el: HTMLElement | null = pin;
  for (let depth = 0; depth < 3 && el; depth++) {
    el.style.zIndex = "";
    el = el.parentElement;
  }
}

function showPosterFallback(body: HTMLElement): void {
  const img = body.querySelector(".globe-movie-pin__poster");
  img?.remove();
  if (body.querySelector(".globe-movie-pin__fallback")) return;
  const fallback = document.createElement("div");
  fallback.className = "globe-movie-pin__fallback";
  fallback.setAttribute("aria-hidden", "true");
  fallback.innerHTML =
    '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>';
  body.prepend(fallback);
}

/** Map pin: small dot by default; poster block on hover/focus. */
export function createMoviePinElement(
  movie: GlobeMovie,
  onClick: () => void,
): HTMLDivElement {
  const pin = document.createElement("div");
  pin.className = "globe-movie-pin";
  pin.setAttribute("role", "button");
  pin.setAttribute("tabindex", "0");
  pin.setAttribute("aria-label", `${movie.title}${movie.year ? ` (${movie.year})` : ""}`);

  const dot = document.createElement("div");
  dot.className = "globe-movie-pin__dot";
  dot.setAttribute("aria-hidden", "true");

  const card = document.createElement("div");
  card.className = "globe-movie-pin__card";
  card.setAttribute("aria-hidden", "true");

  const body = document.createElement("div");
  body.className = "globe-movie-pin__body";

  const thumbUrl = posterUrl(movie.posterPath, "w342");
  const img = document.createElement("img");
  img.className = "globe-movie-pin__poster";
  img.alt = "";
  img.decoding = "async";
  img.addEventListener("error", () => showPosterFallback(body));
  body.appendChild(img);

  const meta = document.createElement("div");
  meta.className = "globe-movie-pin__meta";

  const title = document.createElement("div");
  title.className = "globe-movie-pin__title";
  title.textContent = movie.title;

  meta.appendChild(title);

  if (movie.year) {
    const year = document.createElement("div");
    year.className = "globe-movie-pin__year";
    year.textContent = String(movie.year);
    meta.appendChild(year);
  }

  body.appendChild(meta);
  card.appendChild(body);
  pin.append(dot, card);

  let posterLoaded = false;
  const loadPoster = () => {
    if (posterLoaded) return;
    posterLoaded = true;
    if (thumbUrl) {
      img.src = thumbUrl;
    } else {
      showPosterFallback(body);
    }
  };

  const activate = (event: Event) => {
    event.stopPropagation();
    onClick();
  };

  pin.addEventListener("click", activate);
  pin.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  });

  pin.addEventListener("mouseenter", () => {
    raisePin(pin);
    loadPoster();
  });
  pin.addEventListener("mouseleave", () => {
    lowerPin(pin);
  });
  pin.addEventListener("focus", () => {
    raisePin(pin);
    loadPoster();
  });
  pin.addEventListener("blur", () => {
    lowerPin(pin);
  });

  return pin;
}
