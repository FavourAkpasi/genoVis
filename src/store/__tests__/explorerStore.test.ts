import { describe, expect, it } from 'vitest';

import type { ExplorerFiltersT } from '@/store/explorerStore';
import { filtersToParams } from '@/store/explorerStore';

const emptyFilters: ExplorerFiltersT = {
  lineage: '',
  regions: [],
  countries: [],
  dateFrom: '',
  dateTo: '',
};

describe('filtersToParams', () => {
  it('returns an empty params object when no filters are set', () => {
    expect(filtersToParams(emptyFilters)).toEqual({});
  });

  it('maps lineage to pangoLineage', () => {
    expect(filtersToParams({ ...emptyFilters, lineage: 'JN.1' })).toEqual({ pangoLineage: 'JN.1' });
  });

  it('passes multi-value regions and countries through as arrays', () => {
    expect(filtersToParams({ ...emptyFilters, regions: ['Europe'], countries: ['USA', 'Germany'] })).toEqual({
      region: ['Europe'],
      country: ['USA', 'Germany'],
    });
  });

  it('includes date bounds only when present', () => {
    expect(filtersToParams({ ...emptyFilters, dateFrom: '2024-01-01' })).toEqual({ dateFrom: '2024-01-01' });
  });

  it('omits empty arrays and empty strings', () => {
    const params = filtersToParams({ ...emptyFilters, lineage: 'BA.2', regions: [], dateTo: '' });
    expect(params).toEqual({ pangoLineage: 'BA.2' });
    expect(params).not.toHaveProperty('region');
    expect(params).not.toHaveProperty('dateTo');
  });
});
