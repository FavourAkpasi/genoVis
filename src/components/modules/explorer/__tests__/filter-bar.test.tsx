import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FilterBar } from '@/components/modules/explorer/components/filter-bar';
import { useExplorerStore } from '@/store/explorerStore';
import { renderWithProviders } from '@tests/integration/utils';

const filters = () => useExplorerStore.getState().filters;

describe('FilterBar', () => {
  it('selects a lineage from the options LAPIS returns', async () => {
    const { user } = renderWithProviders(<FilterBar />);
    await user.click(screen.getByRole('combobox', { name: 'Lineage' }));
    await user.click(await screen.findByRole('option', { name: 'BA.2' }));
    expect(filters().lineage).toBe('BA.2');
  });

  it('multi-selects regions and countries', async () => {
    const { user } = renderWithProviders(<FilterBar />);

    await user.click(screen.getByRole('combobox', { name: 'Regions' }));
    await user.click(await screen.findByRole('option', { name: 'Europe' }));
    expect(filters().regions).toEqual(['Europe']);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('combobox', { name: 'Countries' }));
    // Countries are listed alphabetically, with empty buckets dropped.
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Germany', 'USA']);
    await user.click(options[1]);
    expect(filters().countries).toEqual(['USA']);
  });

  it('collapses selections beyond two chips into a +N badge', async () => {
    useExplorerStore.getState().setFilter('countries', ['Germany', 'USA', 'France']);
    renderWithProviders(<FilterBar />);
    expect(await screen.findByText('+1')).toBeInTheDocument();
  });

  it('edits the date range through the lazily loaded calendar', async () => {
    useExplorerStore.getState().setFilter('dateFrom', '2024-01-10');
    useExplorerStore.getState().setFilter('dateTo', '2024-01-20');
    const { user } = renderWithProviders(<FilterBar />);

    const trigger = screen.getByRole('button', { name: 'Date range' });
    expect(trigger).toHaveTextContent('Jan 10, 2024 – Jan 20, 2024');
    await user.click(trigger);
    // The calendar is a lazy chunk; give its first import time under a loaded test run.
    await user.click(await screen.findByRole('button', { name: /January 25th, 2024/ }, { timeout: 5000 }));
    expect(filters()).toMatchObject({ dateFrom: '2024-01-10', dateTo: '2024-01-25' });
  });

  it('resets every filter', async () => {
    useExplorerStore.getState().setFilter('lineage', 'JN.1');
    useExplorerStore.getState().setFilter('dateFrom', '2024-01-10');
    const { user } = renderWithProviders(<FilterBar />);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(filters()).toMatchObject({ lineage: '', dateFrom: '', dateTo: '', regions: [], countries: [] });
    expect(screen.getByRole('button', { name: 'Date range' })).toHaveTextContent('Pick a date range');
  });
});
