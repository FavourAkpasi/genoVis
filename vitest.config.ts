import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/types/**'],
      // json-summary + json feed the PR coverage comment in CI (.github/workflows/ci.yml).
      reporter: ['text-summary', 'text', 'html', 'json-summary', 'json'],
      // Still write the report when a test fails, so the PR comment shows what coverage looked like.
      reportOnFailure: true,
      thresholds: {
        statements: 45,
        branches: 75,
        functions: 55,
        lines: 45,
      },
    },
  },
});
