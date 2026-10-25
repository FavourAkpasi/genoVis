import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { LineageOverTime } from '@/components/modules/explorer/components/lineage-over-time';
import * as svgExport from '@/lib/svg-export';
import { failingHandlers, LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

describe('LineageOverTime', () => {
  it('renders a legend of the top lineages plus a disabled "Other" bucket', async () => {
    renderWithProviders(<LineageOverTime />);
    expect(await screen.findByRole('button', { name: 'JN.1' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'BA.2' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Other' })).toBeDisabled();
  });

  it('dims the other series when a lineage is active and reports legend clicks', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(<LineageOverTime activeLineage="JN.1" onSelectLineage={onSelect} />);

    expect(await screen.findByRole('button', { name: 'JN.1', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'BA.2' })).toHaveClass('opacity-40');

    await user.click(screen.getByRole('button', { name: 'BA.2' }));
    expect(onSelect).toHaveBeenCalledWith('BA.2');
  });

  it('shows per-lineage shares for the hovered day', async () => {
    renderWithProviders(<LineageOverTime />);
    const chart = await screen.findByRole('img');
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 800 } as DOMRect);
    const overlay = chart.querySelector('rect') as SVGRectElement;

    fireEvent.mouseMove(overlay, { clientX: 0 });
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    fireEvent.mouseLeave(overlay);
    expect(screen.queryByText('Jan 1, 2024')).not.toBeInTheDocument();
  });

  it('exports the chart as a PNG', async () => {
    const exportPng = vi.spyOn(svgExport, 'exportSvgToPng').mockResolvedValue();
    const { user } = renderWithProviders(<LineageOverTime />);
    await screen.findByRole('img');
    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Download PNG' }));
    expect(exportPng).toHaveBeenCalledWith(expect.any(SVGSVGElement), 'lineage-prevalence.png');
    exportPng.mockRestore();
  });

  it('needs at least two dates to plot a trend', async () => {
    server.use(
      http.get(`${LAPIS}/sample/aggregated`, () =>
        HttpResponse.json({ data: [{ date: '2024-01-01', pangoLineage: 'JN.1', count: 1 }] })
      )
    );
    renderWithProviders(<LineageOverTime />);
    expect(await screen.findByText('Not enough dated samples to plot a trend.')).toBeInTheDocument();
  });

  it('shows the error message when the request fails', async () => {
    server.use(...failingHandlers);
    renderWithProviders(<LineageOverTime />);
    expect(await screen.findByText(/Couldn't load lineages/)).toBeInTheDocument();
  });
});
