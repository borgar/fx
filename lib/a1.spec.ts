/* eslint-disable @stylistic/object-property-newline */
import { describe, test, expect } from 'vitest';
import { toRelative, toAbsolute } from './a1.ts';
import type { RangeA1 } from './types.ts';

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
