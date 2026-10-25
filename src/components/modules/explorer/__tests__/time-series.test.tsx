import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { TimeSeries } from '@/components/modules/explorer/components/time-series';
import * as svgExport from '@/lib/svg-export';
import { failingHandlers, LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

describe('TimeSeries', () => {
  it('summarizes the series and labels the chart for assistive tech', async () => {
    renderWithProviders(<TimeSeries />);
    expect(await screen.findByText('3 days · peak 30 on Jan 2, 2024')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/from Jan 1, 2024 to Jan 3, 2024, peaking at 30/);
  });

  it('shows a tooltip for the nearest day on hover and hides it on leave', async () => {
    renderWithProviders(<TimeSeries />);
    const chart = await screen.findByRole('img');
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 800 } as DOMRect);
    const overlay = chart.querySelector('rect') as SVGRectElement;

    fireEvent.mouseMove(overlay, { clientX: 799 });
    expect(screen.getByText('Jan 3, 2024')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    fireEvent.mouseLeave(overlay);
    expect(screen.queryByText('Jan 3, 2024')).not.toBeInTheDocument();
  });

  it('exports the chart as a PNG', async () => {
    const exportPng = vi.spyOn(svgExport, 'exportSvgToPng').mockResolvedValue();
    const { user } = renderWithProviders(<TimeSeries />);
    await screen.findByRole('img');
    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Download PNG' }));
    expect(exportPng).toHaveBeenCalledWith(expect.any(SVGSVGElement), 'samples-over-time.png');
    exportPng.mockRestore();
  });

  it('shows an empty state when no dated samples match', async () => {
    server.use(http.get(`${LAPIS}/sample/aggregated`, () => HttpResponse.json({ data: [{ date: null, count: 3 }] })));
    renderWithProviders(<TimeSeries />);
    expect(await screen.findByText('No samples match these filters.')).toBeInTheDocument();
  });

  it('shows the error message when the request fails', async () => {
    server.use(...failingHandlers);
    renderWithProviders(<TimeSeries />);
    expect(await screen.findByText(/Couldn't load samples/)).toBeInTheDocument();
  });
});
