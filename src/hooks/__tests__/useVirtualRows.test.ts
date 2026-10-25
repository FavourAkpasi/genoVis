import { act, renderHook } from '@testing-library/react';
import type { UIEvent } from 'react';
import { describe, expect, it } from 'vitest';

import { useVirtualRows } from '@/hooks/useVirtualRows';

// A 10k-row list, 40px rows, 400px viewport → only a windowed handful should mount.
const options = { count: 10_000, rowHeight: 40, viewportHeight: 400, overscan: 6 };

const scrollTo = (currentTarget: { scrollTop: number }) => ({ currentTarget }) as unknown as UIEvent<HTMLElement>;

describe('useVirtualRows', () => {
  it('reserves full scroll height for the whole list', () => {
    const { result } = renderHook(() => useVirtualRows(options));
    expect(result.current.totalHeight).toBe(10_000 * 40);
  });

  it('mounts only a small constant window of rows, not all 10k', () => {
    const { result } = renderHook(() => useVirtualRows(options));
    // visible (400/40 = 10) + overscan*2 (12) = 22, clamped to available rows
    expect(result.current.items).toHaveLength(22);
    expect(result.current.items[0].index).toBe(0);
  });

  it('starts at row 0 with no overscan above the top', () => {
    const { result } = renderHook(() => useVirtualRows(options));
    expect(result.current.items[0]).toEqual({ index: 0, start: 0 });
  });

  it('shifts the window down as the container scrolls', () => {
    const { result } = renderHook(() => useVirtualRows(options));
    act(() => result.current.onScroll(scrollTo({ scrollTop: 4000 })));
    // 4000/40 = row 100, minus overscan 6 → first mounted index 94
    expect(result.current.items[0].index).toBe(94);
    expect(result.current.items[0].start).toBe(94 * 40);
  });

  it('does not window past the end of the list', () => {
    const { result } = renderHook(() => useVirtualRows(options));
    act(() => result.current.onScroll(scrollTo({ scrollTop: 10_000 * 40 })));
    const lastItem = result.current.items.at(-1);
    expect(lastItem!.index).toBeLessThan(10_000);
  });
});
