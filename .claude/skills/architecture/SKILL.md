---
name: architecture
description: How the genovis frontend is wired — data flow (endpoints → services → hooks → components), workers, routing, and state. Use when adding a backend/api-connected feature, a new endpoint, or answering "how does X work" about routing/state.
---

# genovis frontend architecture

React 19 + TypeScript + Rspack SPA — a visual data science dashboard. Data comes from open, publicly available endpoints (primary source: cov-spectrum LAPIS v2, ~9.4M SARS-CoV-2 samples).

## Data flow per domain

Each layer is thin and follows the same shape:

`lib/endpoints.ts` (URL builders) → `services/*Service.ts` (transport) → `hooks/use*.tsx` (TanStack Query) → components

- **`src/lib/endpoints.ts`** — single source of truth for every endpoint, as string constants or path-builder functions. Add new endpoints here, never inline URLs.
- **`src/services/*Service.ts`** — each exports async functions that call the endpoints (plain `fetch`; axios is not a dependency). Pure transport; no React.
- **`src/hooks/use*.tsx`** — wrap services in `useQuery`/`useMutation`. Mutations invalidate query keys, `toast` on success, and route errors through `handleError` from `@/lib/utils`. Component-facing state and query keys live here.

**To add a backend-connected feature:** add the endpoint to `endpoints.ts`, a transport fn to the relevant `*Service.ts`, a query/mutation hook in `use*.tsx`, then consume the hook in the component.

## Web Workers

LAPIS aggregates server-side, so workers handle **client-side cross-filtering and re-aggregation of a downloaded data slice** (kept off the main thread).

- `src/workers/genomic.worker.ts` — receives a raw slice + filter via `postMessage`, returns aggregated results.
- `src/workers/worker-pool.ts` — initializes and communicates with workers.

## Routing

`src/router/AppRouter.tsx` — all paths come from `src/router/routes.ts`.

## State

- Server state → TanStack Query.
- Client/global state → zustand stores in `src/store` (e.g. explorer filter state).
- `App.tsx` shows the full provider nesting (theme, query client, router, analytics).

## Components

- `src/components/ui/` — shadcn/ui primitives. Add shadcn components here.
- `src/components/modules/` — feature areas (bulk of feature work). Each folder is a feature to visualize and explain; endpoint-specific types and helpers live in it.
  - `explorer/` — general-purpose dashboard (the reusable engine).
  - `case-study/` — curated focused story, reusing explorer components.
- `src/components/layouts/` — app shells (dashboard, drawer).

## Generated types — do not hand-edit

`src/types/*.ts` — endpoint-specific / generated types.
