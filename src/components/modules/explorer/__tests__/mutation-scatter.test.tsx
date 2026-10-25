import { act, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MutationScatter } from '@/components/modules/explorer/components/mutation-scatter';
import * as svgExport from '@/lib/svg-export';
import { failingHandlers, LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';
import { renderWithProviders } from '@tests/integration/utils';

const WIDTH = 800;

// A recording 2D context: every method is a no-op spy, every property assignable.
const createContext = () =>
  new Proxy({} as Record<string, unknown>, {
    get: (target, key: string) => (key in target ? target[key] : (target[key] = vi.fn())),
    set: (target, key: string, value) => {
      target[key] = value;
      return true;
    },
  });

let context: ReturnType<typeof createContext>;

beforeEach(() => {
  context = createContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => context as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(WIDTH);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MutationScatter', () => {
  it('requests mutations above the frequency floor and draws one dot per mutation', async () => {
    let minProportion: string | null = null;
    server.use(
      http.get(`${LAPIS}/sample/aminoAcidMutations`, ({ request }) => {
        minProportion = new URL(request.url).searchParams.get('minProportion');
        return undefined;
      })
    );
    renderWithProviders(<MutationScatter params={{ pangoLineage: 'JN.1' }} />);

    expect(await screen.findByText(/2 mutations across 2 genes/)).toBeInTheDocument();
    expect(minProportion).toBe('0.02');
    expect(screen.getByRole('img')).toHaveAccessibleName(/2 amino-acid mutations across 2 genes/);
    expect(context.arc).toHaveBeenCalledTimes(2);
    expect(context.fillText).toHaveBeenCalledWith('ORF1a', expect.any(Number), expect.any(Number));
  });

  it('shows the hovered mutation and redraws on theme change', async () => {
    renderWithProviders(<MutationScatter />);
    const canvas = await screen.findByRole('img');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0 } as DOMRect);

    // Genes are laid out in genome order (ORF1a, then S); S:N501Y sits in the right-hand column at 90%.
    const plotW = WIDTH - 48 - 16;
    const sx = 48 + plotW / 2 + Math.min(14, (plotW / 2) * 0.15) + (plotW / 2 - 2 * Math.min(14, (plotW / 2) * 0.15));
    const sy = 16 + (1 - 0.9) * (360 - 16 - 44);
    fireEvent.mouseMove(canvas, { clientX: sx, clientY: sy });
    expect(screen.getByText('S:N501Y')).toBeInTheDocument();
    expect(screen.getByText('90% · 90 samples')).toBeInTheDocument();

    const draws = vi.mocked(context.clearRect as () => void).mock.calls.length;
    await act(async () => document.documentElement.classList.add('dark'));
    expect(vi.mocked(context.clearRect as () => void).mock.calls.length).toBeGreaterThan(draws);

    fireEvent.mouseLeave(canvas);
    expect(screen.queryByText('S:N501Y')).not.toBeInTheDocument();
  });

  it('exports the canvas as a PNG', async () => {
    const download = vi.spyOn(svgExport, 'downloadCanvas').mockImplementation(() => {});
    const { user } = renderWithProviders(<MutationScatter />);
    await screen.findByRole('img');
    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Download PNG' }));
    expect(download).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 'mutation-landscape.png');
  });

  it('shows an empty state when there are no mutations', async () => {
    server.use(http.get(`${LAPIS}/sample/aminoAcidMutations`, () => HttpResponse.json({ data: [] })));
    renderWithProviders(<MutationScatter />);
    expect(await screen.findByText('No mutations match these filters.')).toBeInTheDocument();
  });

  it('shows the error message when the request fails', async () => {
    server.use(...failingHandlers);
    renderWithProviders(<MutationScatter />);
    expect(await screen.findByText(/Couldn't load mutations/)).toBeInTheDocument();
  });
});
