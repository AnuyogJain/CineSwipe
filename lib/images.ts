const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size = "w780"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

const CAROUSEL_MAX = 3;

/** Skip first/last TMDB images (often poor fit) and cap the tap gallery at 3. */
export function movieCarouselImages(urls: string[]): string[] {
  if (urls.length <= 1) return urls;
  const middle = urls.slice(1, -1).slice(0, CAROUSEL_MAX);
  if (middle.length > 0) return middle;
  return urls.slice(1, 2).length > 0 ? urls.slice(1, 2) : urls.slice(0, 1);
}
