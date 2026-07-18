import { useEffect } from 'react';

import { SliceRefine } from '@/components/modules/explorer/components/slice-refine';
import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import { SLICE_TARGET } from '@/components/modules/explorer/sliceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/custom-skeletons';
import { NoDataAvailable } from '@/components/ui/no-data-available';
import { Skeleton } from '@/components/ui/skeleton';
import { useCrossfilter } from '@/hooks/useCrossfilter';
import { useVirtualRows } from '@/hooks/useVirtualRows';
import type { QueryParamsT } from '@/lib/endpoints';
import type { DetailRowT } from '@/types/lapis';
import { cn } from '@/lib/utils';

const ROW_HEIGHT = 40;
const VIEWPORT_HEIGHT = 480;
const GRID_TEMPLATE = 'minmax(130px,1.1fr) 104px minmax(120px,1fr) minmax(110px,1fr) minmax(110px,1fr) 96px';

const columns: { key: string; label: string; mono?: boolean }[] = [
  { key: 'genbankAccession', label: 'Accession', mono: true },
  { key: 'date', label: 'Date' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'pangoLineage', label: 'Lineage', mono: true },
  { key: 'host', label: 'Host' },
];

const fullNumber = new Intl.NumberFormat('en-US');
const cell = (value: DetailRowT[string]) => (value === null || value === '' ? '—' : String(value));

interface SampleTableProps {
  params?: QueryParamsT;
}

const Frame = ({ subtitle, children }: { subtitle?: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle>Sample records</CardTitle>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

const HeaderRow = () => (
  <div
    className="grid gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground"
    style={{ gridTemplateColumns: GRID_TEMPLATE }}
  >
    {columns.map((column) => (
      <div key={column.key} className="truncate">
        {column.label}
      </div>
    ))}
  </div>
);

export const SampleTable = ({ params = {} }: SampleTableProps) => {
  const {
    filter,
    isActive,
    matched,
    loaded,
    done,
    facets,
    hasState,
    error,
    version,
    setSearch,
    toggleFacet,
    clear,
    ensureWindow,
    getRow,
  } = useCrossfilter(params);
  const totalQuery = useAggregated(params);

  const { onScroll, totalHeight, items } = useVirtualRows({
    count: matched,
    rowHeight: ROW_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
  });

  const firstIndex = items[0]?.index ?? 0;
  const lastIndex = items[items.length - 1]?.index ?? 0;

  // Pull the visible row window from the worker as the range (or the filtered result) changes.
  useEffect(() => {
    if (matched > 0) ensureWindow(firstIndex, lastIndex);
  }, [ensureWindow, matched, version, firstIndex, lastIndex]);

  if (error)
    return (
      <Frame>
        <NoDataAvailable className="h-[320px]" text={`Couldn't load samples: ${error}`} />
      </Frame>
    );

  // First page still in flight — nothing to show yet.
  if (!hasState || (loaded === 0 && !done))
    return (
      <Frame>
        <TableSkeleton />
      </Frame>
    );

  if (done && loaded === 0)
    return (
      <Frame>
        <NoDataAvailable className="h-[320px]" text="No samples match these filters." />
      </Frame>
    );

  const serverTotal = totalQuery.data?.[0]?.count ?? loaded;
  const target = Math.min(SLICE_TARGET, serverTotal);
  const progress = target > 0 ? Math.min(1, loaded / target) : 1;
  const subtitle = done
    ? `${fullNumber.format(loaded)} of ${fullNumber.format(serverTotal)} samples held in the worker for client-side crossfiltering`
    : `Streaming slice into the worker — ${fullNumber.format(loaded)} of ${fullNumber.format(target)} rows…`;

  return (
    <Frame subtitle={subtitle}>
      {!done && (
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <SliceRefine
        filter={filter}
        facets={facets}
        matched={matched}
        sliceSize={loaded}
        isActive={isActive}
        onSearch={setSearch}
        onToggle={toggleFacet}
        onClear={clear}
      />

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <HeaderRow />

          {matched === 0 ? (
            <NoDataAvailable className="h-[320px]" text="No rows in this slice match your refinement." />
          ) : (
            <div className="overflow-y-auto" style={{ height: VIEWPORT_HEIGHT }} onScroll={onScroll}>
              <div className="relative" style={{ height: totalHeight }}>
                {items.map(({ index, start }) => {
                  const row = getRow(index);
                  return (
                    <div
                      key={index}
                      className="absolute inset-x-0 grid items-center gap-3 border-b px-3 text-sm"
                      style={{ top: start, height: ROW_HEIGHT, gridTemplateColumns: GRID_TEMPLATE }}
                    >
                      {columns.map((column) =>
                        row ? (
                          <div key={column.key} className={cn('truncate', column.mono && 'font-mono text-xs')}>
                            {cell(row[column.key])}
                          </div>
                        ) : (
                          <Skeleton key={column.key} className="h-3 w-3/4 rounded" />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
};

export default SampleTable;
