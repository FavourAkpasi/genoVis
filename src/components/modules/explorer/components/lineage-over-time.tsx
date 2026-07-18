import { useRef, useState } from 'react';

import { useLineageOverTime } from '@/components/modules/explorer/hooks/useLineageOverTime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DistributionPlotSkeleton } from '@/components/ui/custom-skeletons';
import { ExportMenu } from '@/components/ui/export-menu';
import { NoDataAvailable } from '@/components/ui/no-data-available';
import type { QueryParamsT } from '@/lib/endpoints';
import { exportSvgToPng } from '@/lib/svg-export';
import { cn } from '@/lib/utils';

const VB_W = 800;
const VB_H = 300;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;
const X_TICKS = 4;
const TOP_N = 5;
const OTHER = 'Other';

// Sequential amber ramp for the top lineages; muted grey for the "Other" bucket.
const FILL = [
  'fill-chart-1',
  'fill-chart-2',
  'fill-chart-3',
  'fill-chart-4',
  'fill-chart-5',
  'fill-muted-foreground/40',
];
const SWATCH = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-muted-foreground/40'];

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
const formatMonth = (t: number) => new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
const formatDay = (t: number) =>
  new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

interface ColumnT {
  t: number;
  x: number;
  props: number[];
  bounds: number[];
}

interface LineageOverTimeProps {
  params?: QueryParamsT;
  activeLineage?: string;
  onSelectLineage?: (lineage: string) => void;
}

const ChartFrame = ({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Lineage prevalence over time</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Share of samples by lineage — 100% stacked. Click a legend item to filter.
          </p>
        </div>
        {action}
      </div>
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

export const LineageOverTime = ({ params = {}, activeLineage, onSelectLineage }: LineageOverTimeProps) => {
  const query = useLineageOverTime(params);
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const exportAction = (
    <ExportMenu
      items={[
        {
          label: 'Download PNG',
          onSelect: () => svgRef.current && void exportSvgToPng(svgRef.current, 'lineage-prevalence.png'),
        },
      ]}
      disabled={query.isPending || query.isError}
    />
  );

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
    .filter((row) => row.date && row.pangoLineage)
    .map((row) => ({ t: Date.parse(String(row.date)), lineage: String(row.pangoLineage), count: row.count }))
    .filter((row) => !Number.isNaN(row.t));

  // Top lineages overall; everything else folds into "Other".
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.lineage, (totals.get(row.lineage) ?? 0) + row.count);
  const topKeys = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([lineage]) => lineage);
  const seriesKeys = [...topKeys, OTHER];
  const hasActive = !!activeLineage && seriesKeys.includes(activeLineage);

  // Group counts by date.
  const byDate = new Map<number, Map<string, number>>();
  for (const row of rows) {
    const bucket = byDate.get(row.t) ?? new Map<string, number>();
    bucket.set(row.lineage, (bucket.get(row.lineage) ?? 0) + row.count);
    byDate.set(row.t, bucket);
  }
  const times = [...byDate.keys()].sort((a, b) => a - b);

  if (times.length < 2)
    return (
      <ChartFrame>
        <NoDataAvailable className="h-[280px]" text="Not enough dated samples to plot a trend." />
      </ChartFrame>
    );

  const tMin = times[0];
  const tMax = times[times.length - 1];
  const tSpan = tMax - tMin || 1;
  const xOf = (t: number) => PAD.left + ((t - tMin) / tSpan) * PLOT_W;
  const yOf = (p: number) => PAD.top + (1 - p) * PLOT_H;

  const columns: ColumnT[] = times.map((t) => {
    const counts = byDate.get(t) ?? new Map<string, number>();
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0) || 1;
    const topSum = topKeys.reduce((sum, key) => sum + (counts.get(key) ?? 0), 0);
    const props = seriesKeys.map((key) => (key === OTHER ? (total - topSum) / total : (counts.get(key) ?? 0) / total));
    const bounds = [0];
    for (const prop of props) bounds.push(bounds[bounds.length - 1] + prop);
    return { t, x: xOf(t), props, bounds };
  });

  const bandPath = (index: number) => {
    const upper = columns.map((column) => `${column.x.toFixed(1)},${yOf(column.bounds[index + 1]).toFixed(1)}`);
    const lower = [...columns]
      .reverse()
      .map((column) => `${column.x.toFixed(1)},${yOf(column.bounds[index]).toFixed(1)}`);
    return `M${[...upper, ...lower].join(' L')} Z`;
  };

  const xTickIndices = [
    ...new Set(Array.from({ length: X_TICKS }, (_, i) => Math.round((i / (X_TICKS - 1)) * (columns.length - 1)))),
  ];
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * VB_W;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < columns.length; i += 1) {
      const distance = Math.abs(columns[i].x - svgX);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    }
    setHovered(nearest);
  };

  const active = hovered === null ? null : columns[hovered];

  return (
    <ChartFrame action={exportAction}>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          role="img"
          aria-label="Lineage prevalence over time, 100% stacked area"
        >
          {yTicks.map((p) => (
            <g key={p}>
              <line
                x1={PAD.left}
                y1={yOf(p)}
                x2={VB_W - PAD.right}
                y2={yOf(p)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={yOf(p)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {percent.format(p)}
              </text>
            </g>
          ))}

          {xTickIndices.map((index) => (
            <text
              key={index}
              x={columns[index].x}
              y={VB_H - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatMonth(columns[index].t)}
            </text>
          ))}

          {seriesKeys.map((key, index) => (
            <path
              key={key}
              d={bandPath(index)}
              className={cn(FILL[index], hasActive && key !== activeLineage ? 'opacity-15' : 'opacity-90')}
            />
          ))}

          {active && (
            <line
              x1={active.x}
              y1={PAD.top}
              x2={active.x}
              y2={PAD.top + PLOT_H}
              className="stroke-foreground/40"
              strokeWidth={1}
            />
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHovered(null)}
          />
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute z-10 -translate-y-2 rounded-md border bg-popover px-2 py-1.5 text-xs shadow-md"
            style={{ left: `${Math.min(80, (active.x / VB_W) * 100)}%`, top: 0 }}
          >
            <div className="mb-1 font-medium">{formatDay(active.t)}</div>
            <ul className="flex flex-col gap-0.5">
              {seriesKeys.map((key, index) =>
                active.props[index] > 0.005 ? (
                  <li key={key} className="flex items-center gap-1.5">
                    <span className={cn('size-2 shrink-0 rounded-full', SWATCH[index])} />
                    <span className="font-mono">{key}</span>
                    <span className="ml-auto text-muted-foreground tabular-nums">
                      {percent.format(active.props[index])}
                    </span>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {seriesKeys.map((key, index) => {
          const isOther = key === OTHER;
          const activeItem = activeLineage === key;
          return (
            <li key={key}>
              <button
                type="button"
                disabled={isOther}
                aria-pressed={activeItem}
                onClick={() => onSelectLineage?.(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-1 py-0.5 text-xs transition-opacity',
                  isOther ? 'cursor-default text-muted-foreground' : 'hover:bg-muted',
                  activeItem && 'bg-muted font-medium text-foreground',
                  hasActive && !activeItem && 'opacity-40'
                )}
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', SWATCH[index])} />
                <span className="font-mono">{key}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </ChartFrame>
  );
};

export default LineageOverTime;
