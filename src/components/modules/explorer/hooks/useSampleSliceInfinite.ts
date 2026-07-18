import { useInfiniteQuery } from '@tanstack/react-query';

import { SAMPLE_FIELDS, SLICE_PAGE_SIZE, SLICE_TARGET } from '@/components/modules/explorer/sliceConfig';
import type { QueryParamsT } from '@/lib/endpoints';
import { lapisService } from '@/services/lapisService';

/**
 * ALTERNATE slice-ingestion path — NOT wired into the table today (the crossfilter
 * worker fetches the slice itself; see `useCrossfilter`). Kept in place so the
 * main-thread/TanStack strategy can be swapped back in for testing:
 *
 *   const slice = useSampleSliceInfinite(params);
 *   // then, as pages arrive, push them into the worker:
 *   //   worker.postMessage({ type: 'load', rows: slice.data?.pages.flat() ?? [] });
 *
 * Trade-off vs the worker path: each ~6.9 MB page's JSON.parse runs on the main
 * thread here, and the flattened rows also live on the main thread.
 */
export const useSampleSliceInfinite = (params: QueryParamsT = {}) =>
  useInfiniteQuery({
    queryKey: ['sampleSlice', params],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      lapisService.getDetails({ ...params, fields: SAMPLE_FIELDS, limit: SLICE_PAGE_SIZE, offset: pageParam }, signal),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.length, 0);
      if (lastPage.length < SLICE_PAGE_SIZE || loaded >= SLICE_TARGET) return undefined;
      return loaded;
    },
  });
