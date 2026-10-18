"use client";

import { SingleSelectDropdown } from "@/components/SingleSelectDropdown";
import {
  MOVIE_LIST_STATE_OPTIONS,
  type MovieListState,
} from "@/lib/movie-list-state";

interface MovieListStateSelectProps {
  value: MovieListState;
  disabled?: boolean;
  busy?: boolean;
  onChange: (next: MovieListState) => void;
}

export function MovieListStateSelect({
  value,
  disabled,
  busy,
  onChange,
}: MovieListStateSelectProps) {
  return (
    <SingleSelectDropdown
      label=""
      compact
      menuPlacement="up"
      options={MOVIE_LIST_STATE_OPTIONS}
      value={value}
      disabled={disabled}
      busy={busy}
      onChange={onChange}
    />
  );
}
