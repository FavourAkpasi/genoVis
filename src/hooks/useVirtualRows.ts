import { type UIEvent, useState } from 'react';

export interface VirtualItemT {
  index: number;
  /** Pixel offset from the top of the scrollable content. */
  start: number;
}

interface UseVirtualRowsOptions {
  count: number;
  rowHeight: number;
  viewportHeight: number;
  overscan?: number;
}

/**
 * Minimal fixed-row-height virtualizer. From the current scroll position it returns
 * only the row indices in (or near) the viewport, so the DOM mounts a constant handful
 * of rows no matter how large `count` is. Spread `onScroll` onto the scroll container,
 * size an inner spacer to `totalHeight`, and absolutely-position each `item`.
 */
export const useVirtualRows = ({ count, rowHeight, viewportHeight, overscan = 6 }: UseVirtualRowsOptions) => {
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = (event: UIEvent<HTMLElement>) => setScrollTop(event.currentTarget.scrollTop);

  const totalHeight = count * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(count, startIndex + visibleCount);

  const items: VirtualItemT[] = [];
  for (let index = startIndex; index < endIndex; index += 1) {
    items.push({ index, start: index * rowHeight });
  }

  return { onScroll, totalHeight, items };
};
