// Real (lightly trimmed) excerpts from the codebase, shown verbatim on the
// Insights teardown. Kept here so the page JSX stays readable.

export const DATA_FLOW_SNIPPET = `// 1 · endpoints.ts — the only place a URL is ever built
aggregated: (params) => \`\${LAPIS_BASE}/sample/aggregated\${buildQuery(params)}\`

// 2 · lapisService.ts — pure, cancellable transport (no React)
getAggregated: (params, signal) =>
  lapisFetch<AggregatedRowT>(endpoints.lapis.aggregated(params), signal)

// 3 · useAggregated.ts — cached React state
useQuery({
  queryKey: ['aggregated', params],
  queryFn: ({ signal }) => lapisService.getAggregated(params, signal),
  placeholderData: keepPreviousData, // morph on filter change, no skeleton flash
})

// 4 · the component just consumes the hook
const { data, isPending } = useAggregated(params)`;

export const WORKER_PROTOCOL_SNIPPET = `// crossfilter.types.ts — the main thread → worker message contract
type CrossfilterRequestT =
  | { type: 'fetch';  params; target; pageSize } // page 2M rows in
  | { type: 'query';  filter }                   // re-filter, in the worker
  | { type: 'window'; start; count }             // ask for the visible rows only
  | { type: 'export'; limit }                    // build the CSV off-thread`;

export const WORKER_WINDOW_SNIPPET = `// crossfilter.worker.ts — the main thread only ever receives what's on screen
const rows = matchedIndices
  .slice(message.start, message.start + message.count) // e.g. 30 of 2,000,000
  .map((index) => dataset[index]);

post({ type: 'window', start: message.start, rows }); // state messages carry no rows`;

export const VIRTUAL_ROWS_SNIPPET = `// useVirtualRows.ts — mount a constant handful of rows, whatever the count
const startIndex   = Math.floor(scrollTop / rowHeight) - overscan;
const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;

// items[] holds only the rows in (or near) the viewport;
// an outer spacer sized to count * rowHeight preserves the scrollbar.`;

export const CANVAS_SNIPPET = `// mutation-scatter.tsx — Canvas for thousands of dots, redrawn on theme flip
const isDark = useSyncExternalStore(subscribeTheme, getIsDark);

const dpr = window.devicePixelRatio || 1; // stay crisp on retina
canvas.width = width * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // then draw every point by hand`;
