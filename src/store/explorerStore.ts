import { create } from 'zustand';

import type { QueryParamsT } from '@/lib/endpoints';

export interface ExplorerFiltersT {
  /** pangoLineage, e.g. "JN.1"; empty = all lineages. */
  lineage: string;
  /** continent names, e.g. ["Europe"]; empty = all regions (ORed by LAPIS). */
  regions: string[];
  /** country names, e.g. ["USA", "Germany"]; empty = all countries (ORed by LAPIS). */
  countries: string[];
  /** ISO date (yyyy-mm-dd); empty = unbounded. */
  dateFrom: string;
  dateTo: string;
}

const initialFilters: ExplorerFiltersT = {
  lineage: '',
  regions: [],
  countries: [],
  dateFrom: '',
  dateTo: '',
};

interface ExplorerStoreT {
  filters: ExplorerFiltersT;
  setFilter: <K extends keyof ExplorerFiltersT>(key: K, value: ExplorerFiltersT[K]) => void;
  reset: () => void;
}

export const useExplorerStore = create<ExplorerStoreT>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  reset: () => set({ filters: initialFilters }),
}));

/** Map UI filter state to LAPIS query params, omitting empty values. */
export const filtersToParams = (filters: ExplorerFiltersT): QueryParamsT => {
  const params: QueryParamsT = {};
  if (filters.lineage) params.pangoLineage = filters.lineage;
  if (filters.regions.length > 0) params.region = filters.regions;
  if (filters.countries.length > 0) params.country = filters.countries;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  return params;
};
