# CLAUDE.md

## Commands

```bash
npm run dev        # Rspack dev server on http://localhost:5173 (HMR + React Refresh)
npm run build      # tsc -b && rspack build → dist/
npm run lint       # oxlint (config in .oxlintrc.json)
npm run format     # Prettier write
npm run typecheck  # tsc --noEmit
```

Run a single test file or filter (once Vitest scripts are added):

```bash
npx vitest run src/path/to/__tests__/File.test.tsx
npx vitest run -t "test name"
```

**Build tooling:** app is built/served by **Rspack** (`rspack.config.ts`) — `builtin:swc-loader` for TS/TSX, Tailwind v4 via `@tailwindcss/postcss` + `postcss-loader` on Rspack native CSS, `@`→`src` / `@tests`→`tests` aliases, SPA `historyApiFallback`. Lint is **oxlint**. `vite` stays installed only as Vitest's engine for the coming test phase.

Still to land: **Playwright** (E2E) + `test:integration*` Vitest scripts. Update this section as each lands. Requires Node >= 22. Copy `.env.example` to `.env` before running.

## Path aliases

- `@/` → `src/`
- `@tests/` → `tests/`

## Rules

- **Endpoints**: add all new API endpoints to `src/lib/endpoints.ts` only — never inline URLs elsewhere.
- **Classnames**: always use `cn()` from `@/lib/utils` — never template-literal string concatenation.
- **No nested ternaries**: never nest a ternary inside another ternary's branches. Use early returns or extract a named helper.
- **Imports**: auto-sorted by `simple-import-sort` (Lint error if unsorted). Fix with `npm run format:write`.
- **Unused vars**: prefix with `_` to suppress the lint error.
- **Prettier**: single quotes, semicolons, 120 print width, 2-space indent, trailing commas `es5`.
- **React hook form**: rely on the react-hook-form library for form manipulation and state. Avoid useEffects except when absolutely necessary.
- **Functions and components names/ declarations**: prefer arrow functions and type declared above the function if minimal in an interface with a 'T' at the end eg GeneratedUserT

## Testing

- Wrap renders with `renderWithProviders` from `@tests/integration/utils`.
- Mock APIs via MSW handlers in `tests/integration/handlers.ts`; override per-test with `server.use(...)`.
- Selector priority: `data-testid` > `getByRole` / `getByLabelText` > text.
- Use `userEvent` over `fireEvent`.
- Coverage thresholds: statements 45 / branches 75 / functions 55 / lines 45.
