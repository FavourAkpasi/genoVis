// Message protocol shared between the crossfilter worker and its React hook.
// Kept dependency-free so both the worker bundle and the main thread can import it.

import type { QueryParamsT } from '@/lib/endpoints';
import type { DetailRowT } from '@/types/lapis';

/** Detail columns exposed as client-side facets (each is categorical). */
export type FacetKeyT = 'pangoLineage' | 'country' | 'host';

export const FACET_KEYS: FacetKeyT[] = ['pangoLineage', 'country', 'host'];

/** A facet value and how many rows carry it under the current cross-filter. */
export interface FacetCountT {
  value: string;
  count: number;
}

/** The active client-side filter applied on top of the downloaded slice. */
export interface CrossfilterFilterT {
  /** Free-text needle matched across the searchable columns. */
  search: string;
  /** Selected values per facet; empty array = no constraint on that facet. */
  facets: Record<FacetKeyT, string[]>;
}

export const EMPTY_FILTER: CrossfilterFilterT = {
  search: '',
  facets: { pangoLineage: [], country: [], host: [] },
};

/**
 * Main thread → worker.
 * - `fetch`  — worker runs the paged LAPIS fetch loop itself (the active ingestion path).
 * - `load`   — main thread pushes rows in (alternate TanStack ingestion path; replaces the slice).
 * - `query`  — apply a new client-side filter.
 * - `window` — request the row objects for a visible range of the filtered result.
 * - `export` — request up to `limit` matched rows for a CSV download.
 */
export type CrossfilterRequestT =
  | { type: 'fetch'; params: QueryParamsT; target: number; pageSize: number }
  | { type: 'load'; rows: DetailRowT[] }
  | { type: 'query'; filter: CrossfilterFilterT }
  | { type: 'window'; start: number; count: number }
  | { type: 'export'; limit: number };

/** The result of one cross-filter pass over the loaded slice. */
export interface CrossfilterStateT {
  /** Rows passing the active filter. */
  matched: number;
  /** Rows currently held in the worker (grows while fetching). */
  loaded: number;
  /** Whether the fetch loop has finished. */
  done: boolean;
  /** Top values per facet, with crossfilter counts (each facet ignores its own selection). */
  facets: Record<FacetKeyT, FacetCountT[]>;
}

/**
 * Worker → main thread.
 * - `state`  — filter/loading summary (never carries row bodies).
 * - `window` — the requested slice of filtered rows.
 * - `error`  — a fetch failure.
 */
export type CrossfilterMessageT =
  | { type: 'state'; state: CrossfilterStateT }
  | { type: 'window'; start: number; rows: DetailRowT[] }
  | { type: 'export'; rows: DetailRowT[] }
  | { type: 'error'; message: string };
