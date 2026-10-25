import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { RouteError } from '@/components/layouts/route-error';
import * as observability from '@/lib/observability';

const Crash = () => {
  throw new Error('chart exploded');
};

describe('RouteError', () => {
  it('reports the route error and offers a way back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const capture = vi.spyOn(observability, 'captureError').mockImplementation(() => {});
    const router = createMemoryRouter([{ path: '/', element: <Crash />, errorElement: <RouteError /> }]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText('chart exploded')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Explorer' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ message: 'chart exploded' }), {
      tags: { source: 'route' },
    });
    vi.restoreAllMocks();
  });

  it('falls back to a generic message for non-Error throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ThrowsString = () => {
      throw 'nope';
    };
    const router = createMemoryRouter([{ path: '/', element: <ThrowsString />, errorElement: <RouteError /> }]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('An unexpected error occurred.')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
