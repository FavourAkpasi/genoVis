// manually typed shapes returned by the cov-spectrum LAPIS v2 API.

export interface LapisInfoT {
  dataVersion: string;
  requestId: string;
  requestInfo: string;
  reportTo?: string;
}

export interface LapisResponseT<T> {
  data: T[];
  info: LapisInfoT;
}

/**
 * A row from `/sample/aggregated`. `count` is always present; grouping fields
 * (country, date, pangoLineage, …) appear only when requested via `fields`.
 */
export type AggregatedRowT = {
  count: number;
} & Record<string, string | number | null>;

/** A row from `/sample/nucleotideMutations` or `/sample/aminoAcidMutations`. */
export interface MutationRowT {
  mutation: string;
  count: number;
  coverage: number;
  proportion: number;
  /** Gene name for amino-acid mutations (e.g. "S", "ORF1a"); null for nucleotide mutations. */
  sequenceName: string | null;
  mutationFrom: string;
  mutationTo: string;
  position: number;
}

/** A per-sample row from `/sample/details` (wide; ~50 columns). Shape depends on requested `fields`. */
export type DetailRowT = Record<string, string | number | boolean | null>;
