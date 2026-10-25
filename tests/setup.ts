import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { useExplorerStore } from '@/store/explorerStore';
import {
  InlineWorker,
  IntersectionObserverStub,
  matchMediaStub,
  ResizeObserverStub,
} from '@tests/integration/browser-stubs';
import { server } from '@tests/integration/server';

beforeAll(() => {
  vi.stubGlobal('matchMedia', vi.fn(matchMediaStub));
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  vi.stubGlobal('Worker', InlineWorker);
  // jsdom has no canvas backend; components must cope with a null context.
  HTMLCanvasElement.prototype.getContext = () => null;
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useExplorerStore.getState().reset();
  localStorage.clear();
  document.documentElement.className = '';
  IntersectionObserverStub.instances = [];
  InlineWorker.instances = [];
});

afterAll(() => {
  server.close();
});
