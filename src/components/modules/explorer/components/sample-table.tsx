import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import { useSampleDetails } from '@/components/modules/explorer/hooks/useSampleDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/custom-skeletons';
import { NoDataAvailable } from '@/components/ui/no-data-available';
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

export const SampleTable = ({ params = {} }: SampleTableProps) => {
  const query = useSampleDetails(params);
  const totalQuery = useAggregated(params);
  const rows = query.data ?? [];
  const { onScroll, totalHeight, items } = useVirtualRows({
    count: rows.length,
    rowHeight: ROW_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
  });

  if (query.isPending)
    return (
      <Frame>
        <TableSkeleton />
      </Frame>
    );
  if (query.isError)
    return (
      <Frame>
        <NoDataAvailable className="h-[320px]" text={`Couldn't load samples: ${query.error.message}`} />
      </Frame>
    );
  if (rows.length === 0)
    return (
      <Frame>
        <NoDataAvailable className="h-[320px]" text="No samples match these filters." />
      </Frame>
    );

  const total = totalQuery.data?.[0]?.count ?? rows.length;
  const subtitle =
    total > rows.length
      ? `Showing the first ${fullNumber.format(rows.length)} of ${fullNumber.format(total)} matching samples`
      : `${fullNumber.format(rows.length)} samples`;

  return (
    <Frame subtitle={subtitle}>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
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

          <div className="overflow-y-auto" style={{ height: VIEWPORT_HEIGHT }} onScroll={onScroll}>
            <div className="relative" style={{ height: totalHeight }}>
              {items.map(({ index, start }) => {
                const row = rows[index];
                return (
                  <div
                    key={index}
                    className="absolute inset-x-0 grid items-center gap-3 border-b px-3 text-sm"
                    style={{ top: start, height: ROW_HEIGHT, gridTemplateColumns: GRID_TEMPLATE }}
                  >
                    {columns.map((column) => (
                      <div key={column.key} className={cn('truncate', column.mono && 'font-mono text-xs')}>
                        {cell(row[column.key])}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

export default SampleTable;
