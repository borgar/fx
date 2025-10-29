import { describe, test, expect } from 'vitest';
import { fromCol } from './fromCol.ts';

describe('fromCol parses column id strings to numbers', () => {
  test('single letter columns', () => {
    expect(fromCol('a')).toBe(0);
    expect(fromCol('A')).toBe(0);
  });

  test('multi-letter columns', () => {
    expect(fromCol('AA')).toBe(26);
    expect(fromCol('zz')).toBe(701);
    expect(fromCol('ZZZ')).toBe(18277);
  });
});
