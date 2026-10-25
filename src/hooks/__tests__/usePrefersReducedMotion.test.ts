import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { matchMediaStub } from '@tests/integration/browser-stubs';

describe('usePrefersReducedMotion', () => {
  it('reflects the reduced-motion media query', () => {
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);

    vi.mocked(window.matchMedia).mockImplementation((query) => ({ ...matchMediaStub(query), matches: true }));
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
    vi.mocked(window.matchMedia).mockImplementation(matchMediaStub);
  });
});
