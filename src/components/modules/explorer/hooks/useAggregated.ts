import { useQuery } from '@tanstack/react-query';

import type { QueryParamsT } from '@/lib/endpoints';
import { lapisService } from '@/services/lapisService';

/** Query aggregated sample counts from LAPIS, grouped by whatever `fields` are requested. */
export const useAggregated = (params: QueryParamsT = {}) =>
  useQuery({
    queryKey: ['aggregated', params],
    queryFn: ({ signal }) => lapisService.getAggregated(params, signal),
  });
