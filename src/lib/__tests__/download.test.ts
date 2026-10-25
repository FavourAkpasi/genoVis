import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadCsv } from '@/lib/csv';
import { downloadCanvas, exportSvgToPng } from '@/lib/svg-export';

let clicked: HTMLAnchorElement[] = [];

beforeEach(() => {
  clicked = [];
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push(this);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadCsv', () => {
  it('downloads the CSV as a named blob and revokes the object URL', () => {
    downloadCsv('rows.csv', 'a,b\n1,2');
    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe('rows.csv');
    expect(clicked[0].href).toBe('blob:test');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});

describe('downloadCanvas', () => {
  it('downloads the canvas as a PNG', () => {
    const canvas = document.createElement('canvas');
    canvas.toBlob = (callback) => callback(new Blob(['png']));
    downloadCanvas(canvas, 'chart.png');
    expect(clicked[0].download).toBe('chart.png');
  });

  it('does nothing when the canvas produces no blob', () => {
    const canvas = document.createElement('canvas');
    canvas.toBlob = (callback) => callback(null);
    downloadCanvas(canvas, 'chart.png');
    expect(clicked).toHaveLength(0);
  });
});

describe('exportSvgToPng', () => {
  const makeSvg = () => {
    const card = document.createElement('div');
    card.style.backgroundColor = 'rgb(10, 20, 30)';
    card.innerHTML = '<svg viewBox="0 0 400 200"><g><rect width="10" height="10" /></g></svg>';
    document.body.append(card);
    return card.querySelector('svg') as SVGSVGElement;
  };

  // jsdom never loads images; resolve or reject on the next tick instead.
  const stubImage = (outcome: 'load' | 'error') =>
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          setTimeout(() => (outcome === 'load' ? this.onload?.() : this.onerror?.()));
        }
      }
    );

  it('rasterizes the SVG onto the card background and downloads it', async () => {
    stubImage('load');
    const fillRect = vi.fn();
    const context = { fillRect, drawImage: vi.fn(), fillStyle: '' };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'])));

    await exportSvgToPng(makeSvg(), 'chart.png');

    expect(context.fillStyle).toBe('rgb(10, 20, 30)');
    expect(fillRect).toHaveBeenCalledWith(0, 0, 800, 400);
    expect(clicked[0].download).toBe('chart.png');
  });

  it('rejects when the image fails to render', async () => {
    stubImage('error');
    await expect(exportSvgToPng(makeSvg(), 'chart.png')).rejects.toThrow('Failed to render chart image');
  });
});
