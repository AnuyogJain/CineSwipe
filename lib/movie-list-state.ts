export type MovieListState = "none" | "liked" | "wishlist" | "watched";

export const MOVIE_LIST_STATE_OPTIONS: Array<{
  value: MovieListState;
  label: string;
}> = [
  { value: "none", label: "Add to List" },
  { value: "liked", label: "Liked" },
  { value: "wishlist", label: "Watchlist" },
  { value: "watched", label: "Watched" },
];

export function resolveMovieListState(flags: {
  inLiked: boolean;
  inWishlist: boolean;
  inWatched: boolean;
}): MovieListState {
  if (flags.inWatched) return "watched";
  if (flags.inWishlist) return "wishlist";
  if (flags.inLiked) return "liked";
  return "none";
}
