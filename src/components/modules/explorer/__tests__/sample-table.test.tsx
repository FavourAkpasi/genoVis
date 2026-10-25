import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SampleTable } from '@/components/modules/explorer/components/sample-table';
import * as csv from '@/lib/csv';
import { InlineWorker } from '@tests/integration/browser-stubs';
import { LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

describe('SampleTable (with the real crossfilter engine in-process)', () => {
  it('streams the slice through the worker and renders the visible rows', async () => {
    renderWithProviders(<SampleTable />);

    expect(await screen.findByText('OQ000001')).toBeInTheDocument();
    expect(screen.getByText(/4 of 12,345 samples held in the worker/)).toBeInTheDocument();
    // null cells render as an em dash
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('refines the slice on the client without a new request', async () => {
    const { user } = renderWithProviders(<SampleTable />);
    await screen.findByText('OQ000001');

    await user.type(screen.getByRole('textbox', { name: 'Refine samples' }), 'brazil');
    expect(await screen.findByText('OQ000003')).toBeInTheDocument();
    expect(screen.queryByText('OQ000001')).not.toBeInTheDocument();
    expect(screen.getByText(/rows in this slice — filtered on the client/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Clear/ }));
    expect(await screen.findByText('OQ000001')).toBeInTheDocument();

    const fetches = InlineWorker.latest().sent.filter((message) => message.type === 'fetch');
    expect(fetches).toHaveLength(1);
  });

  it('toggles facet chips and shows an empty refinement state', async () => {
    const { user } = renderWithProviders(<SampleTable />);
    await screen.findByText('OQ000001');

    const usa = screen.getByRole('button', { name: /^USA/ });
    await user.click(usa);
    expect(await screen.findByText('OQ000002')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^USA/ })).toHaveAttribute('aria-pressed', 'true');

    await user.type(screen.getByRole('textbox', { name: 'Refine samples' }), 'zzz');
    expect(await screen.findByText('No rows in this slice match your refinement.')).toBeInTheDocument();
  });

  it('exports the current refinement as CSV', async () => {
    const download = vi.spyOn(csv, 'downloadCsv').mockImplementation(() => {});
    const { user } = renderWithProviders(<SampleTable />);
    await screen.findByText('OQ000001');

    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Download CSV (current filter)' }));
    await vi.waitFor(() => expect(download).toHaveBeenCalledWith('genovis-samples.csv', expect.any(String)));
    download.mockRestore();
  });

  it('shows progress while the slice is still streaming', async () => {
    renderWithProviders(<SampleTable />);
    const worker = InlineWorker.latest();
    // Swallow the engine's replies and drive the hook with a mid-stream state instead.
    worker.terminated = true;
    act(() =>
      worker.onmessage?.({
        data: {
          type: 'state',
          state: { matched: 1, loaded: 1, done: false, facets: { pangoLineage: [], country: [], host: [] } },
        },
      } as MessageEvent)
    );
    expect(await screen.findByText(/Streaming slice into the worker — 1 of/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('shows an empty state when the server slice is empty', async () => {
    server.use(http.get(`${LAPIS}/sample/details`, () => HttpResponse.json({ data: [] })));
    renderWithProviders(<SampleTable />);
    expect(await screen.findByText('No samples match these filters.')).toBeInTheDocument();
  });

  it('shows the error when the slice fails to load', async () => {
    server.use(http.get(`${LAPIS}/sample/details`, () => new HttpResponse(null, { status: 502, statusText: 'Bad' })));
    renderWithProviders(<SampleTable />);
    expect(await screen.findByText("Couldn't load samples: LAPIS request failed: 502 Bad")).toBeInTheDocument();
  });
});
