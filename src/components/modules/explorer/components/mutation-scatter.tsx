import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { useAminoAcidMutations } from '@/components/modules/explorer/hooks/useAminoAcidMutations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterPlotSkeleton } from '@/components/ui/custom-skeletons';
import { NoDataAvailable } from '@/components/ui/no-data-available';
import type { QueryParamsT } from '@/lib/endpoints';
import type { MutationRowT } from '@/types/lapis';

const HEIGHT = 360;
const PAD = { top: 16, right: 16, bottom: 44, left: 48 };
const MIN_PROPORTION = 0.02;
const DOT_RADIUS = 3;
const HIT_RADIUS = 10;

// SARS-CoV-2 genes in genomic order; unknown genes sort after, alphabetically.
const GENE_ORDER = ['ORF1a', 'ORF1b', 'S', 'ORF3a', 'E', 'M', 'ORF6', 'ORF7a', 'ORF7b', 'ORF8', 'N', 'ORF9b', 'ORF10'];
const geneRank = (gene: string) => {
  const index = GENE_ORDER.indexOf(gene);
  return index === -1 ? GENE_ORDER.length : index;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
const fullNumber = new Intl.NumberFormat('en-US');

// Redraw the canvas when the resolved (light/dark) theme changes.
const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const getIsDark = () => document.documentElement.classList.contains('dark');

interface ScatterPointT {
  sx: number;
  sy: number;
  row: MutationRowT;
}

interface GeometryT {
  points: ScatterPointT[];
  segments: { gene: string; x0: number; width: number; cx: number }[];
  plotH: number;
}

interface MutationScatterProps {
  params?: QueryParamsT;
}

const Frame = ({ subtitle, children }: { subtitle?: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle>Mutation landscape</CardTitle>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

export const MutationScatter = ({ params = {} }: MutationScatterProps) => {
  const query = useAminoAcidMutations({ ...params, minProportion: MIN_PROPORTION });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const isDark = useSyncExternalStore(subscribeTheme, getIsDark, () => false);

  const rows = query.data;

  // Callback ref: (re)attach the ResizeObserver whenever the plot container mounts —
  // robust to the container being absent during the loading / empty states.
  const setContainer = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (node) {
      setWidth(node.clientWidth);
      const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const geometry: GeometryT | null = useMemo(() => {
    if (!rows || rows.length === 0 || width === 0) return null;

    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const valid = rows.filter((row) => row.sequenceName);

    const genes = [...new Set(valid.map((row) => row.sequenceName as string))].sort(
      (a, b) => geneRank(a) - geneRank(b) || a.localeCompare(b)
    );
    const geneIndex = new Map(genes.map((gene, index) => [gene, index]));
    const maxPos = new Map<string, number>();
    for (const row of valid) {
      const gene = row.sequenceName as string;
      maxPos.set(gene, Math.max(maxPos.get(gene) ?? 1, row.position));
    }

    const colWidth = plotW / genes.length;
    const inset = Math.min(14, colWidth * 0.15);

    const points = valid.map((row) => {
      const gene = row.sequenceName as string;
      const gi = geneIndex.get(gene) ?? 0;
      const mp = maxPos.get(gene) ?? 1;
      const colLeft = PAD.left + gi * colWidth;
      const usable = colWidth - 2 * inset;
      const sx = mp <= 1 ? colLeft + colWidth / 2 : colLeft + inset + (row.position / mp) * usable;
      const sy = PAD.top + (1 - clamp(row.proportion, 0, 1)) * plotH;
      return { sx, sy, row };
    });

    const segments = genes.map((gene, index) => ({
      gene,
      x0: PAD.left + index * colWidth,
      width: colWidth,
      cx: PAD.left + index * colWidth + colWidth / 2,
    }));

    return { points, segments, plotH };
  }, [rows, width]);

  // Draw whenever geometry, hover, or theme changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !geometry || width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);

    const styles = getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    const accent = token('--chart-3', 'oklch(0.666 0.179 58.318)');
    const border = token('--border', '#8884');
    const labelColor = token('--muted-foreground', '#888');
    const foreground = token('--foreground', '#111');

    const { points, segments, plotH } = geometry;
    const plotTop = PAD.top;

    // Alternating gene bands.
    segments.forEach((seg, index) => {
      if (index % 2 === 0) return;
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = foreground;
      ctx.fillRect(seg.x0, plotTop, seg.width, plotH);
      ctx.restore();
    });

    // Y gridlines + percentage labels.
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    [0, 0.5, 1].forEach((tick) => {
      const y = plotTop + (1 - tick) * plotH;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(width - PAD.right, y);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = labelColor;
      ctx.fillText(percent.format(tick), PAD.left - 8, y);
    });

    // Gene labels.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = labelColor;
    segments.forEach((seg) => {
      if (seg.width < 24) return;
      ctx.fillText(seg.gene, seg.cx, HEIGHT - PAD.bottom + 18);
    });

    // Dots.
    ctx.fillStyle = accent;
    points.forEach((point, index) => {
      if (index === hovered) return;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(point.sx, point.sy, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Hovered dot on top.
    if (hovered != null && points[hovered]) {
      const point = points[hovered];
      ctx.beginPath();
      ctx.arc(point.sx, point.sy, DOT_RADIUS + 2, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = foreground;
      ctx.stroke();
    }
  }, [geometry, hovered, isDark, width]);

  const handleMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!geometry) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    let nearest = -1;
    let best = HIT_RADIUS * HIT_RADIUS;
    geometry.points.forEach((point, index) => {
      const dx = point.sx - mx;
      const dy = point.sy - my;
      const distance = dx * dx + dy * dy;
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    setHovered(nearest === -1 ? null : nearest);
  };

  const hasData = !!rows && rows.length > 0;
  const geneCount = hasData ? new Set(rows.filter((row) => row.sequenceName).map((row) => row.sequenceName)).size : 0;
  const active = hovered != null ? geometry?.points[hovered] : undefined;

  const renderBody = () => {
    if (query.isPending) return <ScatterPlotSkeleton />;
    if (query.isError)
      return <NoDataAvailable className="h-[360px]" text={`Couldn't load mutations: ${query.error.message}`} />;
    if (!hasData) return <NoDataAvailable className="h-[360px]" text="No mutations match these filters." />;

    return (
      <div ref={setContainer} className="relative">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          role="img"
          aria-label={`Scatter plot of ${rows.length} amino-acid mutations across ${geneCount} genes, arranged by gene in genomic order (x) against their frequency (y).`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
        />
        {active && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
            style={{ left: active.sx, top: active.sy }}
          >
            <div className="font-mono font-medium">{active.row.mutation}</div>
            <div className="text-muted-foreground">
              {percent.format(active.row.proportion)} · {fullNumber.format(active.row.count)} samples
            </div>
          </div>
        )}
      </div>
    );
  };

  const subtitle = hasData
    ? `${fullNumber.format(rows.length)} mutations across ${geneCount} genes · residue position × frequency`
    : undefined;

  return <Frame subtitle={subtitle}>{renderBody()}</Frame>;
};

export default MutationScatter;
