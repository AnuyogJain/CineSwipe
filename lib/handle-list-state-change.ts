import type { MovieListState } from "@/lib/movie-list-state";

/** When viewing a tabbed list, drop the title from the grid if it moved elsewhere. */
export function movieLeftListTab(
  tabState: MovieListState | null | undefined,
  nextState: MovieListState,
): boolean {
  return tabState != null && nextState !== tabState;
}
