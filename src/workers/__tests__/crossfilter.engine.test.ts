import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { DetailRowT } from '@/types/lapis';
import { createCrossfilterEngine } from '@/workers/crossfilter.engine';
import { type CrossfilterMessageT, EMPTY_FILTER } from '@/workers/crossfilter.types';
import { detailRows } from '@tests/integration/fixtures';
import { LAPIS } from '@tests/integration/handlers';
import { server } from '@tests/integration/server';

const setup = () => {
  const messages: CrossfilterMessageT[] = [];
  const engine = createCrossfilterEngine((message) => messages.push(message));
  const lastState = () => {
    const states = messages.filter((message) => message.type === 'state');
    const last = states[states.length - 1];
    if (!last || last.type !== 'state') throw new Error('no state emitted');
    return last.state;
  };
  const lastOf = <K extends CrossfilterMessageT['type']>(type: K) =>
    messages.filter((message): message is Extract<CrossfilterMessageT, { type: K }> => message.type === type).at(-1);
  return { engine, messages, lastState, lastOf };
};

const withFacets = (facets: Partial<typeof EMPTY_FILTER.facets>, search = '') => ({
  search,
  facets: { ...EMPTY_FILTER.facets, ...facets },
});

describe('crossfilter engine', () => {
  it('loads rows and reports every row as matched with facet counts', () => {
    const { engine, lastState } = setup();
    engine.handle({ type: 'load', rows: detailRows });

    const state = lastState();
    expect(state).toMatchObject({ matched: 4, loaded: 4, done: true });
    expect(state.facets.country).toEqual([
      { value: 'Germany', count: 2 },
      { value: 'USA', count: 1 },
      { value: 'Brazil', count: 1 },
    ]);
    // Null hosts are not counted as a facet value.
    expect(state.facets.host.map((entry) => entry.value)).toEqual(['Homo sapiens', 'Felis catus']);
  });

  it('applies free-text search case-insensitively across columns', () => {
    const { engine, lastState } = setup();
    engine.handle({ type: 'load', rows: detailRows });
    engine.handle({ type: 'query', filter: withFacets({}, '  BRA ') });
    expect(lastState().matched).toBe(1);
  });

  it('uses crossfilter semantics: a facet ignores its own selection but honours the others', () => {
    const { engine, lastState } = setup();
    engine.handle({ type: 'load', rows: detailRows });
    engine.handle({ type: 'query', filter: withFacets({ country: ['Germany'] }) });

    const state = lastState();
    expect(state.matched).toBe(2);
    // Country facet still lists every country so others stay selectable…
    expect(state.facets.country).toHaveLength(3);
    // …while the lineage facet narrows to Germany's rows.
    expect(state.facets.pangoLineage).toEqual([
      { value: 'JN.1', count: 1 },
      { value: 'XBB.1.5', count: 1 },
    ]);
  });

  it('keeps a selected value pinned in its facet even when nothing else matches it', () => {
    const { engine, lastState } = setup();
    const many: DetailRowT[] = Array.from({ length: 10 }, (_, index) => ({ country: `C${index}`, pangoLineage: 'A' }));
    engine.handle({ type: 'load', rows: [...many, ...many, { country: 'Rare', pangoLineage: 'B' }] });
    engine.handle({ type: 'query', filter: withFacets({ country: ['Rare', 'Missing'] }) });

    const values = lastState().facets.country.map((entry) => entry.value);
    expect(values).toHaveLength(10); // top 8 + two pinned selections
    expect(values).toContain('Rare');
    expect(lastState().facets.country.find((entry) => entry.value === 'Missing')?.count).toBe(0);
  });

  it('returns only the requested window of matched rows', () => {
    const { engine, lastOf } = setup();
    engine.handle({ type: 'load', rows: detailRows });
    engine.handle({ type: 'query', filter: withFacets({ pangoLineage: ['JN.1'] }) });
    engine.handle({ type: 'window', start: 1, count: 5 });

    const window = lastOf('window');
    expect(window?.start).toBe(1);
    expect(window?.rows.map((row) => row.genbankAccession)).toEqual(['OQ000003']);
  });

  it('builds a CSV of the matched rows, capped at the export limit', () => {
    const { engine, lastOf } = setup();
    engine.handle({ type: 'load', rows: detailRows });
    engine.handle({ type: 'export', limit: 2 });

    const lines = lastOf('export')?.csv.split('\n') ?? [];
    expect(lines[0]).toBe('genbankAccession,date,country,region,pangoLineage,host');
    expect(lines).toHaveLength(3);
  });

  it('pages the slice in from LAPIS, emitting progress after each page', async () => {
    const { engine, messages, lastState } = setup();
    await engine.handle({ type: 'fetch', params: { country: 'Germany' }, target: 4, pageSize: 2 });

    const states = messages.filter((message) => message.type === 'state');
    expect(states.length).toBeGreaterThanOrEqual(3); // reset + one per page
    expect(lastState()).toMatchObject({ loaded: 4, matched: 4, done: true });
  });

  it('stops early when LAPIS returns a short page', async () => {
    const { engine, lastState } = setup();
    await engine.handle({ type: 'fetch', params: {}, target: 1_000, pageSize: 3 });
    expect(lastState()).toMatchObject({ loaded: 4, done: true });
  });

  it('reports a fetch failure as an error message', async () => {
    server.use(http.get(`${LAPIS}/sample/details`, () => new HttpResponse(null, { status: 503, statusText: 'Down' })));
    const { engine, lastOf } = setup();
    await engine.handle({ type: 'fetch', params: {}, target: 10, pageSize: 5 });
    expect(lastOf('error')?.message).toBe('LAPIS request failed: 503 Down');
  });

  it('abandons a superseded fetch so two loops never append to the same slice', async () => {
    const { engine, lastState } = setup();
    const first = engine.handle({ type: 'fetch', params: {}, target: 4, pageSize: 2 });
    const second = engine.handle({ type: 'fetch', params: {}, target: 4, pageSize: 2 });
    await Promise.all([first, second]);
    expect(lastState().loaded).toBe(4);
  });
});
