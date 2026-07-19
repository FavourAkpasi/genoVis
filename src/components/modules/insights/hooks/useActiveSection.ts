import { useEffect, useState } from 'react';

/**
 * Scroll-spy for the teardown's table of contents. Observes each section by id
 * and reports the one crossing the viewport's centre band — so when two sections
 * share the screen, the one you're actually reading wins. IntersectionObserver
 * only (no scroll listener, no per-frame layout reads).
 *
 * `ids` must be a stable reference (define it at module scope) so the observer
 * isn't torn down and rebuilt on every render.
 */
export const useActiveSection = (ids: string[]) => {
  const [activeId, setActiveId] = useState(ids[0] ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      // A ~10%-tall band across the middle: at most one tall section sits on it.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
};
