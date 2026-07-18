// Tiny dependency-free CSV export. Serializes rows for a fixed column set and
// triggers a browser download.

type CellT = string | number | boolean | null | undefined;

const escapeCell = (value: CellT): string => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Serialize `rows` to CSV text, emitting only `columns` in order. */
export const toCsv = (rows: Record<string, CellT>[], columns: string[]): string => {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column])).join(',')).join('\n');
  return `${header}\n${body}`;
};

/** Download CSV text as a file. */
export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
