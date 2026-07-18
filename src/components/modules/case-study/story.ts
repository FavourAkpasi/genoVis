import type { QueryParamsT } from '@/lib/endpoints';

/**
 * The guided narrative is data-driven: every scene below is one scroll step.
 * Editing this array re-authors the whole story — copy, which chart renders,
 * and the LAPIS params fed to it. Windows are fixed historical dates, so the
 * charts are stable across time (2021 data does not change).
 *
 * Facts were verified against live LAPIS on 2026-07-18 for these exact windows:
 * the top lineages the stacked chart renders, and BA.1's spike-mutation count.
 */

export type StoryChartT = 'lineage-over-time' | 'mutation-scatter' | 'kpi-row';

export interface SceneT {
  id: string;
  /** Small eyebrow label above the title. */
  kicker: string;
  title: string;
  /** One entry per paragraph. */
  body: string[];
  chart: StoryChartT;
  params: QueryParamsT;
  /** Only meaningful for the lineage chart — highlights one band, dims the rest. */
  activeLineage?: string;
}

// Worldwide, so the counts stay global and the story is not skewed to one country.
const DELTA_ERA: QueryParamsT = { dateFrom: '2021-05-01', dateTo: '2021-11-30' };
const HANDOVER: QueryParamsT = { dateFrom: '2021-05-01', dateTo: '2022-05-31' };
const OMICRON_WINDOW: QueryParamsT = { dateFrom: '2021-11-01', dateTo: '2022-05-31' };

export const STORY: SceneT[] = [
  {
    id: 'baseline',
    kicker: 'Mid 2021',
    title: 'A world of Delta',
    body: [
      'Each vertical slice of this chart is a moment in time. Its full height is split by lineage — a genetic label for one branch of the virus’s family tree — so the bands show each lineage’s share of sequenced samples, not raw counts.',
      'Through 2021 the picture barely moves. The largest bands — AY.4, AY.103 and their siblings — are all descendants of Delta, the variant that defined that year. One family owns the chart.',
    ],
    chart: 'lineage-over-time',
    params: DELTA_ERA,
  },
  {
    id: 'newcomers',
    kicker: 'Winter 2021 → 2022',
    title: 'Three newcomers',
    body: [
      'Now the window stretches into 2022, and the composition reorganises itself. Three bands that were absent before — BA.1, BA.1.1 and BA.2 — surge up out of the baseline.',
      'These are Omicron. In a matter of weeks they go from invisible to dominant, squeezing the Delta bands (the AY.* family) down into a thin strip along the bottom.',
    ],
    chart: 'lineage-over-time',
    params: HANDOVER,
  },
  {
    id: 'handover',
    kicker: '≈ 10 weeks',
    title: 'The fastest handover',
    body: [
      'Focus on a single newcomer — BA.1.1 — and the scale of the shift is obvious. On its own it grew to rival AY.4, the largest Delta lineage the world had ever sequenced, but it did it in a fraction of the time.',
      'This was one of the fastest lineage replacements ever recorded. Tap the same band in the Explorer and it filters every chart at once — this focus interaction is that engine, running on a preset.',
    ],
    chart: 'lineage-over-time',
    params: HANDOVER,
    activeLineage: 'BA.1.1',
  },
  {
    id: 'spike',
    kicker: 'Why so fast?',
    title: 'It’s in the spike',
    body: [
      'Speed like that needs a reason. This scatter plots every amino-acid mutation Omicron (BA.1) carries: each dot is one change, placed left-to-right by where it sits along the genome and bottom-to-top by how consistently it shows up.',
      'The dots pile up over S — the spike gene. More than thirty spike mutations reshaped the exact protein our vaccines and prior infections had trained the immune system to recognise, letting the variant slip past those defences and spread.',
    ],
    chart: 'mutation-scatter',
    params: { ...OMICRON_WINDOW, pangoLineage: 'BA.1' },
  },
  {
    id: 'scale',
    kicker: 'At scale',
    title: 'Drawn live, in your browser',
    body: [
      'None of this is pre-baked. GenoVis reads straight from the open LAPIS database — roughly 9.4 million sequenced samples — and filters, aggregates and renders every view on the fly.',
      'The figures below are the real size of this one slice of the story: the full Delta-to-Omicron handover, worldwide.',
    ],
    chart: 'kpi-row',
    params: HANDOVER,
  },
];
