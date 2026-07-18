import { useCallback, useEffect, useRef, useState } from 'react';

import { SLICE_PAGE_SIZE, SLICE_TARGET } from '@/components/modules/explorer/sliceConfig';
import type { QueryParamsT } from '@/lib/endpoints';
import type { DetailRowT } from '@/types/lapis';
import {
  type CrossfilterFilterT,
  type CrossfilterMessageT,
  type CrossfilterStateT,
  EMPTY_FILTER,
  type FacetKeyT,
} from '@/workers/crossfilter.types';

/** Rows requested around the visible range so small scrolls don't re-hit the worker. */
const WINDOW_PAD = 40;

interface WindowDataT {
  start: number;
  rows: DetailRowT[];
}

/**
 * Drives the crossfilter Web Worker that owns the large sample slice.
 *
 * The worker fetches + holds all rows off the main thread; this hook only:
 *  - kicks off the paged fetch whenever the server filters change,
 *  - dispatches the client-side filter on every keystroke/toggle,
 *  - and pulls the *visible window* of rows on demand (never the whole slice).
 *
 * To switch to the alternate TanStack ingestion path, stop sending `fetch` here
 * and feed `useSampleSliceInfinite`'s pages into the worker via `{ type: 'load' }`.
 */
export const useCrossfilter = (params: QueryParamsT) => {
  const paramsKey = JSON.stringify(params);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const workerRef = useRef<Worker | null>(null);
  const windowRef = useRef<WindowDataT | null>(null);
  const pendingRef = useRef<{ start: number; end: number } | null>(null);

  const [state, setState] = useState<CrossfilterStateT | null>(null);
  const [windowData, setWindowData] = useState<WindowDataT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CrossfilterFilterT>(EMPTY_FILTER);
  // Bumped on every state message so the table re-requests its window against the new result.
  const [version, setVersion] = useState(0);

  // Worker lifecycle: create once, terminate on unmount (imperative — needs an effect).
  useEffect(() => {
    const worker = new Worker(new URL('../workers/crossfilter.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as CrossfilterMessageT;
      if (message.type === 'state') {
        setState(message.state);
        // The prior window indexes into the old result — drop it and re-request.
        windowRef.current = null;
        pendingRef.current = null;
        setWindowData(null);
        setVersion((value) => value + 1);
        return;
      }
      if (message.type === 'window') {
        const next = { start: message.start, rows: message.rows };
        windowRef.current = next;
        pendingRef.current = null;
        setWindowData(next);
        return;
      }
      setError(message.message);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // (Re)start the paged fetch whenever the server-side filters change.
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    setState(null);
    setError(null);
    windowRef.current = null;
    pendingRef.current = null;
    setWindowData(null);
    worker.postMessage({ type: 'fetch', params: paramsRef.current, target: SLICE_TARGET, pageSize: SLICE_PAGE_SIZE });
  }, [paramsKey]);

  // Dispatch the client-side filter on change.
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'query', filter });
  }, [filter]);

  const setSearch = (search: string) => setFilter((prev) => ({ ...prev, search }));

  const toggleFacet = (key: FacetKeyT, value: string) =>
    setFilter((prev) => {
      const selected = prev.facets[key];
      const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
      return { ...prev, facets: { ...prev.facets, [key]: next } };
    });

  const clear = () => setFilter(EMPTY_FILTER);

  /** Ask the worker for rows covering [first, last] if the current window doesn't already. */
  const ensureWindow = useCallback((first: number, last: number) => {
    const worker = workerRef.current;
    if (!worker) return;

    const loaded = windowRef.current;
    if (loaded && first >= loaded.start && last < loaded.start + loaded.rows.length) return;

    const desiredStart = Math.max(0, first - WINDOW_PAD);
    const desiredEnd = last + WINDOW_PAD;
    const pending = pendingRef.current;
    if (pending && desiredStart >= pending.start && desiredEnd <= pending.end) return;

    pendingRef.current = { start: desiredStart, end: desiredEnd };
    worker.postMessage({ type: 'window', start: desiredStart, count: desiredEnd - desiredStart });
  }, []);

  const getRow = (index: number): DetailRowT | undefined => {
    if (!windowData) return undefined;
    if (index < windowData.start || index >= windowData.start + windowData.rows.length) return undefined;
    return windowData.rows[index - windowData.start];
  };

  const isActive =
    filter.search.trim() !== '' ||
    filter.facets.pangoLineage.length > 0 ||
    filter.facets.country.length > 0 ||
    filter.facets.host.length > 0;

  return {
    filter,
    isActive,
    matched: state?.matched ?? 0,
    loaded: state?.loaded ?? 0,
    done: state?.done ?? false,
    facets: state?.facets ?? null,
    hasState: state !== null,
    error,
    version,
    setSearch,
    toggleFacet,
    clear,
    ensureWindow,
    getRow,
  };
};
