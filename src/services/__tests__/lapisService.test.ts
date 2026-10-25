import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { lapisService } from '@/services/lapisService';
import { aminoAcidRows, countryRows, detailRows, TOTAL_COUNT } from '@tests/integration/fixtures';
import { LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';

describe('lapisService', () => {
  it('returns the data array of each endpoint', async () => {
    expect(await lapisService.getAggregated()).toEqual([{ count: TOTAL_COUNT }]);
    expect(await lapisService.getAggregated({ fields: ['country'] })).toEqual(countryRows);
    expect(await lapisService.getAminoAcidMutations()).toEqual(aminoAcidRows);
    expect(await lapisService.getNucleotideMutations()).toEqual(aminoAcidRows);
    expect(await lapisService.getDetails({ limit: 2, offset: 1 })).toEqual(detailRows.slice(1, 3));
  });

  it('sends filters as query params', async () => {
    let received: URLSearchParams | undefined;
    server.use(
      http.get(`${LAPIS}/sample/aggregated`, ({ request }) => {
        received = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [] });
      })
    );
    await lapisService.getAggregated({ pangoLineage: 'JN.1', country: ['USA', 'Germany'] });
    expect(received?.get('pangoLineage')).toBe('JN.1');
    expect(received?.getAll('country')).toEqual(['USA', 'Germany']);
  });

  it('throws with the HTTP status on a failed response', async () => {
    server.use(
      http.get(`${LAPIS}/sample/aggregated`, () => new HttpResponse(null, { status: 500, statusText: 'Boom' }))
    );
    await expect(lapisService.getAggregated()).rejects.toThrow('LAPIS request failed: 500 Boom');
  });

  it('throws when the body has no data array', async () => {
    server.use(http.get(`${LAPIS}/sample/aggregated`, () => HttpResponse.json({ error: 'bad field' })));
    await expect(lapisService.getAggregated()).rejects.toThrow('missing "data" array');
  });
});
