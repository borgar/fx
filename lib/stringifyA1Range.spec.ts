import { describe, test, expect } from 'vitest';
import { stringifyA1Range } from './stringifyA1Range.ts';
import { MAX_COLS, MAX_ROWS } from './constants.ts';

describe('stringifyA1Range', () => {
  test('cell references: A1', () => {
    expect(stringifyA1Range({ top: 9, bottom: 9, left: 2, right: 2 })).toBe('C10');
    expect(stringifyA1Range({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true })).toBe('C$10');
    expect(stringifyA1Range({ top: 9, bottom: 9, left: 2, right: 2, $left: true, $right: true })).toBe('$C10');
    expect(stringifyA1Range({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true, $left: true, $right: true })).toBe('$C$10');
  });

  test('rectangle references: A1:B2', () => {
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4 })).toBe('E3');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4, $right: true })).toBe('E3:$E3');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4, $top: true })).toBe('E$3:E3');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4, $left: true })).toBe('$E3:E3');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true })).toBe('E3:E$3');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true, $right: true })).toBe('E3:$E$3');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 5 })).toBe('E3:F3');
    expect(stringifyA1Range({ top: 2, bottom: 3, left: 4, right: 4 })).toBe('E3:E4');
    expect(stringifyA1Range({ top: 2, bottom: 3, left: 4, right: 5 })).toBe('E3:F4');
  });

  test('beam references: A:A 1:1', () => {
    expect(stringifyA1Range({ left: 0, right: 0 })).toBe('A:A');
    expect(stringifyA1Range({ top: 0, bottom: MAX_ROWS, left: 0, right: 0 })).toBe('A:A');
    expect(stringifyA1Range({ left: 10, right: 15 })).toBe('K:P');
    expect(stringifyA1Range({ left: 10, right: 15, $left: true })).toBe('$K:P');
    expect(stringifyA1Range({ left: 10, right: 15, $right: true })).toBe('K:$P');
    expect(stringifyA1Range({ left: 10, right: 15, $left: true, $right: true })).toBe('$K:$P');
    expect(stringifyA1Range({ top: 0, bottom: 0 })).toBe('1:1');
    expect(stringifyA1Range({ top: 0, bottom: 0, left: 0, right: MAX_COLS })).toBe('1:1');
    expect(stringifyA1Range({ top: 10, bottom: 15 })).toBe('11:16');
    expect(stringifyA1Range({ top: 10, bottom: 15, $top: true })).toBe('$11:16');
    expect(stringifyA1Range({ top: 10, bottom: 15, $bottom: true })).toBe('11:$16');
    expect(stringifyA1Range({ top: 10, bottom: 15, $top: true, $bottom: true })).toBe('$11:$16');
  });

  test('partial references: B1:C B2:3', () => {
    expect(stringifyA1Range({ top: 9, left: 0, right: 0 })).toBe('A10:A');
    expect(stringifyA1Range({ bottom: 9, left: 0, right: 0 })).toBe('A10:A');
    expect(stringifyA1Range({ top: 9, left: 0, right: 0, $top: true })).toBe('A$10:A');
    expect(stringifyA1Range({ top: 9, left: 0, right: 0, $left: true })).toBe('$A10:A');
    expect(stringifyA1Range({ top: 9, left: 0, right: 0, $right: true })).toBe('A10:$A');
    expect(stringifyA1Range({ top: 0, left: 3, bottom: 0 })).toBe('D1:1');
    expect(stringifyA1Range({ top: 0, right: 3, bottom: 0 })).toBe('D1:1');
    expect(stringifyA1Range({ top: 0, left: 3, bottom: 0, $top: true })).toBe('D$1:1');
    expect(stringifyA1Range({ top: 0, left: 3, bottom: 0, $left: true })).toBe('$D1:1');
    expect(stringifyA1Range({ top: 0, left: 3, bottom: 0, $left: true })).toBe('$D1:1');
  });

  test('edge cases', () => {
    // allow skipping right/bottom for cells
    expect(stringifyA1Range({ top: 0, left: 0 })).toBe('A1');
    // clamp the range at min/max dimensions
    expect(stringifyA1Range({ top: -10, bottom: -5, left: -10, right: -5 })).toBe('A1');
    expect(stringifyA1Range({ top: 15e5, bottom: 15e5, left: 20000, right: 20000 })).toBe('XFD1048576');
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 2.5, right: 2.5 })).toBe('C3');
    expect(stringifyA1Range({ top: 1.5, bottom: 2.5, left: 4.5, right: 8.5 })).toBe('E2:I3');
  });

  test('trimming', () => {
    expect(stringifyA1Range({ top: 2, bottom: 2, left: 4, right: 4, trim: 'both' })).toBe('E3');
    expect(stringifyA1Range({ top: 2, bottom: 3, left: 4, right: 6, trim: 'both' })).toBe('E3.:.G4');
    expect(stringifyA1Range({ top: 2, bottom: 3, trim: 'both' })).toBe('3.:.4');
    expect(stringifyA1Range({ left: 4, right: 6, trim: 'both' })).toBe('E.:.G');
    expect(stringifyA1Range({ top: 9, left: 0, right: 0, trim: 'tail' })).toBe('A10:.A');
    expect(stringifyA1Range({ top: 9, left: 0, right: 0, trim: 'head' })).toBe('A10.:A');
    expect(stringifyA1Range({ top: 9, left: 0, right: 0, trim: 'both' })).toBe('A10.:.A');
  });
});
