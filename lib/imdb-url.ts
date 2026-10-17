export function imdbTitleUrl(imdbId: string | null | undefined): string | null {
  if (!imdbId) return null;
  return `https://www.imdb.com/title/${imdbId}/`;
}
