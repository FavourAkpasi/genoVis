import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { KpiRow } from '@/components/modules/explorer/components/kpi-row';
import { LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

describe('KpiRow', () => {
  it('summarizes total, date span, lineage and country breadth', async () => {
    renderWithProviders(<KpiRow />);
    expect(await screen.findByText('12,345')).toBeInTheDocument();
    expect(await screen.findByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024 – Jan 3, 2024')).toBeInTheDocument();
    // null lineage / country buckets are excluded from the breadth counts
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('falls back gracefully when nothing matches', async () => {
    server.use(
      http.get(`${LAPIS}/sample/aggregated`, ({ request }) =>
        HttpResponse.json({ data: new URL(request.url).searchParams.has('fields') ? [] : [{ count: 0 }] })
      )
    );
    renderWithProviders(<KpiRow />);
    expect(await screen.findByText('0 days')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses the singular for a one-day span', async () => {
    server.use(
      http.get(`${LAPIS}/sample/aggregated`, () => HttpResponse.json({ data: [{ date: '2024-02-01', count: 1 }] }))
    );
    renderWithProviders(<KpiRow />);
    expect(await screen.findByText('1 day')).toBeInTheDocument();
  });
});
