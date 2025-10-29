import { describe, test, expect } from 'vitest';
import { MAX_COLS, MAX_ROWS } from './constants.ts';
import { stringifyR1C1Range } from './stringifyR1C1Range.ts';

function isR1C1Rendered (range: any, expected: string) {
  expect(stringifyR1C1Range(range)).toBe(expected);
}

describe('R1C1 serialization', () => {
  test('ray serialization', () => {
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: MAX_COLS }, 'R');
    isR1C1Rendered({ r0: 0, r1: 0 }, 'R');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $r0: true, $r1: true }, 'R1');
    isR1C1Rendered({ r0: 0, r1: 0, $r0: true, $r1: true }, 'R1');
    isR1C1Rendered({ r0: 1, c0: 0, r1: 1, c1: MAX_COLS }, 'R[1]');
    isR1C1Rendered({ r0: 1, r1: 1 }, 'R[1]');

    isR1C1Rendered({ r0: 0, c0: 0, r1: MAX_ROWS, c1: 0 }, 'C');
    isR1C1Rendered({ c0: 0, c1: 0 }, 'C');
    isR1C1Rendered({ r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $c0: true, $c1: true }, 'C1');
    isR1C1Rendered({ c0: 0, c1: 0, $c0: true, $c1: true }, 'C1');
    isR1C1Rendered({ r0: 0, c0: 1, r1: MAX_ROWS, c1: 1 }, 'C[1]');
    isR1C1Rendered({ c0: 1, c1: 1 }, 'C[1]');
  });

  test('rectangle serialization', () => {
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: 0 }, 'RC');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true }, 'R1C1');
    isR1C1Rendered({ r0: 9, c0: 7, r1: 9, c1: 7, $c0: true, $c1: true, $r0: true, $r1: true }, 'R10C8');
    isR1C1Rendered({ r0: 2, c0: 0, r1: 2, c1: 0 }, 'R[2]C');
    isR1C1Rendered({ r0: -2, c0: 0, r1: -2, c1: 0 }, 'R[-2]C');
    isR1C1Rendered({ r0: 0, c0: 3, r1: 0, c1: 3 }, 'RC[3]');
    isR1C1Rendered({ r0: 0, c0: -3, r1: 0, c1: -3 }, 'RC[-3]');
    isR1C1Rendered({ r0: 2, c0: 4, r1: 2, c1: 4 }, 'R[2]C[4]');
    isR1C1Rendered({ r0: -2, c0: -4, r1: -2, c1: -4 }, 'R[-2]C[-4]');
    isR1C1Rendered({ r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true }, 'R[9]C9');
    isR1C1Rendered({ r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true }, 'R9C[9]');
  });

  test('range serialization', () => {
    isR1C1Rendered({ r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true }, 'R[1]C[1]:R1C1');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true }, 'R1C1:R2C2');
    isR1C1Rendered({ c0: 0, c1: 2, $c0: true, $c1: true }, 'C1:C3');
    isR1C1Rendered({ r0: 1, r1: 2, $r1: true }, 'R[1]:R3');
    isR1C1Rendered({ r0: 1, c0: 0, r1: 0, c1: -1, $c0: true, $r1: true }, 'R[1]C1:R1C[-1]');
  });

  test('partial serialization', () => {
    isR1C1Rendered({ r0: -5, c0: -2, c1: -2 }, 'R[-5]C[-2]:C[-2]');
    isR1C1Rendered({ r0: -5, c0: -3, r1: -5 }, 'R[-5]C[-3]:R[-5]');
    isR1C1Rendered({ r0: -6, c0: 0, c1: 0, $c0: true, $c1: true }, 'R[-6]C1:C1');
    isR1C1Rendered({ r0: -6, c0: 0, r1: -6, $c0: true, $c1: true }, 'R[-6]C1:R[-6]');
    isR1C1Rendered({ r0: 0, c0: -2, c1: -2, $r0: true, $r1: true }, 'R1C[-2]:C[-2]');
    isR1C1Rendered({ r0: 0, c0: -3, r1: 0, $r0: true, $r1: true }, 'R1C[-3]:R1');
    isR1C1Rendered({ r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C1:C1');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C1:R1');
    isR1C1Rendered({ r0: -5, c0: 10, r1: 4 }, 'R[-5]C[10]:R[4]');
    isR1C1Rendered({ r0: -6, c0: 15, r1: 3, $c0: true, $c1: true }, 'R[-6]C16:R[3]');
    isR1C1Rendered({ r0: 0, c0: 10, r1: 9, $r0: true, $r1: true }, 'R1C[10]:R10');
    isR1C1Rendered({ r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C16:R10');
  });

  test('edge cases', () => {
    // allow skipping right/bottom for cells
    isR1C1Rendered({ r0: -5, c0: -2 }, 'R[-5]C[-2]');

    // clamp the range at min/max dimensions
    const abs = { $r0: true, $c0: true, $r1: true, $c1: true };
    isR1C1Rendered({ r0: 1, c0: -20000, r1: 1, c1: 20000, ...abs }, 'R2');
    isR1C1Rendered({ r0: -15e5, c0: 1, r1: 15e5, c1: 1, ...abs }, 'C2');
    isR1C1Rendered({ r0: -5, c0: -2, r1: -8, c1: -7, ...abs }, 'R1C1');
    isR1C1Rendered({ r0: 0, c0: -20000, r1: 0, c1: 20000 }, 'RC[-16383]:RC[16383]');
    isR1C1Rendered({ r0: -15e5, c0: 0, r1: 15e5, c1: 0 }, 'R[-1048575]C:R[1048575]C');
    isR1C1Rendered({ r0: 0.5, c0: 0.5, r1: 0.5, c1: 0.5, ...abs }, 'R1C1');
    isR1C1Rendered({ r0: 0.5, c0: 0.5, r1: 0.5, c1: 0.5 }, 'RC');
  });

  test('trimming', () => {
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2 }, 'R[1]C[1]:R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trim: 'head' }, 'R[1]C[1].:R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trim: 'tail' }, 'R[1]C[1]:.R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trim: 'both' }, 'R[1]C[1].:.R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 1, c1: 1, trim: 'both' }, 'R[1]C[1]');
    isR1C1Rendered({ r0: 1, r1: 1 }, 'R[1]');
    isR1C1Rendered({ r0: 1, r1: 1, trim: 'head' }, 'R[1].:R[1]');
    isR1C1Rendered({ r0: 1, r1: 1, trim: 'both' }, 'R[1].:.R[1]');
    isR1C1Rendered({ c0: 1, c1: 1 }, 'C[1]');
    isR1C1Rendered({ c0: 1, c1: 1, trim: 'tail' }, 'C[1]:.C[1]');
    isR1C1Rendered({ c0: 1, c1: 1, trim: 'both' }, 'C[1].:.C[1]');
    isR1C1Rendered({ r0: -5, c0: -2, c1: -2, trim: 'both' }, 'R[-5]C[-2].:.C[-2]');
  });
});
