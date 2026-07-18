// The data engine for the large sample slice — runs entirely off the main thread.
//
// It owns the whole ingestion + query lifecycle:
//   1. `fetch`  → pages the slice in from LAPIS (JSON.parse of every ~6.9 MB chunk
//                 happens here, never on the main thread) and accumulates it.
//   2. `query`  → recomputes matched rows + crossfilter facet counts on each change.
//   3. `window` → returns only the visible row objects the table asks for, so the
//                 main thread holds ~30 rows instead of 500k.
//
// Because the rows live only here, the main thread never parses or copies the full
// slice — that is the whole point of pushing it into the worker at 500k rows.

import { lapisService } from '@/services/lapisService';
import { SAMPLE_FIELDS } from '@/components/modules/explorer/sliceConfig';
import type { DetailRowT } from '@/types/lapis';
import {
  type CrossfilterFilterT,
  type CrossfilterMessageT,
  type CrossfilterRequestT,
  type CrossfilterStateT,
  EMPTY_FILTER,
  FACET_KEYS,
  type FacetCountT,
  type FacetKeyT,
} from '@/workers/crossfilter.types';

/** Columns scanned by the free-text search. */
const SEARCH_FIELDS = ['genbankAccession', 'date', 'country', 'region', 'pangoLineage', 'host'];
/** How many values to surface per facet (selected values are always kept). */
const TOP_N = 8;

let dataset: DetailRowT[] = [];
let matchedIndices: number[] = [];
let currentFilter: CrossfilterFilterT = EMPTY_FILTER;
let done = false;

const post = (message: CrossfilterMessageT) => (postMessage as unknown as (value: unknown) => void)(message);

const asText = (value: DetailRowT[string]) => (value == null ? '' : String(value));

const matchesSearch = (row: DetailRowT, needle: string) => {
  if (!needle) return true;
  for (const field of SEARCH_FIELDS) {
    if (asText(row[field]).toLowerCase().includes(needle)) return true;
  }
  return false;
};

const matchesFacet = (row: DetailRowT, key: FacetKeyT, selected: string[]) =>
  selected.length === 0 || selected.includes(asText(row[key]));

const topCounts = (counts: Map<string, number>, selected: string[]): FacetCountT[] => {
  const ranked = [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
  const top = ranked.slice(0, TOP_N);
  // Keep selected values pinned even if they fall outside the top N, so they stay toggleable.
  for (const value of selected) {
    if (!top.some((entry) => entry.value === value)) {
      top.push({ value, count: counts.get(value) ?? 0 });
    }
  }
  return top;
};

/** Recompute `matchedIndices` + facet counts against the current filter, and emit a state summary. */
const runQuery = (): CrossfilterStateT => {
  const { search, facets } = currentFilter;
  const needle = search.trim().toLowerCase();
  const matches: number[] = [];
  const facetCounts: Record<FacetKeyT, Map<string, number>> = {
    pangoLineage: new Map(),
    country: new Map(),
    host: new Map(),
  };

  for (let index = 0; index < dataset.length; index += 1) {
    const row = dataset[index];
    if (!matchesSearch(row, needle)) continue;

    const facetPass: Record<FacetKeyT, boolean> = {
      pangoLineage: matchesFacet(row, 'pangoLineage', facets.pangoLineage),
      country: matchesFacet(row, 'country', facets.country),
      host: matchesFacet(row, 'host', facets.host),
    };

    if (facetPass.pangoLineage && facetPass.country && facetPass.host) {
      matches.push(index);
    }

    // Crossfilter semantics: a facet's counts pass every OTHER facet but not itself.
    for (const key of FACET_KEYS) {
      const passesOthers = FACET_KEYS.every((other) => other === key || facetPass[other]);
      if (!passesOthers) continue;
      const value = asText(row[key]);
      if (!value) continue;
      const map = facetCounts[key];
      map.set(value, (map.get(value) ?? 0) + 1);
    }
  }

  matchedIndices = matches;
  return {
    matched: matches.length,
    loaded: dataset.length,
    done,
    facets: {
      pangoLineage: topCounts(facetCounts.pangoLineage, facets.pangoLineage),
      country: topCounts(facetCounts.country, facets.country),
      host: topCounts(facetCounts.host, facets.host),
    },
  };
};

const emitState = () => post({ type: 'state', state: runQuery() });

/** Page the slice in from LAPIS, re-querying after each page so the table fills progressively. */
const runFetch = async (params: Parameters<typeof lapisService.getDetails>[0], target: number, pageSize: number) => {
  dataset = [];
  done = false;
  emitState();

  for (let offset = 0; offset < target; offset += pageSize) {
    const limit = Math.min(pageSize, target - offset);
    let page: DetailRowT[];
    try {
      page = await lapisService.getDetails({ ...params, fields: SAMPLE_FIELDS, limit, offset });
    } catch (error) {
      post({ type: 'error', message: error instanceof Error ? error.message : 'Failed to fetch slice' });
      return;
    }

    for (const row of page) dataset.push(row);

    // A short page means the dataset is exhausted before the target.
    if (page.length < limit) break;
    done = offset + pageSize >= target;
    emitState();
  }

  done = true;
  emitState();
};

onmessage = (event: MessageEvent) => {
  const message = event.data as CrossfilterRequestT;

  if (message.type === 'fetch') {
    void runFetch(message.params, message.target, message.pageSize);
    return;
  }

  if (message.type === 'load') {
    dataset = message.rows;
    done = true;
    emitState();
    return;
  }

  if (message.type === 'query') {
    currentFilter = message.filter;
    emitState();
    return;
  }

  // message.type === 'window'
  const rows = matchedIndices.slice(message.start, message.start + message.count).map((index) => dataset[index]);
  post({ type: 'window', start: message.start, rows });
};
