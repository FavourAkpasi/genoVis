import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ExplorerView } from '@/components/modules/explorer/explorer-view';
import { useExplorerStore } from '@/store/explorerStore';
import { LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

describe('ExplorerView (coordinated views)', () => {
  it('renders every view from live (mocked) LAPIS data', async () => {
    renderWithProviders(<ExplorerView />);
    expect(screen.getByRole('heading', { name: 'Explorer' })).toBeInTheDocument();
    expect(await screen.findByText('12,345')).toBeInTheDocument();
    expect(await screen.findByText('Top lineages')).toBeInTheDocument();
    expect(await screen.findByText('Mutation landscape')).toBeInTheDocument();
    expect(await screen.findByText('OQ000001')).toBeInTheDocument();
  });

  it('brushing a lineage filters the dashboard but keeps the lineage charts complete', async () => {
    const lineageFilters: (string | null)[] = [];
    server.use(
      http.get(`${LAPIS}/sample/aggregated`, ({ request }) => {
        lineageFilters.push(new URL(request.url).searchParams.get('pangoLineage'));
        return undefined;
      })
    );
    const { user } = renderWithProviders(<ExplorerView />);

    const topLineages = (await screen.findByText('Top lineages')).closest('[data-slot="card"]') as HTMLElement;
    await user.click(await within(topLineages).findByRole('button', { name: /BA\.2/ }));

    expect(useExplorerStore.getState().filters.lineage).toBe('BA.2');
    expect(await within(topLineages).findByRole('button', { name: /BA\.2/, pressed: true })).toBeInTheDocument();
    // The other bars are dimmed, not removed.
    expect(within(topLineages).getByRole('button', { name: /JN\.1/ })).toHaveClass('opacity-40');
    expect(lineageFilters).toContain('BA.2');

    // Clicking again toggles the selection off.
    await user.click(within(topLineages).getByRole('button', { name: /BA\.2/ }));
    expect(useExplorerStore.getState().filters.lineage).toBe('');
  });
});
