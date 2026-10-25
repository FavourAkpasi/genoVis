import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { renderWithProviders } from '@tests/integration/utils';

const renderLayout = (route = '/') =>
  renderWithProviders(
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<p>explorer page</p>} />
        <Route path="/insights" element={<p>insights page</p>} />
      </Route>
    </Routes>,
    { route }
  );

describe('DashboardLayout', () => {
  it('renders the routed page under the nav and marks the active link', () => {
    renderLayout('/insights');
    expect(screen.getByText('insights page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Explorer' })).not.toHaveAttribute('aria-current');
  });

  it('navigates between pages from the nav', async () => {
    const { user } = renderLayout('/');
    await user.click(screen.getByRole('link', { name: 'Insights' }));
    expect(screen.getByText('insights page')).toBeInTheDocument();
  });

  it('opens the mobile drawer and closes it after navigating', async () => {
    const { user } = renderLayout('/');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const drawer = await screen.findByRole('dialog');
    expect(drawer).toHaveTextContent('GenoVis');

    await user.click(within(drawer).getByRole('link', { name: 'Insights' }));
    expect(screen.getByText('insights page')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('switches theme from the toggle', async () => {
    const { user } = renderLayout('/');
    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
