---
name: architecture
description: How the genovis frontend is wired — data flow (endpoints → services → hooks → components), workers, routing, and state. Use when adding a backend/api-connected feature, a new endpoint, or answering "how does X work" about routing/state.
---

# genovis frontend architecture

React 19 + TypeScript + Rspack SPA — a visual data science dashboard. Data comes from open, publicly available endpoints (primary source: cov-spectrum LAPIS v2, ~9.4M SARS-CoV-2 samples).

## Data flow per domain

Each layer is thin and follows the same shape:

`lib/endpoints.ts` (URL builders) → `services/lapisService.ts` (transport) → `components/modules/<feature>/hooks/use*.ts` (TanStack Query) → components

- **`src/lib/endpoints.ts`** — single source of truth for every endpoint, as path-builder functions (`endpoints.lapis.aggregated(params)` etc.; arrays become repeated query keys = LAPIS OR). Add new endpoints here, never inline URLs.
- **`src/services/lapisService.ts`** — async functions over the endpoints (plain `fetch`; axios is not a dependency). Throws on non-2xx or a missing `data` array. Pure transport; no React — the worker imports it too.
- **Feature hooks** (e.g. `explorer/hooks/useAggregated.ts`) — wrap services in `useQuery` with `queryKey: [name, params]`, pass TanStack's `signal`, and use `placeholderData: keepPreviousData` so charts morph instead of flashing skeletons. Read-only API, so there are no mutations. Cross-cutting hooks (`useCrossfilter`, `useVirtualRows`, `usePrefersReducedMotion`) live in `src/hooks/`.
- **Errors** — components render loading / error / empty states in-card (`NoDataAvailable`, `custom-skeletons`). Failed queries are reported to Sentry once, centrally, by `QueryCache.onError` in `main.tsx` — don't capture them again in hooks.

**To add a backend-connected feature:** add the endpoint to `endpoints.ts`, a transport fn to `lapisService.ts`, a query hook in the feature's `hooks/`, then consume the hook in the component. Add an MSW handler + fixture in `tests/integration/` for it.

## Web Worker (crossfilter)

LAPIS aggregates server-side, so the worker handles **client-side cross-filtering of a large downloaded `/sample/details` slice** (up to `SLICE_TARGET` = 2M rows, `sliceConfig.ts`), kept off the main thread. There is one worker, no pool.

- `src/workers/crossfilter.engine.ts` — `createCrossfilterEngine(post)`: all the logic, state in a closure. Pages the slice in itself (`fetch`, 50k rows/page, cancels superseded loops via a token + `AbortController`), recomputes matches + crossfilter facet counts (`query`; each facet ignores its own selection), returns only visible rows (`window`), and builds CSV exports (`export`). Unit-tested directly.
- `src/workers/crossfilter.worker.ts` — thin adapter wiring the engine to `onmessage`/`postMessage`.
- `src/workers/crossfilter.types.ts` — the dependency-free message protocol shared by both threads.
- `src/hooks/useCrossfilter.ts` — owns the worker lifecycle (`new Worker(new URL('../workers/crossfilter.worker.ts', import.meta.url))` — relative path; Rspack's worker resolution ignores the `@/` alias), the client filter, windowed row access (`ensureWindow`/`getRow`), Sentry error capture and the `crossfilter.slice-fetch` span.
- Alternate ingestion kept but unwired: `explorer/hooks/useSampleSliceInfinite.ts` (main-thread `useInfiniteQuery`, would feed the worker via `{ type: 'load' }`).

## Routing

`src/router/AppRouter.tsx` — all paths come from `src/router/routes.ts`. Route views are `React.lazy` chunks rendered under `<Suspense fallback={<RouteFallback/>}>` in `DashboardLayout`. The router is built with `createAppRouter` (Sentry-wrapped `createBrowserRouter`), and a pathless child route with `errorElement: <RouteError/>` keeps the nav alive when a page crashes.

## State

- Server state → TanStack Query.
- Client/global state → zustand stores in `src/store` (e.g. explorer filter state).
- `main.tsx` shows the full provider nesting (theme → query client → `App` → router) and starts Sentry (`initObservability()`) before the first render. See `src/lib/observability.ts`.

## Components

- `src/components/ui/` — shadcn/ui primitives. Add shadcn components here.
- `src/components/modules/` — feature areas (bulk of feature work). Each folder is a feature to visualize and explain; endpoint-specific types and helpers live in it.
  - `explorer/` — general-purpose dashboard (the reusable engine).
  - `case-study/` — scrollytelling story (`story.ts` is the data-driven script), reusing explorer components with preset params.
  - `insights/` — static technical teardown (prose, `snippets.ts` code excerpts, diagrams).
- `src/components/layouts/` — app shell (sticky nav, mobile `Sheet` drawer, theme toggle, `RouteFallback`, `RouteError`).

## Types

`src/types/lapis.ts` — hand-written LAPIS response shapes (not generated). Keep them in sync with what the API returns.
