import { describe, it, expect } from 'vitest';
import { toCol } from './toCol.js';

describe('toCol', () => {
  it('toCol converts integers to column ids', t => {
    expect(toCol(0)).toBe('A');
    expect(toCol(26)).toBe('AA');
    expect(toCol(701)).toBe('ZZ');
    expect(toCol(18277)).toBe('ZZZ');
  });
});
