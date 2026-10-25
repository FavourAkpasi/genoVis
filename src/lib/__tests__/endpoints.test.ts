import { describe, expect, it } from 'vitest';

import { endpoints } from '@/lib/endpoints';

describe('endpoints.lapis (buildQuery)', () => {
  it('returns a bare URL with no query string when params are empty', () => {
    expect(endpoints.lapis.aggregated()).toBe('https://lapis.cov-spectrum.org/open/v2/sample/aggregated');
  });

  it('serializes scalar params into the query string', () => {
    const url = endpoints.lapis.aggregated({ pangoLineage: 'JN.1', dateFrom: '2024-01-01' });
    expect(url).toContain('/sample/aggregated?');
    expect(url).toContain('pangoLineage=JN.1');
    expect(url).toContain('dateFrom=2024-01-01');
  });

  it('expands array params into repeated keys (LAPIS OR semantics)', () => {
    const url = endpoints.lapis.details({ country: ['USA', 'Germany'] });
    const query = url.slice(url.indexOf('?'));
    expect(query.match(/country=/g)).toHaveLength(2);
    expect(query).toContain('country=USA');
    expect(query).toContain('country=Germany');
  });

  it('skips undefined values entirely', () => {
    const url = endpoints.lapis.aggregated({ pangoLineage: 'BA.2', country: undefined });
    expect(url).not.toContain('country');
    expect(url).toContain('pangoLineage=BA.2');
  });

  it('routes each resource to its own path', () => {
    expect(endpoints.lapis.nucleotideMutations()).toContain('/sample/nucleotideMutations');
    expect(endpoints.lapis.aminoAcidMutations()).toContain('/sample/aminoAcidMutations');
  });
});
