// Default MSW handlers for the LAPIS API. Override per test with `server.use(...)`.

import { http, HttpResponse } from 'msw';

import {
  aminoAcidRows,
  countryRows,
  dateRows,
  detailRows,
  lineageDateRows,
  lineageRows,
  regionRows,
  TOTAL_COUNT,
} from '@tests/integration/fixtures';

export const LAPIS = 'https://lapis.cov-spectrum.org/open/v2';

const lapisBody = <T>(data: T[]) =>
  HttpResponse.json({ data, info: { dataVersion: 'test', requestId: 'test', requestInfo: '' } });

const aggregatedFor = (fields: string[]) => {
  const key = [...fields].sort().join(',');
  if (key === '') return [{ count: TOTAL_COUNT }];
  if (key === 'date') return dateRows;
  if (key === 'country') return countryRows;
  if (key === 'region') return regionRows;
  if (key === 'pangoLineage') return lineageRows;
  if (key === 'date,pangoLineage') return lineageDateRows;
  return [];
};

export const handlers = [
  http.get(`${LAPIS}/sample/aggregated`, ({ request }) => {
    const fields = new URL(request.url).searchParams.getAll('fields');
    return lapisBody(aggregatedFor(fields));
  }),

  http.get(`${LAPIS}/sample/aminoAcidMutations`, () => lapisBody(aminoAcidRows)),

  http.get(`${LAPIS}/sample/nucleotideMutations`, () => lapisBody(aminoAcidRows)),

  http.get(`${LAPIS}/sample/details`, ({ request }) => {
    const search = new URL(request.url).searchParams;
    const offset = Number(search.get('offset') ?? 0);
    const limit = Number(search.get('limit') ?? detailRows.length);
    return lapisBody(detailRows.slice(offset, offset + limit));
  }),
];

/** A handler that makes every LAPIS endpoint fail with a 500. */
export const failingHandlers = [
  http.get(`${LAPIS}/*`, () => new HttpResponse(null, { status: 500, statusText: 'Server Error' })),
];
