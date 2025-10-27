/* eslint-disable object-property-newline */
import { describe, test, expect } from 'vitest';
import { fromRow, fromA1 } from './fromA1.js';

describe('fromRow', () => {
  test('fromRow converts row strings to zero-based indices', () => {
    expect(fromRow('1')).toBe(0);
    expect(fromRow('2')).toBe(1);
    expect(fromRow('10')).toBe(9);
    expect(fromRow('100')).toBe(99);
    expect(fromRow('9999999')).toBe(9999998);
  });
});

describe('fromA1', () => {
  test('fromA1 parses simple cell references', () => {
    expect(fromA1('A1')).toEqual({
      top: 0, left: 0, bottom: 0, right: 0,
      $top: false, $left: false, $bottom: false, $right: false
    });

    expect(fromA1('B2')).toEqual({
      top: 1, left: 1, bottom: 1, right: 1,
      $top: false, $left: false, $bottom: false, $right: false
    });

    expect(fromA1('Z10')).toEqual({
      top: 9, left: 25, bottom: 9, right: 25,
      $top: false, $left: false, $bottom: false, $right: false
    });

    expect(fromA1('AA100')).toEqual({
      top: 99, left: 26, bottom: 99, right: 26,
      $top: false, $left: false, $bottom: false, $right: false
    });
  });
});

test('fromA1 parses absolute cell references', () => {
  expect(fromA1('$A$1')).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: true, $bottom: true, $right: true
  });

  expect(fromA1('$A1')).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: true, $bottom: false, $right: true
  });

  expect(fromA1('A$1')).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: false, $bottom: true, $right: false
  });
});

test('fromA1 parses range references', () => {
  expect(fromA1('A1:B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('A1:Z10')).toEqual({
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('B2:D4')).toEqual({
    top: 1, left: 1, bottom: 3, right: 3,
    $top: false, $left: false, $bottom: false, $right: false
  });
});

test('fromA1 parses range references with mixed absolute/relative', () => {
  expect(fromA1('$A$1:B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: true, $left: true, $bottom: false, $right: false
  });

  expect(fromA1('A1:$B$2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: true, $right: true
  });

  expect(fromA1('$A1:B$2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: true, $bottom: true, $right: false
  });
});

test('fromA1 normalizes reversed ranges', () => {
  expect(fromA1('B2:A1')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('Z10:A1')).toEqual({
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });
});

test('fromA1 parses column ranges', () => {
  expect(fromA1('A:A')).toEqual({
    top: null, left: 0, bottom: null, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('A:C')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('C:A')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('$A:C')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: true, $bottom: false, $right: false
  });

  expect(fromA1('A:$C')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: true
  });
});

test('fromA1 parses row ranges', () => {
  expect(fromA1('1:1')).toEqual({
    top: 0, left: null, bottom: 0, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('1:3')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('3:1')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('$1:3')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: true, $left: false, $bottom: false, $right: false
  });

  expect(fromA1('1:$3')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: true, $right: false
  });
});

test('fromA1 parses trimmed ranges', () => {
  expect(fromA1('A1.:B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'head'
  });

  expect(fromA1('A1:.B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'tail'
  });

  expect(fromA1('A1.:.B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'both'
  });
});

test('fromA1 handles partial column ranges', () => {
  const range = {
    top: 0, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  };
  expect(fromA1('A1:C')).toEqual(range);
  expect(fromA1('C:A1')).toEqual(range);
});

test('fromA1 handles partial row ranges', () => {
  const range = {
    top: 0, left: 0, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  };
  expect(fromA1('A1:3')).toEqual(range);
  expect(fromA1('3:A1')).toEqual(range);
});

test('fromA1 returns null for invalid references', () => {
  expect(fromA1('')).toBe(null);
  expect(fromA1('A')).toBe(null);
  expect(fromA1('1')).toBe(null);
  expect(fromA1('$A')).toBe(null);
  expect(fromA1('$1')).toBe(null);
  expect(fromA1('AAAA1')).toBe(null);
  expect(fromA1('A0')).toBe(null);
  expect(fromA1('A10000000')).toBe(null);
  expect(fromA1('123ABC')).toBe(null);
  expect(fromA1('A1:B2:C3')).toBe(null);
  expect(fromA1('A1::B2')).toBe(null);
  expect(fromA1('A1B2')).toBe(null);
  expect(fromA1('$$$A1')).toBe(null);
});

test('fromA1 handles maximum valid values', () => {
  expect(fromA1('XFD1048576')).toEqual({
    top: 1048575, left: 16383, bottom: 1048575, right: 16383,
    $top: false, $left: false, $bottom: false, $right: false
  });
  expect(fromA1('XFD1048577')).toBe(null);
  expect(fromA1('XFE1048576')).toBe(null);
});

test('fromA1 handles case insensitivity', () => {
  const lower = fromA1('a1');
  const upper = fromA1('A1');
  const mixed = fromA1('aA1');

  expect(lower).toEqual(upper);
  expect(lower).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  });
  expect(mixed).toEqual({
    top: 0, left: 26, bottom: 0, right: 26,
    $top: false, $left: false, $bottom: false, $right: false
  });
});
