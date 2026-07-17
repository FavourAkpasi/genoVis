# Project Breakdown: GenoVis Dashboard

GenoVis is a high-performance visual data science dashboard that handles, processes, and renders massive genomic mutation datasets seamlessly. The architecture is explicitly decoupled to keep the main thread free, ensuring a smooth user experience even over millions of records.

Built as a showcase for the **datavisyn Senior Frontend Software Engineer (React + TypeScript)** role, it targets the capabilities that job prizes: virtualization, off-main-thread processing, high-density visualization, and modern tooling (Rspack, oxlint, Playwright).

## 🛠️ Core Tech Stack

- **Frontend Library:** React 19 / TypeScript
- **Design System:** shadcn/ui (Tailwind CSS v4 + Base UI primitives)
- **Build Tool:** Rspack (Rust-powered, high-speed webpack replacement)
- **Server state / caching:** TanStack Query
- **Client/global state:** Zustand
- **Performance:** Web Workers API, HTML5 Canvas API, custom DOM virtualization
- **Linting:** oxlint · **Testing:** Vitest (unit/integration) + Playwright (E2E)
- **Data source:** [cov-spectrum LAPIS v2](https://lapis.cov-spectrum.org/open/v2) — open, no-auth, ~9.4M SARS-CoV-2 samples (GenSpectrum). See the LAPIS reference in project memory for confirmed endpoint shapes.

---

## 🧭 Product Shape: Explorer → Case Study

Two surfaces built from the **same reusable components**:

- **Explorer (the engine):** a general-purpose dashboard where the user freely picks lineage / region / date range and sees the data respond across every view. Proves general engineering capability at scale.
- **Case Study (the showpiece):** a curated, opinionated story (e.g. "how did the JN.1 lineage's mutations spread across regions and time?") that drives the explorer components with preset state and annotation, and can deep-link back into the Explorer. Proves product thinking and visual storytelling.

Design principle: **explorer = the engine, case study = the showpiece.** Build the explorer's components as reusable and parameterized first; the case study is layout + annotation + preset state on top.

---

## 🎯 Feature Implementations & Technical Benchmarks

### 1. Data Ingestion & Caching

- **The Goal:** A clean, typed data-access layer over the open LAPIS endpoints with robust loading/error handling and no redundant network requests during filtering.
- **Implementation:** `lib/endpoints.ts` (URL builders) → `services/lapisService.ts` (transport) → **TanStack Query** hooks (`useAggregated`, `useMutations`, `useSamples`). TanStack Query owns caching, dedup, and invalidation; the value here is a well-structured, testable data layer rather than a hand-rolled cache.

### 2. Background Processing (Web Workers)

- **The Goal:** Keep heavy interactive work off the UI main thread.
- **Implementation:** LAPIS already aggregates server-side, so the Worker earns its place doing **client-side cross-filtering and re-aggregation of a downloaded `/sample/details` slice**. Download one large slice once, then as the user brushes/filters, the Worker recomputes groupings and mutation frequencies via `postMessage()` — no network round-trip per interaction — and returns only the aggregated result.

### 3. DOM Virtualization (Sample Data Table)

- **The Goal:** Render tens of thousands of per-sample records without crashing the DOM.
- **Implementation:** A custom virtualized table with fixed row heights over `/sample/details` (the ~9.4M-sample source). Only the 20–30 rows in the viewport mount; text nodes swap as the user scrolls. **Note:** the big-data table is fed by *samples*, not mutations (mutations-per-lineage is only ~900 rows — see the scatter below).

### 4. High-Performance Graphics (Mutation Scatter Plot)

- **The Goal:** Render a dense, interactive scatter of genomic variants without SVG-node lag.
- **Implementation:** HTML5 Canvas. Plots amino-acid mutations as `position` (X) × `proportion` (Y), colored by gene (`sequenceName`), drawing pixels onto a single context for smooth 60 FPS interaction (hover, zoom).

### 5. Production & Observability Pipeline (maturity layer)

- **Containerization:** Multi-stage `Dockerfile` building via Node and serving optimized static assets from an Nginx alpine image.
- **CI/CD:** GitHub Actions on pull requests — type-check, `oxlint`, Vitest, and Playwright E2E.
- **Error Tracking:** Sentry for unhandled client-side runtime errors and Web Worker task timing.

### 6. Suggestions

- **Improvements:** Features here are suggestions. The goal is efficient data handling, visualization, and a seamless, performant UX that prioritizes performance without sacrificing creativity and visual storytelling — suggest improvements where they fit.
