import { describe, expect, it } from 'vitest';

import { toCsv } from '@/lib/csv';

describe('toCsv', () => {
  it('emits a header row followed by one line per row', () => {
    const csv = toCsv([{ a: '1', b: '2' }], ['a', 'b']);
    expect(csv).toBe('a,b\n1,2');
  });

  it('emits only the requested columns, in order', () => {
    const csv = toCsv([{ a: '1', b: '2', c: '3' }], ['c', 'a']);
    expect(csv).toBe('c,a\n3,1');
  });

  it('renders null and undefined cells as empty strings', () => {
    const csv = toCsv([{ a: null, b: undefined }], ['a', 'b']);
    expect(csv).toBe('a,b\n,');
  });

  it('quotes and escapes cells containing commas, quotes, or newlines', () => {
    const csv = toCsv([{ a: 'x,y', b: 'she said "hi"', c: 'line1\nline2' }], ['a', 'b', 'c']);
    expect(csv).toBe('a,b,c\n"x,y","she said ""hi""","line1\nline2"');
  });

  it('leaves plain cells unquoted', () => {
    const csv = toCsv([{ a: 'plain' }], ['a']);
    expect(csv).toBe('a\nplain');
  });
});
