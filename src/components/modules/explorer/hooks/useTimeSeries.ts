import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import type { QueryParamsT } from '@/lib/endpoints';

/** Sample counts grouped by date for the given filters — the time-series source. */
export const useTimeSeries = (params: QueryParamsT = {}) => useAggregated({ ...params, fields: ['date'] });
