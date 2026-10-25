import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SLICE_PAGE_SIZE, SLICE_TARGET } from '@/components/modules/explorer/sliceConfig';
import * as csv from '@/lib/csv';
import * as observability from '@/lib/observability';
import { EXPORT_LIMIT, useCrossfilter } from '@/hooks/useCrossfilter';
import { InlineWorker } from '@tests/integration/browser-stubs';

const renderCrossfilter = (params = {}) =>
  renderHook(({ value }) => useCrossfilter(value), { initialProps: { value: params } });

describe('useCrossfilter', () => {
  it('starts a paged fetch and exposes the worker state', async () => {
    const { result } = renderCrossfilter({ country: 'Germany' });

    expect(result.current.hasState).toBe(false);
    expect(InlineWorker.latest().sent[0]).toEqual({
      type: 'fetch',
      params: { country: 'Germany' },
      target: SLICE_TARGET,
      pageSize: SLICE_PAGE_SIZE,
    });

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current).toMatchObject({ matched: 4, loaded: 4, hasState: true, error: null });
    expect(result.current.facets?.country[0]).toEqual({ value: 'Germany', count: 2 });
  });

  it('refetches only when the params actually change', async () => {
    const { rerender } = renderCrossfilter({ country: 'Germany' });
    rerender({ value: { country: 'Germany' } });
    rerender({ value: { country: 'USA' } });
    const fetches = InlineWorker.latest().sent.filter((message) => message.type === 'fetch');
    expect(fetches).toHaveLength(2);
  });

  it('dispatches search and facet toggles as client-side queries', async () => {
    const { result } = renderCrossfilter();
    await waitFor(() => expect(result.current.done).toBe(true));

    act(() => result.current.setSearch('germany'));
    await waitFor(() => expect(result.current.matched).toBe(2));
    expect(result.current.isActive).toBe(true);

    act(() => result.current.toggleFacet('pangoLineage', 'JN.1'));
    await waitFor(() => expect(result.current.matched).toBe(1));

    act(() => result.current.toggleFacet('pangoLineage', 'JN.1'));
    await waitFor(() => expect(result.current.matched).toBe(2));

    act(() => result.current.clear());
    await waitFor(() => expect(result.current.matched).toBe(4));
    expect(result.current.isActive).toBe(false);
  });

  it('fetches a padded window once and serves rows from it', async () => {
    const { result } = renderCrossfilter();
    await waitFor(() => expect(result.current.done).toBe(true));

    expect(result.current.getRow(0)).toBeUndefined();
    act(() => result.current.ensureWindow(0, 2));
    act(() => result.current.ensureWindow(0, 2)); // already pending → no duplicate request
    await waitFor(() => expect(result.current.getRow(0)?.genbankAccession).toBe('OQ000001'));

    act(() => result.current.ensureWindow(1, 2)); // covered by the loaded window
    const windows = InlineWorker.latest().sent.filter((message) => message.type === 'window');
    expect(windows).toEqual([{ type: 'window', start: 0, count: 42 }]);
    expect(result.current.getRow(99)).toBeUndefined();
  });

  it('downloads the CSV the worker builds', async () => {
    const download = vi.spyOn(csv, 'downloadCsv').mockImplementation(() => {});
    const { result } = renderCrossfilter();
    await waitFor(() => expect(result.current.done).toBe(true));

    act(() => result.current.exportCsv());
    expect(InlineWorker.latest().sent.at(-1)).toEqual({ type: 'export', limit: EXPORT_LIMIT });
    await waitFor(() =>
      expect(download).toHaveBeenCalledWith('genovis-samples.csv', expect.stringContaining('OQ000001'))
    );
    download.mockRestore();
  });

  it('surfaces worker errors and terminates the worker on unmount', async () => {
    const { result, unmount } = renderCrossfilter();
    const worker = InlineWorker.latest();
    act(() => worker.onmessage?.({ data: { type: 'error', message: 'nope' } } as MessageEvent));
    expect(result.current.error).toBe('nope');

    unmount();
    expect(worker.terminated).toBe(true);
  });

  it('reports an uncaught worker crash instead of waiting forever', () => {
    const capture = vi.spyOn(observability, 'captureError').mockImplementation(() => {});
    const { result } = renderCrossfilter();
    const worker = InlineWorker.latest() as unknown as { onerror: (event: Partial<ErrorEvent>) => void };

    act(() => worker.onerror({ message: 'Script error' }));
    expect(result.current.error).toBe('Script error');
    expect(capture).toHaveBeenCalledWith(expect.any(Error), { tags: { source: 'crossfilter-worker' } });
    capture.mockRestore();
  });

  it('times each slice fetch as a span, ending it when the slice is complete', async () => {
    const span = { setAttribute: vi.fn(), setStatus: vi.fn(), end: vi.fn() };
    const start = vi
      .spyOn(observability, 'startSpan')
      .mockReturnValue(span as unknown as ReturnType<typeof observability.startSpan>);
    const { result } = renderCrossfilter();

    await waitFor(() => expect(result.current.done).toBe(true));
    expect(start).toHaveBeenCalledWith('crossfilter.slice-fetch', 'worker.fetch', { 'rows.target': SLICE_TARGET });
    expect(span.setAttribute).toHaveBeenCalledWith('rows.loaded', 4);
    expect(span.end).toHaveBeenCalledTimes(1);
    start.mockRestore();
  });

  it('marks the span failed when the fetch errors', () => {
    const span = { setAttribute: vi.fn(), setStatus: vi.fn(), end: vi.fn() };
    const start = vi
      .spyOn(observability, 'startSpan')
      .mockReturnValue(span as unknown as ReturnType<typeof observability.startSpan>);
    const capture = vi.spyOn(observability, 'captureError').mockImplementation(() => {});
    renderCrossfilter();

    act(() => InlineWorker.latest().onmessage?.({ data: { type: 'error', message: 'LAPIS down' } } as MessageEvent));
    expect(span.setStatus).toHaveBeenCalledWith({ code: 2, message: 'internal_error' });
    expect(capture).toHaveBeenCalledWith(new Error('LAPIS down'), { tags: { source: 'crossfilter-worker' } });
    start.mockRestore();
    capture.mockRestore();
  });
});
