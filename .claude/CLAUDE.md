# CLAUDE.md

## Commands

```bash
npm run dev        # Rspack dev server on http://localhost:5173 (HMR + React Refresh)
npm run build      # tsc -b && rspack build → dist/
npm run lint       # oxlint (config in .oxlintrc.json)
npm run format     # Prettier write
npm run typecheck  # tsc -b — checks the app, node (configs) and test projects
npm run test       # vitest run (jsdom; config in vitest.config.ts)
npm run test:watch # vitest (watch mode)
npm run test:coverage # vitest run --coverage (v8; fails below the thresholds)
npm run analyze    # RSDOCTOR=true rspack build → interactive bundle report
```

Run a single test file or filter:

```bash
npx vitest run src/path/to/__tests__/File.test.ts
npx vitest run -t "test name"
```

**Build tooling:** app is built/served by **Rspack** (`rspack.config.ts`) — `builtin:swc-loader` for TS/TSX, Tailwind v4 via `@tailwindcss/postcss` + `postcss-loader` on Rspack native CSS, `@`→`src` / `@tests`→`tests` aliases, SPA `historyApiFallback`. Lint is **oxlint**. Tests run on **Vitest** (jsdom, `vitest.config.ts`, no globals — import `describe/it/expect` from `vitest`); tests live in `src/**/__tests__/*.test.{ts,tsx}`. Bundle analysis via **Rsdoctor** (`npm run analyze`, gated behind the `RSDOCTOR` env flag in `rspack.config.ts`).

**TypeScript projects:** `tsconfig.app.json` (src, excludes `__tests__`), `tsconfig.node.json` (rspack/vitest configs), `tsconfig.test.json` (tests + `tests/`, adds `@tests/*`). The root `tsconfig.json` only references them — always run `tsc -b`, never `tsc --noEmit` on the root (it has `files: []` and checks nothing).

Requires Node >= 22. `.env` is optional: `rspack.config.ts` loads it with `process.loadEnvFile()`; copy `.env.example` only to enable Sentry. **Playwright/E2E is intentionally out of scope** — unit + integration tests only.

## Observability (Sentry)

- All SDK use goes through `src/lib/observability.ts` (`initObservability`, `captureError`, `startSpan`/`failSpan`, `createAppRouter`, `rootErrorOptions`). Don't import `@sentry/react` elsewhere.
- Disabled unless `PUBLIC_SENTRY_DSN` is set at build time. `PUBLIC_*` values are inlined by `DefinePlugin` in `rspack.config.ts` (typed in `src/rspack-env.d.ts`) — they are public; secrets (`SENTRY_AUTH_TOKEN`) are only read by the build.
- Source maps: production builds with `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` emit `hidden-source-map`, upload via `@sentry/webpack-plugin` (works with Rspack), then delete the `.map` files from `dist/`.
- Captured today: React 19 root errors, route errors (`RouteError` as `errorElement`), every failed TanStack query (`QueryCache.onError`), worker fetch errors + uncaught worker crashes. Spans: React Router navigations + one `crossfilter.slice-fetch` span per worker slice fetch. Replay: error-only, lazy-loaded from the Sentry CDN.
- `tracePropagationTargets` is same-origin only — never add LAPIS to it (custom headers turn its GETs into CORS preflights).
- The worker bundle must stay Sentry-free; report worker problems from `useCrossfilter` on the main thread.

## Path aliases

- `@/` → `src/`
- `@tests/` → `tests/`

## Rules

- **Endpoints**: add all new API endpoints to `src/lib/endpoints.ts` only — never inline URLs elsewhere.
- **Classnames**: always use `cn()` from `@/lib/utils` — never template-literal string concatenation.
- **UI primitives**: built on `@base-ui/react` (NOT Radix). shadcn's `base-luma` style **serves Base UI components** — add them with `npx shadcn add <name>` (card, dropdown-menu, popover, calendar, combobox, dialog, table, tabs, tooltip, sheet, command, …); do NOT hand-build what the registry provides. Icons: `@tabler/icons-react`. Calendar is `react-day-picker`. Wrappers that add real logic get a `custom-` prefix (e.g. `custom-select.tsx` on `combobox`, `custom-date-range-picker.tsx` on `popover`+`calendar`); thin passthroughs keep standard shadcn names. All in `src/components/ui/`.
- **No nested ternaries**: never nest a ternary inside another ternary's branches. Use early returns or extract a named helper.
- **Imports**: external packages first, a blank line, then `@/…` (then `@tests/…`) imports, alphabetized. Not enforced by tooling — no import-sort rule is configured in oxlint or Prettier.
- **Unused vars**: prefix with `_` to suppress the lint error.
- **Prettier**: single quotes, semicolons, 120 print width, 2-space indent, trailing commas `es5`.
- **React hook form**: rely on the react-hook-form library for form manipulation and state (not installed yet — add it with the first real submit form; the FilterBar is live controls bound to zustand, not a form). Avoid useEffects except when absolutely necessary.
- **Functions and components names/ declarations**: prefer arrow functions and type declared above the function if minimal in an interface with a 'T' at the end eg GeneratedUserT

## Testing

- Wrap renders with `renderWithProviders` from `@tests/integration/utils` (theme + fresh no-retry `QueryClient` + `MemoryRouter`; pass `{ route }`; returns a `user` from `userEvent.setup()`). For `renderHook` with queries use `createQueryWrapper()`.
- Mock APIs via MSW handlers in `tests/integration/handlers.ts` (fixtures in `tests/integration/fixtures.ts`); override per-test with `server.use(...)`; `failingHandlers` makes every LAPIS call 500. Unhandled requests fail the test.
- `tests/setup.ts` installs jest-dom matchers and the stubs in `tests/integration/browser-stubs.ts`: `matchMedia`, `ResizeObserver`, a controllable `IntersectionObserverStub` (`IntersectionObserverStub.intersect(el)`), a null canvas context, and `InlineWorker` — a `Worker` that runs the **real** crossfilter engine in-process (`InlineWorker.latest().sent` shows posted messages). It also resets the zustand store, localStorage and `<html>` classes after each test.
- The worker logic lives in `src/workers/crossfilter.engine.ts` (`createCrossfilterEngine(post)`, closure state) so it can be unit-tested directly; `crossfilter.worker.ts` is only the `onmessage`/`postMessage` adapter.
- Selector priority: `data-testid` > `getByRole` / `getByLabelText` > text.
- Use `userEvent` over `fireEvent` — exception: coordinate-based hover on SVG/canvas charts (`fireEvent.mouseMove(el, { clientX })`).
- Coverage thresholds (enforced in `vitest.config.ts`): statements 45 / branches 75 / functions 55 / lines 45. `coverage/` is git-ignored.

## CI

`.github/workflows/ci.yml` — on PRs and pushes to `main`: typecheck, lint, `test:coverage`. On PRs it also runs the target branch's coverage as a baseline, and a separate `report` job (the only one with `pull-requests: write`, never runs `npm ci`) posts a coverage comment with the delta via `davelosert/vitest-coverage-report-action` (needs the `json-summary` reporter + `reportOnFailure` in `vitest.config.ts`). Actions are pinned to commit SHAs — bump the SHA and the `# vX` comment together.
