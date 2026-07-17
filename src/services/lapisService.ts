// Pure transport over the LAPIS endpoints. No React here.

import { endpoints, type QueryParamsT } from '@/lib/endpoints';
import type { AggregatedRowT, DetailRowT, LapisResponseT, MutationRowT } from '@/types/lapis';

const lapisFetch = async <T>(url: string, signal?: AbortSignal): Promise<T[]> => {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`LAPIS request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as LapisResponseT<T>;

  if (!Array.isArray(body?.data)) {
    throw new Error('Unexpected LAPIS response shape: missing "data" array');
  }

  return body.data;
};

export const lapisService = {
  getAggregated: (params: QueryParamsT = {}, signal?: AbortSignal) =>
    lapisFetch<AggregatedRowT>(endpoints.lapis.aggregated(params), signal),

  getNucleotideMutations: (params: QueryParamsT = {}, signal?: AbortSignal) =>
    lapisFetch<MutationRowT>(endpoints.lapis.nucleotideMutations(params), signal),

  getAminoAcidMutations: (params: QueryParamsT = {}, signal?: AbortSignal) =>
    lapisFetch<MutationRowT>(endpoints.lapis.aminoAcidMutations(params), signal),

  getDetails: (params: QueryParamsT = {}, signal?: AbortSignal) =>
    lapisFetch<DetailRowT>(endpoints.lapis.details(params), signal),
};
