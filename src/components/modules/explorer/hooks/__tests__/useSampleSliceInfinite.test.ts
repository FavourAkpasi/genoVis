import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSampleSliceInfinite } from '@/components/modules/explorer/hooks/useSampleSliceInfinite';
import { createQueryWrapper } from '@tests/integration/utils';

describe('useSampleSliceInfinite (alternate ingestion path)', () => {
  it('loads the first page and stops paging on a short page', async () => {
    const { result } = renderHook(() => useSampleSliceInfinite({ country: 'Germany' }), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages.flat()).toHaveLength(4);
    expect(result.current.hasNextPage).toBe(false);
  });
});
