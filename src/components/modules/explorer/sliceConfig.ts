// Shared config for the large client-side sample slice.
// Imported by both the crossfilter worker (fetch loop) and the React hooks —
// keep it dependency-free (no React) so the worker bundle stays lean.

/** Columns fetched per sample (kept lean to bound payload size). */
export const SAMPLE_FIELDS = ['genbankAccession', 'date', 'country', 'region', 'pangoLineage', 'host'];

/** Total rows pulled into the worker for client-side crossfiltering. */
export const SLICE_TARGET = 2_000_000;

/** Rows per LAPIS page — ~6.9 MB / ~0.7s each at this width. */
export const SLICE_PAGE_SIZE = 50_000;
