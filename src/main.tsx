import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import './index.css';
import App from './App.tsx';
import { ThemeProvider } from '@/components/theme-provider.tsx';
import { captureError, initObservability, rootErrorOptions } from '@/lib/observability';

// Before anything renders, so startup errors are captured too.
initObservability();

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Every failed LAPIS request is reported once, tagged with the query that made it.
    onError: (error, query) =>
      captureError(error, {
        tags: { source: 'query', query: String(query.queryKey[0]) },
        extra: { queryKey: query.queryKey },
      }),
  }),
});

createRoot(document.getElementById('root')!, rootErrorOptions()).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
