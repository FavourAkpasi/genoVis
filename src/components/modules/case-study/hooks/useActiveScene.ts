import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scrollytelling driver: tracks which scene step is crossing the vertical
 * centre of the viewport and reports its index. A single IntersectionObserver
 * with a thin centre band keeps this off the main thread — no scroll listener,
 * no per-frame layout reads.
 */
export const useActiveScene = (count: number) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const elements = useRef<Map<number, HTMLElement>>(new Map());

  // Ref callback factory: each step registers itself by index (and unregisters on unmount).
  const register = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      if (node) elements.current.set(index, node);
      else elements.current.delete(index);
    },
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.sceneIndex);
          if (!Number.isNaN(index)) setActiveIndex(index);
        }
      },
      // -45%/-45% collapses the trigger area to a ~10%-tall band across the middle,
      // so at most one tall step is "active" at a time.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    for (const node of elements.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  return { activeIndex, register };
};
