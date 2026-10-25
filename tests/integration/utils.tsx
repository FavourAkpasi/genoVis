import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '@/components/theme-provider';

interface RenderWithProvidersOptionsT extends Omit<RenderOptions, 'wrapper'> {
  /** Initial router location. */
  route?: string;
  /** Supply a client to inspect the cache; a fresh no-retry client is created otherwise. */
  queryClient?: QueryClient;
}

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });

/** Render with the same providers the app uses (theme, TanStack Query, router), plus a userEvent instance. */
export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', queryClient = createTestQueryClient(), ...options }: RenderWithProvidersOptionsT = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );

  return { user: userEvent.setup(), queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
};

/** Wrapper for `renderHook` calls that need TanStack Query. */
export const createQueryWrapper = (queryClient = createTestQueryClient()) => {
  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return QueryWrapper;
};
