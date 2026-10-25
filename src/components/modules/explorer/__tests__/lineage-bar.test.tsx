import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { LineageBar } from '@/components/modules/explorer/components/lineage-bar';
import * as csv from '@/lib/csv';
import { failingHandlers, LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

describe('LineageBar', () => {
  it('ranks lineages by count with share and count labels', async () => {
    renderWithProviders(<LineageBar />);
    const bars = await screen.findAllByRole('button', { pressed: false });
    expect(bars.map((bar) => within(bar).getByText(/^[A-Z]/).textContent)).toEqual(['JN.1', 'BA.2', 'XBB.1.5']);
    expect(screen.getByText('50% · 500')).toBeInTheDocument();
  });

  it('reports the clicked lineage and highlights the active one', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(<LineageBar activeLineage="BA.2" onSelectLineage={onSelect} />);

    const active = await screen.findByRole('button', { pressed: true });
    expect(active).toHaveTextContent('BA.2');
    expect(screen.getByRole('button', { name: /JN\.1/ })).toHaveClass('opacity-40');

    await user.click(screen.getByRole('button', { name: /XBB\.1\.5/ }));
    expect(onSelect).toHaveBeenCalledWith('XBB.1.5');
  });

  it('exports the full ranking as CSV', async () => {
    const download = vi.spyOn(csv, 'downloadCsv').mockImplementation(() => {});
    const { user } = renderWithProviders(<LineageBar />);
    await user.click(await screen.findByRole('button', { name: 'Export' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Download CSV' }));

    expect(download).toHaveBeenCalledWith('genovis-lineages.csv', expect.stringContaining('JN.1,500,0.5'));
    download.mockRestore();
  });

  it('shows an empty state when no lineages match', async () => {
    server.use(http.get(`${LAPIS}/sample/aggregated`, () => HttpResponse.json({ data: [] })));
    renderWithProviders(<LineageBar />);
    expect(await screen.findByText('No lineages match these filters.')).toBeInTheDocument();
  });

  it('shows the error message when the request fails', async () => {
    server.use(...failingHandlers);
    renderWithProviders(<LineageBar />);
    expect(await screen.findByText(/Couldn't load lineages: LAPIS request failed: 500/)).toBeInTheDocument();
  });
});
