# Folder Structure: GenoVis

This structure isolates data access, heavy computation, and UI into clean boundaries so the codebase stays testable and modular — the architecture expected in a visual data science environment. It matches the `architecture` skill in `.claude/skills/architecture`.

```
genovis/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions: type-check, oxlint, Vitest, Playwright
├── docker/
│   └── nginx.conf               # Nginx production config
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                  # Global images, icons, fonts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (button, card, dialog, table…)
│   │   ├── layouts/             # App shells (dashboard, drawer)
│   │   └── modules/             # Feature areas — the bulk of feature work
│   │       ├── explorer/        # General-purpose dashboard (the engine)
│   │       │   ├── components/  # MutationScatter (Canvas) · SampleTable (virtualized) · FilterBar · TimeSeries
│   │       │   │   └── __tests__/
│   │       │   ├── hooks/       # useMutations · useSamples · useAggregated (TanStack Query)
│   │       │   │   └── __tests__/
│   │       │   ├── types/       # Explorer-specific TS interfaces
│   │       │   └── explorer-view.tsx
│   │       └── case-study/      # Curated JN.1 story — reuses explorer components
│   │           └── case-study-view.tsx
│   ├── hooks/                   # Global reusable hooks (useWorker, query wrappers)
│   ├── lib/
│   │   ├── endpoints.ts         # Single source of truth for all LAPIS endpoints
│   │   └── utils.ts             # cn() class merger, handleError
│   ├── services/                # Transport per source — lapisService.ts (fetch/TanStack)
│   ├── store/                   # Zustand stores (explorer filter state)
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   └── routes.ts            # All paths live here
│   ├── workers/                 # Off-main-thread processing
│   │   ├── genomic.worker.ts    # Client-side cross-filter + re-aggregation
│   │   └── worker-pool.ts       # Init + communicate with workers
│   ├── types/                   # Generated/shared endpoint types (do not hand-edit generated ones)
│   ├── styles/
│   │   └── globals.css          # Tailwind directives + shadcn CSS variables
│   ├── constants.ts             # Global constants
│   ├── App.tsx                  # Provider setup (theme, query client, router, analytics)
│   ├── main.tsx                 # DOM mount point
│   └── vite-env.d.ts / rspack.d.ts
├── tests/
│   └── integration/             # Vitest setup, MSW handlers, renderWithProviders
├── e2e/                         # Playwright specs
├── .gitignore
├── Dockerfile                   # Multi-stage production build
├── package.json
├── rspack.config.ts             # Rust-based build config
├── tailwind.config.ts           # Tailwind + shadcn design tokens
└── tsconfig.json                # Strict TS compiler rules
```
