import { IconSearch, IconX } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { type CrossfilterFilterT, type FacetCountT, type FacetKeyT } from '@/workers/crossfilter.types';

const FACET_LABELS: Record<FacetKeyT, string> = {
  pangoLineage: 'Lineage',
  country: 'Country',
  host: 'Host',
};

const numberFormatter = new Intl.NumberFormat('en-US');

interface FacetRowProps {
  facetKey: FacetKeyT;
  values: FacetCountT[];
  selected: string[];
  onToggle: (key: FacetKeyT, value: string) => void;
}

const FacetRow = ({ facetKey, values, selected, onToggle }: FacetRowProps) => {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{FACET_LABELS[facetKey]}</span>
      {values.map(({ value, count }) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(facetKey, value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="max-w-32 truncate">{value}</span>
            <span className="text-muted-foreground tabular-nums">{numberFormatter.format(count)}</span>
          </button>
        );
      })}
    </div>
  );
};

interface SliceRefineProps {
  filter: CrossfilterFilterT;
  facets: Record<FacetKeyT, FacetCountT[]> | null;
  matched: number;
  sliceSize: number;
  isActive: boolean;
  onSearch: (value: string) => void;
  onToggle: (key: FacetKeyT, value: string) => void;
  onClear: () => void;
}

/**
 * Client-side refine bar over the downloaded slice: instant free-text search plus
 * toggleable facet chips. All matching/counting runs in the crossfilter worker.
 */
export const SliceRefine = ({
  filter,
  facets,
  matched,
  sliceSize,
  isActive,
  onSearch,
  onToggle,
  onClear,
}: SliceRefineProps) => (
  <div className="mb-3 flex flex-col gap-2.5 rounded-2xl border bg-muted/30 p-3">
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter.search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Refine this slice — accession, country, lineage…"
          aria-label="Refine samples"
          className="bg-background/60 pl-9"
        />
      </div>
      {isActive && (
        <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0 gap-1 text-muted-foreground">
          <IconX className="size-4" />
          Clear
        </Button>
      )}
    </div>

    {facets && (
      <div className="flex flex-col gap-2">
        <FacetRow
          facetKey="pangoLineage"
          values={facets.pangoLineage}
          selected={filter.facets.pangoLineage}
          onToggle={onToggle}
        />
        <FacetRow facetKey="country" values={facets.country} selected={filter.facets.country} onToggle={onToggle} />
        <FacetRow facetKey="host" values={facets.host} selected={filter.facets.host} onToggle={onToggle} />
      </div>
    )}

    <p className="text-xs text-muted-foreground">
      {isActive ? (
        <>
          <span className="font-medium text-foreground tabular-nums">{numberFormatter.format(matched)}</span> of{' '}
          {numberFormatter.format(sliceSize)} rows in this slice — filtered on the client, no new request.
        </>
      ) : (
        <>Search or pick a facet to cross-filter these {numberFormatter.format(sliceSize)} rows instantly.</>
      )}
    </p>
  </div>
);

export default SliceRefine;
