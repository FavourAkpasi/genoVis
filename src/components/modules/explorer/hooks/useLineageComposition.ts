import { useAggregated } from '@/components/modules/explorer/hooks/useAggregated';
import type { QueryParamsT } from '@/lib/endpoints';

/** Sample counts grouped by lineage — the top-lineages composition source. */
export const useLineageComposition = (params: QueryParamsT = {}) =>
  useAggregated({ ...params, fields: ['pangoLineage'] });
