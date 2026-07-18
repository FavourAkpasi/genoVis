import { useQuery } from '@tanstack/react-query';

import type { QueryParamsT } from '@/lib/endpoints';
import { lapisService } from '@/services/lapisService';

/** Columns fetched for the samples table (kept lean to bound payload size). */
export const SAMPLE_FIELDS = ['genbankAccession', 'date', 'country', 'region', 'pangoLineage', 'host'];

/** Rows fetched in one slice; virtualization then keeps the DOM small. */
export const SAMPLE_SLICE_LIMIT = 5000;

/** A slice of per-sample detail rows for the given filters — the virtualized-table source. */
export const useSampleDetails = (params: QueryParamsT = {}) =>
  useQuery({
    queryKey: ['sampleDetails', params],
    queryFn: ({ signal }) =>
      lapisService.getDetails({ ...params, fields: SAMPLE_FIELDS, limit: SAMPLE_SLICE_LIMIT }, signal),
  });
