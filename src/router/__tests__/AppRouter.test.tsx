import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@tests/integration/utils';

// The router is created at module load from window.location, so import it fresh per URL
// (and the theme provider with it, so both share one context instance).
const renderAppAt = async (path: string) => {
  window.history.pushState({}, '', path);
  const { AppRouter } = await import('@/router/AppRouter');
  const { ThemeProvider } = await import('@/components/theme-provider');
  render(
    <ThemeProvider>
      <QueryClientProvider client={createTestQueryClient()}>
        <AppRouter />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

beforeEach(() => {
  vi.resetModules();
});

describe('AppRouter', () => {
  it('lazy-loads the Explorer at /', async () => {
    await renderAppAt('/');
    expect(await screen.findByRole('heading', { name: 'Explorer' })).toBeInTheDocument();
  });

  it('lazy-loads the Insights teardown', async () => {
    await renderAppAt('/insights');
    expect(await screen.findByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
  });

  it('lazy-loads the Case Study', async () => {
    await renderAppAt('/case-study');
    expect(await screen.findByRole('list', { name: 'Story progress' })).toBeInTheDocument();
  });

  it('redirects unknown paths to the Explorer', async () => {
    await renderAppAt('/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'Explorer' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });
});
