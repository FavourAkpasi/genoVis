import { IconChevronRight } from '@tabler/icons-react';

import { cn } from '@/lib/utils';

const DiagramCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-xl border bg-card/50 p-4 sm:p-6', className)}>{children}</div>
);

const Node = ({ label, sub }: { label: string; sub: string }) => (
  <div className="flex flex-1 flex-col items-center gap-1 rounded-lg border bg-background px-3 py-3 text-center">
    <span className="font-mono text-xs font-medium sm:text-sm">{label}</span>
    <span className="text-[11px] text-muted-foreground">{sub}</span>
  </div>
);

const Arrow = () => (
  <IconChevronRight className="mx-auto size-5 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden />
);

const FLOW = [
  { label: 'endpoints.ts', sub: 'build the URL' },
  { label: 'lapisService.ts', sub: 'fetch · cancellable' },
  { label: 'use*.ts', sub: 'cache · React state' },
  { label: 'component', sub: 'render' },
];

/** The four-layer request pipeline, left to right (top to bottom on mobile). */
export const DataFlowDiagram = () => (
  <DiagramCard>
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      {FLOW.map((node, index) => (
        <div key={node.label} className="flex flex-col sm:flex-1 sm:flex-row sm:items-center">
          <Node label={node.label} sub={node.sub} />
          {index < FLOW.length - 1 && <Arrow />}
        </div>
      ))}
    </div>
  </DiagramCard>
);

/** Main thread vs. worker: what lives where, and the messages between them. */
export const WorkerDiagram = () => (
  <DiagramCard>
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-lg border bg-background p-4">
        <p className="text-sm font-medium">Main thread</p>
        <p className="mt-1 text-xs text-muted-foreground">Filter UI · the table</p>
        <p className="mt-3 font-mono text-lg font-semibold tabular-nums">~30 rows</p>
        <p className="text-[11px] text-muted-foreground">held in the DOM at once</p>
      </div>

      <ul className="flex flex-col gap-1.5 text-center font-mono text-[11px] text-muted-foreground">
        <li>fetch · query · window →</li>
        <li>← state · rows</li>
      </ul>

      <div className="rounded-lg border bg-background p-4">
        <p className="text-sm font-medium">Crossfilter worker</p>
        <p className="mt-1 text-xs text-muted-foreground">Fetch loop · filtering · CSV</p>
        <p className="mt-3 font-mono text-lg font-semibold tabular-nums">2,000,000 rows</p>
        <p className="text-[11px] text-muted-foreground">parsed &amp; held off-thread</p>
      </div>
    </div>
  </DiagramCard>
);

/** A tall column of rows with only the on-screen window materialised. */
export const WindowingDiagram = () => (
  <DiagramCard>
    <div className="flex items-center gap-5">
      {/* muted bar = the whole filtered result; accent band = the on-screen window */}
      <div className="relative h-40 w-16 overflow-hidden rounded-md border bg-muted/60">
        <div className="absolute inset-x-0 top-14 h-12 border-y-2 border-chart-3 bg-chart-3/25" />
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <p>
          <span className="font-medium">Whole result:</span>{' '}
          <span className="text-muted-foreground">up to millions of matched rows.</span>
        </p>
        <p>
          <span className="font-medium text-chart-3">Materialised window:</span>{' '}
          <span className="text-muted-foreground">only the rows in view (plus a little overscan).</span>
        </p>
        <p className="text-xs text-muted-foreground">
          As you scroll, the window slides — the DOM and the data it holds stay tiny.
        </p>
      </div>
    </div>
  </DiagramCard>
);
