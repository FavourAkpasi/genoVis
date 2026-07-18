import { useRef, useState } from 'react';

import { useTimeSeries } from '@/components/modules/explorer/hooks/useTimeSeries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DistributionPlotSkeleton } from '@/components/ui/custom-skeletons';
import { ExportMenu } from '@/components/ui/export-menu';
import { NoDataAvailable } from '@/components/ui/no-data-available';
import type { QueryParamsT } from '@/lib/endpoints';
import { exportSvgToPng } from '@/lib/svg-export';

const VB_W = 800;
const VB_H = 300;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;
const BASELINE = PAD.top + PLOT_H;
const X_TICKS = 4;

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact' });
const fullNumber = new Intl.NumberFormat('en-US');
const formatMonth = (t: number) => new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
const formatDay = (t: number) =>
  new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

interface PointT {
  t: number;
  count: number;
  x: number;
  y: number;
}

interface TimeSeriesProps {
  params?: QueryParamsT;
}

const ChartFrame = ({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Samples over time</CardTitle>
        {action}
      </div>
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

export const TimeSeries = ({ params = {} }: TimeSeriesProps) => {
  const query = useTimeSeries(params);
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const exportAction = (
    <ExportMenu
      items={[
        {
          label: 'Download PNG',
          onSelect: () => svgRef.current && void exportSvgToPng(svgRef.current, 'samples-over-time.png'),
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
        <NoDataAvailable className="h-[280px]" text={`Couldn't load samples: ${query.error.message}`} />
      </ChartFrame>
    );

  const rows = (query.data ?? [])
    .filter((row) => row.date)
    .map((row) => ({ t: Date.parse(String(row.date)), count: row.count }))
    .filter((row) => !Number.isNaN(row.t))
    .sort((a, b) => a.t - b.t);

  if (rows.length === 0)
    return (
      <ChartFrame>
        <NoDataAvailable className="h-[280px]" text="No samples match these filters." />
      </ChartFrame>
    );

  const tMin = rows[0].t;
  const tMax = rows[rows.length - 1].t;
  const tSpan = tMax - tMin || 1;
  const vMax = Math.max(...rows.map((row) => row.count), 1);

  const xOf = (t: number) => PAD.left + ((t - tMin) / tSpan) * PLOT_W;
  const yOf = (v: number) => PAD.top + (1 - v / vMax) * PLOT_H;

  const points: PointT[] = rows.map((row) => ({ ...row, x: xOf(row.t), y: yOf(row.count) }));
  const peak = rows.reduce((best, row) => (row.count > best.count ? row : best), rows[0]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `M${points[0].x.toFixed(1)},${BASELINE} ${points
    .map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')} L${points[points.length - 1].x.toFixed(1)},${BASELINE} Z`;

  const yTicks = [0, vMax / 2, vMax];
  const xTickIndices = [
    ...new Set(Array.from({ length: X_TICKS }, (_, i) => Math.round((i / (X_TICKS - 1)) * (points.length - 1)))),
  ];

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * VB_W;
    let nearest = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const distance = Math.abs(points[i].x - svgX);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = i;
      }
    }
    setHovered(nearest);
  };

  const active = hovered === null ? null : points[hovered];

  return (
    <ChartFrame action={exportAction}>
      <p className="mb-3 text-xs text-muted-foreground">
        {fullNumber.format(rows.length)} days · peak {fullNumber.format(peak.count)} on {formatDay(peak.t)}
      </p>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          role="img"
          aria-label={`Sample counts over time from ${formatDay(tMin)} to ${formatDay(tMax)}, peaking at ${fullNumber.format(peak.count)} on ${formatDay(peak.t)}.`}
        >
          {/* y-axis title */}
          <text
            transform={`translate(12 ${PAD.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            Samples per day
          </text>

          {/* y grid + labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={yOf(v)}
                x2={VB_W - PAD.right}
                y2={yOf(v)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={yOf(v)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {compactNumber.format(v)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {xTickIndices.map((index) => (
            <text
              key={index}
              x={points[index].x}
              y={VB_H - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatMonth(points[index].t)}
            </text>
          ))}

          <path d={areaPath} className="fill-chart-3 opacity-15" />
          <path d={linePath} className="stroke-chart-3" strokeWidth={2} fill="none" strokeLinejoin="round" />

          {/* hover crosshair + marker */}
          {active && (
            <g>
              <line x1={active.x} y1={PAD.top} x2={active.x} y2={BASELINE} className="stroke-border" strokeWidth={1} />
              <circle cx={active.x} cy={active.y} r={4} className="fill-chart-3 stroke-background" strokeWidth={2} />
            </g>
          )}

          {/* transparent overlay to capture pointer */}
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
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
            style={{ left: `${(active.x / VB_W) * 100}%`, top: `${(active.y / VB_H) * 100}%` }}
          >
            <div className="font-medium tabular-nums">{fullNumber.format(active.count)}</div>
            <div className="text-muted-foreground">{formatDay(active.t)}</div>
          </div>
        )}
      </div>
    </ChartFrame>
  );
};

export default TimeSeries;
