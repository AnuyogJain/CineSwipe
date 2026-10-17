import type { GlobeSource } from "@/lib/globe-types";
import type { ListFilters } from "@/lib/list-filters";
import { GlobeNavLink } from "./GlobeNavLink";
import { ListFilterMenu } from "./ListFilterMenu";

interface ListPageActionsProps {
  globeSource: GlobeSource;
  filters: ListFilters;
  onFiltersChange: (next: ListFilters) => void;
}

export function ListPageActions({
  globeSource,
  filters,
  onFiltersChange,
}: ListPageActionsProps) {
  return (
    <div className="flex shrink-0 items-start gap-2">
      <ListFilterMenu filters={filters} onChange={onFiltersChange} />
      <GlobeNavLink source={globeSource} />
    </div>
  );
}
