// Stand-ins for browser APIs jsdom lacks. Installed globally in `tests/setup.ts`.

import { createCrossfilterEngine } from '@/workers/crossfilter.engine';
import type { CrossfilterRequestT } from '@/workers/crossfilter.types';

export const matchMediaStub = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

export class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** Records every instance so tests can simulate an element crossing the observed band. */
export class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = [];
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  readonly elements = new Set<Element>();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverStub.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
  }
  takeRecords() {
    return [];
  }

  /** Fire the callback as if `target` entered (or left) the observed area. */
  trigger(target: Element, isIntersecting = true) {
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }

  /** Trigger on whichever live observer is watching `target`. */
  static intersect(target: Element, isIntersecting = true) {
    for (const observer of IntersectionObserverStub.instances) {
      if (observer.elements.has(target)) observer.trigger(target, isIntersecting);
    }
  }
}

/**
 * A `Worker` that runs the real crossfilter engine in-process, replying asynchronously
 * like a real worker. Lets components using `useCrossfilter` be tested end-to-end
 * (engine fetches go through MSW like everything else).
 */
export class InlineWorker {
  static instances: InlineWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  readonly sent: CrossfilterRequestT[] = [];
  terminated = false;

  private readonly engine = createCrossfilterEngine((message) => {
    setTimeout(() => {
      if (!this.terminated) this.onmessage?.({ data: message } as MessageEvent);
    }, 0);
  });

  constructor() {
    InlineWorker.instances.push(this);
  }

  postMessage(message: CrossfilterRequestT) {
    this.sent.push(message);
    queueMicrotask(() => void this.engine.handle(message));
  }

  terminate() {
    this.terminated = true;
  }

  static latest() {
    return InlineWorker.instances[InlineWorker.instances.length - 1];
  }
}
