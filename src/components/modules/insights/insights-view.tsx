import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { CodeBlock } from '@/components/modules/insights/components/code-block';
import { DataFlowDiagram, WindowingDiagram, WorkerDiagram } from '@/components/modules/insights/components/diagrams';
import { useActiveSection } from '@/components/modules/insights/hooks/useActiveSection';
import {
  CANVAS_SNIPPET,
  DATA_FLOW_SNIPPET,
  VIRTUAL_ROWS_SNIPPET,
  WORKER_PROTOCOL_SNIPPET,
  WORKER_WINDOW_SNIPPET,
} from '@/components/modules/insights/snippets';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

const SECTIONS = [
  { id: 'architecture', title: 'The shape of the app' },
  { id: 'data', title: 'Live data, cached & deduped' },
  { id: 'worker', title: 'Two million rows, off-thread' },
  { id: 'virtualization', title: 'Rendering only what you see' },
  { id: 'rendering', title: 'SVG where crisp, Canvas where dense' },
  { id: 'engine', title: 'One engine, two surfaces' },
];

// Stable reference so the scroll-spy observer isn't rebuilt each render.
const SECTION_IDS = SECTIONS.map((section) => section.id);

interface SectionProps {
  id: string;
  index: number;
  kicker: string;
  title: string;
  children: React.ReactNode;
}

const Section = ({ id, index, kicker, title, children }: SectionProps) => (
  <section id={id} className="flex scroll-mt-20 flex-col gap-4">
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs font-medium tracking-wider text-muted-foreground">
        {String(index).padStart(2, '0')} · {kicker}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
    </div>
    {children}
  </section>
);

const Prose = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{children}</p>
);

const Emphasis = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-foreground">{children}</span>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
);

export const InsightsView = () => {
  const activeId = useActiveSection(SECTION_IDS);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex max-w-2xl flex-col gap-4">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Insights · Teardown</span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">How GenoVis is built</h1>
        <Prose>
          GenoVis turns a live, ~9.4-million-sample genomic database into charts that stay smooth at scale. This page
          lifts the cover: the architecture, and the handful of performance decisions that carry it. Every snippet below
          is real code from this repository.
        </Prose>
      </header>

      <div className="mt-12 flex gap-12">
        <main className="flex max-w-3xl min-w-0 flex-1 flex-col gap-16">
          <Section id="architecture" index={1} kicker="Architecture" title="The shape of the app">
            <Prose>
              Every feature flows through the same four thin layers. A URL is built in exactly one place; a component
              never touches a <Code>fetch</Code>. Adding a chart becomes mechanical — an endpoint, a transport function,
              a query hook, then consume it — and each layer stays independently testable.
            </Prose>
            <DataFlowDiagram />
            <CodeBlock caption="The aggregated pipeline, end to end" code={DATA_FLOW_SNIPPET} />
          </Section>

          <Section id="data" index={2} kicker="Data layer" title="Live data, cached and deduped">
            <Prose>
              Server data is owned by <Emphasis>TanStack Query</Emphasis>, not component state. The query key is{' '}
              <Code>[name, params]</Code> — so two components asking for the same slice share{' '}
              <Emphasis>one request and one cache entry</Emphasis>.
            </Prose>
            <Prose>
              That is exactly why the Case Study is cheap: it renders the Explorer&apos;s charts with preset params, and
              the browser already holds (or shares) those results. <Code>keepPreviousData</Code> lets a chart morph to
              new filters instead of flashing a skeleton, and the <Code>AbortSignal</Code> threaded down to{' '}
              <Code>fetch</Code> cancels a request the instant its filters change.
            </Prose>
          </Section>

          <Section id="worker" index={3} kicker="Concurrency" title="Two million rows, off the main thread">
            <Prose>
              The sample table is backed by a two-million-row slice. Parsing and holding that on the main thread would
              jank every interaction, so it lives entirely in a <Emphasis>Web Worker</Emphasis>.
            </Prose>
            <Prose>
              The worker pages the slice in from LAPIS — 50,000 rows (~6.9 MB) per request — parses each chunk
              off-thread, and keeps every row. The main thread only ever <Emphasis>sends</Emphasis> a filter or a window
              request, and only ever <Emphasis>receives</Emphasis> a state summary or the ~30 rows currently on screen.
            </Prose>
            <WorkerDiagram />
            <CodeBlock caption="crossfilter.types.ts — the message contract" code={WORKER_PROTOCOL_SNIPPET} />
            <Prose>
              Crossfilter counts are computed there too: each facet&apos;s tallies pass every <em>other</em>{' '}
              facet&apos;s selection but not its own. Even CSV export is serialized in the worker, so a 100k-row
              download never blocks the UI.
            </Prose>
            <CodeBlock caption="crossfilter.worker.ts — hand back only the visible rows" code={WORKER_WINDOW_SNIPPET} />
          </Section>

          <Section id="virtualization" index={4} kicker="Rendering at scale" title="Rendering only what you can see">
            <Prose>
              A matched result can still be enormous, so the table never renders more than it must. A fixed-height
              virtualizer maps scroll position to just the row indices in view; an outer spacer at the full height keeps
              the scrollbar honest.
            </Prose>
            <WindowingDiagram />
            <Prose>
              There are actually <Emphasis>two windows</Emphasis> in play: this DOM window (which rows to mount) and the
              worker&apos;s data window (which rows to hand over). Scroll a little and neither re-runs; scroll far and
              both slide — each padded so small moves don&apos;t chatter.
            </Prose>
            <CodeBlock caption="useVirtualRows.ts" code={VIRTUAL_ROWS_SNIPPET} />
          </Section>

          <Section
            id="rendering"
            index={5}
            kicker="Draw strategy"
            title="SVG where it's crisp, Canvas where it's dense"
          >
            <Prose>
              Charts use <Emphasis>SVG</Emphasis> where the mark count is low — the stacked-area and time-series plots
              are a few hundred nodes, crisp at any zoom and trivially exportable to PNG.
            </Prose>
            <Prose>
              The mutation landscape is different: thousands of points, redrawn on hover and on every theme flip. That
              many SVG nodes would crawl, so it&apos;s a single <Emphasis>Canvas</Emphasis> — subscribed to the theme
              via <Code>useSyncExternalStore</Code>, scaled by <Code>devicePixelRatio</Code> to stay sharp, with
              hit-testing done in math rather than the DOM.
            </Prose>
            <CodeBlock caption="mutation-scatter.tsx" code={CANVAS_SNIPPET} />
          </Section>

          <Section id="engine" index={6} kicker="Reuse" title="One engine, two surfaces">
            <Prose>
              There is only one set of visualisations. The <Emphasis>Explorer</Emphasis> wires them to live filter
              controls; the <Emphasis>Case Study</Emphasis> wires the same components to a fixed script. No chart is
              built twice.
            </Prose>
            <div className="flex flex-wrap gap-3">
              <Link to={routes.explorer} className={cn(buttonVariants(), 'gap-2')}>
                See it interactive · Explorer
                <IconArrowRight className="size-4" aria-hidden />
              </Link>
              <Link to={routes.caseStudy} className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
                See it narrated · Case Study
                <IconArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Section>
        </main>

        <aside className="hidden w-48 shrink-0 xl:block">
          <nav className="sticky top-20 flex flex-col gap-2" aria-label="On this page">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">On this page</p>
            {SECTIONS.map((section) => {
              const active = section.id === activeId;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'origin-left text-sm transition-all duration-200',
                    active ? 'scale-105 font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {section.title}
                </a>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default InsightsView;
