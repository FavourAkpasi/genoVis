import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import type { QueryParamsT } from '@/lib/endpoints';

/** Sample counts grouped by date AND lineage — the stacked lineage-prevalence source. */
export const useLineageOverTime = (params: QueryParamsT = {}) =>
  useAggregated({ ...params, fields: ['date', 'pangoLineage'] });
