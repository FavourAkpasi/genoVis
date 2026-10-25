// Small, deterministic LAPIS payloads served by the MSW handlers.

import type { AggregatedRowT, DetailRowT, MutationRowT } from '@/types/lapis';

export const TOTAL_COUNT = 12_345;

export const dateRows: AggregatedRowT[] = [
  { date: '2024-01-01', count: 10 },
  { date: '2024-01-02', count: 30 },
  { date: '2024-01-03', count: 20 },
];

export const countryRows: AggregatedRowT[] = [
  { country: 'Germany', count: 600 },
  { country: 'USA', count: 900 },
  { country: null, count: 5 },
];

export const regionRows: AggregatedRowT[] = [
  { region: 'Europe', count: 700 },
  { region: 'North America', count: 900 },
];

export const lineageRows: AggregatedRowT[] = [
  { pangoLineage: 'JN.1', count: 500 },
  { pangoLineage: 'BA.2', count: 300 },
  { pangoLineage: 'XBB.1.5', count: 200 },
  { pangoLineage: null, count: 7 },
];

export const lineageDateRows: AggregatedRowT[] = [
  { date: '2024-01-01', pangoLineage: 'JN.1', count: 6 },
  { date: '2024-01-01', pangoLineage: 'BA.2', count: 4 },
  { date: '2024-01-02', pangoLineage: 'JN.1', count: 9 },
  { date: '2024-01-02', pangoLineage: 'BA.2', count: 1 },
];

export const aminoAcidRows: MutationRowT[] = [
  {
    mutation: 'S:N501Y',
    count: 90,
    coverage: 100,
    proportion: 0.9,
    sequenceName: 'S',
    mutationFrom: 'N',
    mutationTo: 'Y',
    position: 501,
  },
  {
    mutation: 'ORF1a:T3255I',
    count: 40,
    coverage: 100,
    proportion: 0.4,
    sequenceName: 'ORF1a',
    mutationFrom: 'T',
    mutationTo: 'I',
    position: 3255,
  },
];

export const detailRows: DetailRowT[] = [
  {
    genbankAccession: 'OQ000001',
    date: '2024-01-01',
    country: 'Germany',
    region: 'Europe',
    pangoLineage: 'JN.1',
    host: 'Homo sapiens',
  },
  {
    genbankAccession: 'OQ000002',
    date: '2024-01-02',
    country: 'USA',
    region: 'North America',
    pangoLineage: 'BA.2',
    host: 'Homo sapiens',
  },
  {
    genbankAccession: 'OQ000003',
    date: '2024-01-03',
    country: 'Brazil',
    region: 'South America',
    pangoLineage: 'JN.1',
    host: 'Felis catus',
  },
  {
    genbankAccession: 'OQ000004',
    date: '2024-01-04',
    country: 'Germany',
    region: 'Europe',
    pangoLineage: 'XBB.1.5',
    host: null,
  },
];
