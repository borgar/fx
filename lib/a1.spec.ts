/* eslint-disable @stylistic/object-property-newline */
import { describe, test, expect } from 'vitest';
import { toRelative, toAbsolute, toA1 } from './a1.ts';
import { MAX_COLS, MAX_ROWS } from './constants.ts';
import type { RangeA1 } from './extraTypes.ts';

describe('A1 serialization', () => {
  test('cell references: A1', () => {
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2 })).toBe('C10');
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true })).toBe('C$10');
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2, $left: true, $right: true })).toBe('$C10');
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true, $left: true, $right: true })).toBe('$C$10');
  });

  test('rectangle references: A1:B2', () => {
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4 })).toBe('E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $right: true })).toBe('E3:$E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $top: true })).toBe('E$3:E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $left: true })).toBe('$E3:E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true })).toBe('E3:E$3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true, $right: true })).toBe('E3:$E$3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 5 })).toBe('E3:F3');
    expect(toA1({ top: 2, bottom: 3, left: 4, right: 4 })).toBe('E3:E4');
    expect(toA1({ top: 2, bottom: 3, left: 4, right: 5 })).toBe('E3:F4');
  });

  test('beam references: A:A 1:1', () => {
    expect(toA1({ left: 0, right: 0 })).toBe('A:A');
    expect(toA1({ top: 0, bottom: MAX_ROWS, left: 0, right: 0 })).toBe('A:A');
    expect(toA1({ left: 10, right: 15 })).toBe('K:P');
    expect(toA1({ left: 10, right: 15, $left: true })).toBe('$K:P');
    expect(toA1({ left: 10, right: 15, $right: true })).toBe('K:$P');
    expect(toA1({ left: 10, right: 15, $left: true, $right: true })).toBe('$K:$P');
    expect(toA1({ top: 0, bottom: 0 })).toBe('1:1');
    expect(toA1({ top: 0, bottom: 0, left: 0, right: MAX_COLS })).toBe('1:1');
    expect(toA1({ top: 10, bottom: 15 })).toBe('11:16');
    expect(toA1({ top: 10, bottom: 15, $top: true })).toBe('$11:16');
    expect(toA1({ top: 10, bottom: 15, $bottom: true })).toBe('11:$16');
    expect(toA1({ top: 10, bottom: 15, $top: true, $bottom: true })).toBe('$11:$16');
  });

  test('partial references: B1:C B2:3', () => {
    expect(toA1({ top: 9, left: 0, right: 0 })).toBe('A10:A');
    expect(toA1({ bottom: 9, left: 0, right: 0 })).toBe('A10:A');
    expect(toA1({ top: 9, left: 0, right: 0, $top: true })).toBe('A$10:A');
    expect(toA1({ top: 9, left: 0, right: 0, $left: true })).toBe('$A10:A');
    expect(toA1({ top: 9, left: 0, right: 0, $right: true })).toBe('A10:$A');
    expect(toA1({ top: 0, left: 3, bottom: 0 })).toBe('D1:1');
    expect(toA1({ top: 0, right: 3, bottom: 0 })).toBe('D1:1');
    expect(toA1({ top: 0, left: 3, bottom: 0, $top: true })).toBe('D$1:1');
    expect(toA1({ top: 0, left: 3, bottom: 0, $left: true })).toBe('$D1:1');
    expect(toA1({ top: 0, left: 3, bottom: 0, $left: true })).toBe('$D1:1');
  });

  test('edge cases', () => {
    // allow skipping right/bottom for cells
    expect(toA1({ top: 0, left: 0 })).toBe('A1');
    // clamp the range at min/max dimensions
    expect(toA1({ top: -10, bottom: -5, left: -10, right: -5 })).toBe('A1');
    expect(toA1({ top: 15e5, bottom: 15e5, left: 20000, right: 20000 })).toBe('XFD1048576');
    expect(toA1({ top: 2, bottom: 2, left: 2.5, right: 2.5 })).toBe('C3');
    expect(toA1({ top: 1.5, bottom: 2.5, left: 4.5, right: 8.5 })).toBe('E2:I3');
  });

  test('trimming', () => {
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, trim: 'both' })).toBe('E3');
    expect(toA1({ top: 2, bottom: 3, left: 4, right: 6, trim: 'both' })).toBe('E3.:.G4');
    expect(toA1({ top: 2, bottom: 3, trim: 'both' })).toBe('3.:.4');
    expect(toA1({ left: 4, right: 6, trim: 'both' })).toBe('E.:.G');
    expect(toA1({ top: 9, left: 0, right: 0, trim: 'tail' })).toBe('A10:.A');
    expect(toA1({ top: 9, left: 0, right: 0, trim: 'head' })).toBe('A10.:A');
    expect(toA1({ top: 9, left: 0, right: 0, trim: 'both' })).toBe('A10.:.A');
  });
});

describe('A1 utilities', () => {
  test('toAbsolute and toRelative', () => {
    const relA1Range = {
      top: 0, left: 0, bottom: 0, right: 0,
      $top: false, $left: false, $bottom: false, $right: false
    };
    const absA1Range = {
      top: 0, left: 0, bottom: 0, right: 0,
      $top: true, $left: true, $bottom: true, $right: true
    };
    expect(toAbsolute(relA1Range)).toEqual(absA1Range);
    expect(toRelative(absA1Range)).toEqual(relA1Range);

    const relA1RangeT: RangeA1 = {
      top: 0, left: 0, bottom: 0, right: 0,
      $top: false, $left: false, $bottom: false, $right: false,
      trim: 'both'
    };
    const absA1RangeT: RangeA1 = {
      top: 0, left: 0, bottom: 0, right: 0,
      $top: true, $left: true, $bottom: true, $right: true,
      trim: 'both'
    };
    expect(toAbsolute(relA1RangeT)).toEqual(absA1RangeT);
    expect(toRelative(absA1RangeT)).toEqual(relA1RangeT);
  });
});
