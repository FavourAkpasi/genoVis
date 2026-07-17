// Single source of truth for every backend endpoint. Never inline URLs elsewhere.
//
// Primary data source: cov-spectrum LAPIS v2 (open, no auth, ~9.4M SARS-CoV-2 samples).
// https://lapis.cov-spectrum.org/open/v2

const LAPIS_BASE = 'https://lapis.cov-spectrum.org/open/v2';

export type QueryValueT = string | number | boolean | string[] | undefined;
export type QueryParamsT = Record<string, QueryValueT>;

/** Serialize a params object into a query string, skipping undefined and expanding arrays into repeated keys. */
const buildQuery = (params: QueryParamsT): string => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else {
      search.append(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : '';
};

export const endpoints = {
  lapis: {
    aggregated: (params: QueryParamsT = {}) => `${LAPIS_BASE}/sample/aggregated${buildQuery(params)}`,
    nucleotideMutations: (params: QueryParamsT = {}) => `${LAPIS_BASE}/sample/nucleotideMutations${buildQuery(params)}`,
    aminoAcidMutations: (params: QueryParamsT = {}) => `${LAPIS_BASE}/sample/aminoAcidMutations${buildQuery(params)}`,
    details: (params: QueryParamsT = {}) => `${LAPIS_BASE}/sample/details${buildQuery(params)}`,
  },
} as const;
