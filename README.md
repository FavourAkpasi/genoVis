# GenoVis

A high-performance dashboard for exploring **~9.4 million SARS-CoV-2 genome samples** in the browser. It is built to handle a large dataset smoothly: a Web Worker streams and cross-filters a 2-million-row slice off the main thread, a custom virtualizer renders the sample table, mutations are drawn on Canvas, and the views are linked so a selection in one updates the others.

Data comes live from the open [cov-spectrum LAPIS v2 API](https://lapis.cov-spectrum.org/open/v2) (GenSpectrum). It needs no auth and no backend, and the browser calls it directly.

## The three pages

| Route         | Page           | What it does                                                                                                                                                                               |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`           | **Explorer**   | The general-purpose dashboard. Filter by lineage, region, country and date range. The KPIs, charts, mutation scatter and sample table all respond.                                         |
| `/case-study` | **Case Study** | A scrollytelling story of the Delta → Omicron handover (2021–22). A pinned stage crossfades between scenes, and each scene drives the **same Explorer components** with preset parameters. |
| `/insights`   | **Insights**   | An annotated technical teardown of the architecture, data layer, worker, virtualization, SVG vs Canvas, and component reuse. Each section has real code excerpts and diagrams.             |

### Explorer views

- **KPI row**: matching samples, collection span, lineage count, country count.
- **Samples over time**: a custom SVG line and area chart with a hover crosshair.
- **Top lineages**: a horizontal bar chart. Clicking a bar selects that lineage across the dashboard.
- **Lineage prevalence over time**: a 100% stacked area chart of the top 5 lineages plus "Other", with a clickable legend. The selected lineage is highlighted and the others are dimmed rather than removed.
- **Amino-acid mutation scatter**: an HTML5 Canvas plot of position × proportion. Each of the 11 genes gets its own column in genome order, because 11 colors would be too many to tell apart.
- **Sample table**: a virtualized table over up to 2M streamed rows. A client-side refine bar adds text search and facet chips for lineage, country and host.
- **Export**: each card can export its data. Charts export as PNG, and the bar chart and table export as CSV.

## Performance architecture

```
lib/endpoints.ts  →  services/lapisService.ts  →  TanStack Query hooks  →  components
 (URL builders)       (plain fetch transport)      (cache, dedup, keep-        (SVG / Canvas /
                                                    PreviousData)               virtualized DOM)
```

- **The Web Worker owns the big slice** (`src/workers/crossfilter.worker.ts`). The worker runs the paged `/sample/details` fetch loop itself: 50k rows per page, up to 2M rows. It keeps the rows in its own memory and recomputes the crossfilter on every interaction. Each facet's counts apply every _other_ facet but ignore that facet's own selection, so its values stay selectable. Row bodies only leave the worker for the ~30 visible rows, which the table requests as a window. The worker builds CSV exports too. If a filter changes during a fetch, the worker cancels the old fetch loop with a fetch token and an `AbortController`.
- **Custom virtualization** (`src/hooks/useVirtualRows.ts`) uses fixed-height rows and no library. Only rows in the viewport, plus some overscan, are mounted.
- **Canvas for dense data, SVG for the rest.** The Canvas scatter renders sharply on high-DPI screens and reads its colors from the CSS theme tokens. It redraws when the theme changes.
- **Coordinated views.** Explorer filters live in a Zustand store (`src/store/explorerStore.ts`) and map to server-side LAPIS params. The lineage charts query without the lineage filter, so clicking a lineage re-highlights them instantly without a refetch.
- **Code splitting.** Each route is loaded with `React.lazy`, and the date-picker calendar loads only when the picker is first opened. This cut the initial gzipped download by about 20–27% (Explorer ≈195 KiB; Case Study and Insights ≈180 KiB). To inspect the bundle, run `npm run analyze`, which builds a Rsdoctor report.

The [Insights page](src/components/modules/insights/insights-view.tsx) covers each of these in more depth.

## Tech stack

| Concern       | Choice                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------- |
| UI            | React 19, TypeScript 6                                                                       |
| Build / dev   | **Rspack** (`builtin:swc-loader`, React Refresh), **Rsdoctor** for bundle analysis           |
| Styling / UI  | Tailwind CSS v4, shadcn (`base-luma` style) on **Base UI** primitives, Tabler icons          |
| Server state  | TanStack Query                                                                               |
| Client state  | Zustand                                                                                      |
| Routing       | React Router v7                                                                              |
| Lint / format | **oxlint**, Prettier (with `prettier-plugin-tailwindcss`)                                    |
| Tests         | Vitest + Testing Library + MSW on jsdom, v8 coverage                                         |
| Observability | Sentry: errors, tracing, error-only Session Replay, source maps via `@sentry/webpack-plugin` |
| Data          | cov-spectrum LAPIS v2: `/sample/aggregated`, `/sample/aminoAcidMutations`, `/sample/details` |

## Getting started

Requires **Node ≥ 22**. The app runs without any environment variables, because the API is public.

```bash
npm install
npm run dev        # http://localhost:5173
```

To turn on Sentry, copy `.env.example` to `.env` and fill it in (see [Observability](#observability)).

### Scripts

| Command                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Rspack dev server with HMR + React Refresh           |
| `npm run build`         | Type-check (`tsc -b`) and production build → `dist/` |
| `npm run analyze`       | Production build + interactive Rsdoctor report       |
| `npm run lint`          | oxlint                                               |
| `npm run format`        | Prettier write                                       |
| `npm run typecheck`     | `tsc -b` across the app, config and test projects    |
| `npm run test`          | Vitest, single run                                   |
| `npm run test:watch`    | Vitest, watch mode                                   |
| `npm run test:coverage` | Vitest with v8 coverage and enforced thresholds      |

## Testing

The suite has 122 unit and integration tests and covers about 95% of statements. It runs on Vitest with jsdom, uses MSW to mock the LAPIS API, and uses Testing Library for components.

- **Integration-first.** Components are rendered with `renderWithProviders` (from `tests/integration/utils.tsx`), which adds the theme, a fresh QueryClient and the router. Network calls go to MSW handlers (`tests/integration/handlers.ts`), and unhandled requests fail the test.
- **The real worker engine, in-process.** The crossfilter logic lives in `src/workers/crossfilter.engine.ts`, which has no framework or transport dependencies. Unit tests drive the engine directly. Component tests swap in `InlineWorker`, which runs the same engine in-process behind a `Worker`-shaped API. That means the sample table is tested end to end: MSW serves the data, the engine pages it in, the hook windows it, and the component renders the rows.
- **Coverage.** Thresholds are enforced in `vitest.config.ts`. Run `npm run test:coverage` for a report.
- **CI.** GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint and tests on every PR and push to `main`. On a PR it posts a coverage comment showing the change against the target branch.

## Project structure

```
src/
├── components/
│   ├── layouts/            # App shell: sticky nav, mobile drawer, theme toggle, route fallback + error boundary
│   ├── modules/
│   │   ├── explorer/       # Dashboard: filter bar, charts, scatter, sample table, data hooks
│   │   ├── case-study/     # Scrollytelling: story.ts (data-driven scenes), finale SVG animations
│   │   └── insights/       # Technical teardown: prose, code snippets, diagrams
│   └── ui/                 # shadcn/Base UI primitives + custom-* wrappers (select, date range, skeletons)
├── hooks/                  # useCrossfilter (worker bridge), useVirtualRows, usePrefersReducedMotion
├── lib/                    # endpoints.ts (all URLs), observability.ts (Sentry), csv.ts, svg-export.ts, utils (cn)
├── router/                 # routes.ts (path constants) + AppRouter (lazy routes)
├── services/               # lapisService: fetch transport
├── store/                  # Zustand explorer filter store
├── types/                  # LAPIS response types
└── workers/                # crossfilter.engine.ts (logic), crossfilter.worker.ts (adapter), message protocol
tests/
├── setup.ts                # jest-dom, MSW lifecycle, browser stubs, per-test resets
└── integration/            # renderWithProviders, MSW handlers + fixtures, InlineWorker and other stubs
```

## Observability

Sentry is integrated but turned off by default. It turns on when `PUBLIC_SENTRY_DSN` is set at build time. All SDK calls go through `src/lib/observability.ts`.

- **Errors.** Sentry captures React 19 root errors (`onUncaughtError` / `onCaughtError` / `onRecoverableError`) and route errors (`RouteError` is the router's `errorElement`, so the nav stays usable when a page crashes). It also captures every failed LAPIS query, through a single `QueryCache.onError`, and worker failures: both fetch errors and uncaught crashes. A crashed worker used to leave the table loading forever; now it shows an error.
- **Performance.** React Router navigations are recorded as spans. Each worker slice fetch gets a `crossfilter.slice-fetch` span that records the number of rows loaded.
- **Session Replay.** A replay is recorded only when an error occurs. The Replay code is lazy-loaded from Sentry's CDN after startup, so it isn't in the initial bundle.
- **Trace headers.** `tracePropagationTargets` is limited to the app's own origin. Adding trace headers to LAPIS requests would turn every simple GET into a CORS preflight.
- **Source maps.** A production build with `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` set does three things: it emits hidden source maps, uploads them with `@sentry/webpack-plugin` (which works with Rspack), and deletes them from `dist/`.

The SDK adds about 20 KB gzipped to the initial bundle.

## Conventions

- All API URLs are defined in `src/lib/endpoints.ts` and nowhere else.
- Class names are combined with `cn()` from `@/lib/utils` rather than template strings.
- UI primitives come from the shadcn registry (`npx shadcn add <name>`). They are Base UI components, not Radix. Wrappers that add real logic get a `custom-` prefix.
- Components and functions are arrow functions. Prop and data types use a `T` suffix (e.g. `SceneT`).
- Nested ternaries are not allowed.
- Tests live in `src/**/__tests__/*.test.{ts,tsx}` and import `describe`/`it`/`expect` from `vitest` (no globals).

## Status and roadmap

**Done:** the data layer; the Explorer with linked views; the worker crossfilter at 2M rows; the virtualized table; the Canvas scatter; PNG and CSV export; the Case Study scrollytelling; the Insights teardown; route-level code splitting; the Vitest + MSW suite (122 tests, about 95% coverage); and Sentry observability.

**Next:**

- Deploy the app.
- Add a production build step to CI that uploads source maps to Sentry.
- Split vendor code into its own chunk for long-term caching.
- Do a runtime profiling pass.
- Fetch the full 9.4M dataset in windows.

E2E testing (Playwright) is intentionally out of scope.

## License

[MIT](LICENSE) © 2026 Akpasi Favour
