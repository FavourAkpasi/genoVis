import { useLineageComposition } from '@/components/modules/explorer/hooks/useLineageComposition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DistributionPlotSkeleton } from '@/components/ui/custom-skeletons';
import { ExportMenu } from '@/components/ui/export-menu';
import { NoDataAvailable } from '@/components/ui/no-data-available';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { downloadCsv, toCsv } from '@/lib/csv';
import type { QueryParamsT } from '@/lib/endpoints';
import { cn } from '@/lib/utils';

const TOP_N = 10;
const fullNumber = new Intl.NumberFormat('en-US');
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

interface LineageBarProps {
  params?: QueryParamsT;
  activeLineage?: string;
  onSelectLineage?: (lineage: string) => void;
}

const ChartFrame = ({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Top lineages</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Click a bar to filter the whole view by that lineage.</p>
        </div>
        {action}
      </div>
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

export const LineageBar = ({ params = {}, activeLineage, onSelectLineage }: LineageBarProps) => {
  const query = useLineageComposition(params);
  const reduceMotion = usePrefersReducedMotion();

  if (query.isPending)
    return (
      <ChartFrame>
        <DistributionPlotSkeleton />
      </ChartFrame>
    );
  if (query.isError)
    return (
      <ChartFrame>
        <NoDataAvailable className="h-[280px]" text={`Couldn't load lineages: ${query.error.message}`} />
      </ChartFrame>
    );

  const rows = (query.data ?? [])
    .filter((row) => row.pangoLineage)
    .map((row) => ({ lineage: String(row.pangoLineage), count: row.count }))
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0)
    return (
      <ChartFrame>
        <NoDataAvailable className="h-[280px]" text="No lineages match these filters." />
      </ChartFrame>
    );

  const top = rows.slice(0, TOP_N);
  const totalAll = rows.reduce((sum, row) => sum + row.count, 0);
  const maxCount = top[0].count;
  const hasActive = !!activeLineage && top.some((row) => row.lineage === activeLineage);

  const exportCsv = () => {
    const data = rows.map((row) => ({
      lineage: row.lineage,
      count: row.count,
      proportion: row.count / totalAll,
    }));
    downloadCsv('genovis-lineages.csv', toCsv(data, ['lineage', 'count', 'proportion']));
  };

  return (
    <ChartFrame action={<ExportMenu items={[{ label: 'Download CSV', onSelect: exportCsv }]} />}>
      <ul className="flex flex-col gap-1.5">
        {top.map(({ lineage, count }) => {
          const active = activeLineage === lineage;
          const dimmed = hasActive && !active;
          return (
            <li key={lineage}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelectLineage?.(lineage)}
                className={cn(
                  'group grid w-full grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-md px-1 py-1 text-left text-xs transition-opacity hover:bg-muted/50',
                  active && 'bg-muted',
                  dimmed && 'opacity-40'
                )}
              >
                <span className={cn('truncate font-mono', active ? 'text-foreground' : 'text-muted-foreground')}>
                  {lineage}
                </span>
                <span className="h-4 overflow-hidden rounded-sm bg-muted/60">
                  <span
                    className={cn(
                      'block h-full rounded-sm',
                      active ? 'bg-chart-2' : 'bg-chart-3',
                      !reduceMotion && 'transition-[width]'
                    )}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {percent.format(count / totalAll)} · {fullNumber.format(count)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ChartFrame>
  );
};

export default LineageBar;
