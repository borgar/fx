/* eslint-disable @stylistic/object-property-newline */
import { describe, test, expect } from 'vitest';
import { fromRow, parseA1Range } from './parseA1Range.ts';

describe('fromRow', () => {
  test('fromRow converts row strings to zero-based indices', () => {
    expect(fromRow('1')).toBe(0);
    expect(fromRow('2')).toBe(1);
    expect(fromRow('10')).toBe(9);
    expect(fromRow('100')).toBe(99);
    expect(fromRow('9999999')).toBe(9999998);
  });
});

describe('parseA1Range', () => {
  test('parseA1Range parses simple cell references', () => {
    expect(parseA1Range('A1')).toEqual({
      top: 0, left: 0, bottom: 0, right: 0,
      $top: false, $left: false, $bottom: false, $right: false
    });

    expect(parseA1Range('B2')).toEqual({
      top: 1, left: 1, bottom: 1, right: 1,
      $top: false, $left: false, $bottom: false, $right: false
    });

    expect(parseA1Range('Z10')).toEqual({
      top: 9, left: 25, bottom: 9, right: 25,
      $top: false, $left: false, $bottom: false, $right: false
    });

    expect(parseA1Range('AA100')).toEqual({
      top: 99, left: 26, bottom: 99, right: 26,
      $top: false, $left: false, $bottom: false, $right: false
    });
  });
});

test('parseA1Range parses absolute cell references', () => {
  expect(parseA1Range('$A$1')).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: true, $bottom: true, $right: true
  });

  expect(parseA1Range('$A1')).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: true, $bottom: false, $right: true
  });

  expect(parseA1Range('A$1')).toEqual({
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: false, $bottom: true, $right: false
  });
});

test('parseA1Range parses range references', () => {
  expect(parseA1Range('A1:B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('A1:Z10')).toEqual({
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('B2:D4')).toEqual({
    top: 1, left: 1, bottom: 3, right: 3,
    $top: false, $left: false, $bottom: false, $right: false
  });
});

test('parseA1Range parses range references with mixed absolute/relative', () => {
  expect(parseA1Range('$A$1:B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: true, $left: true, $bottom: false, $right: false
  });

  expect(parseA1Range('A1:$B$2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: true, $right: true
  });

  expect(parseA1Range('$A1:B$2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: true, $bottom: true, $right: false
  });
});

test('parseA1Range normalizes reversed ranges', () => {
  expect(parseA1Range('B2:A1')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('Z10:A1')).toEqual({
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });
});

test('parseA1Range parses column ranges', () => {
  expect(parseA1Range('A:A')).toEqual({
    top: null, left: 0, bottom: null, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('A:C')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('C:A')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('$A:C')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: true, $bottom: false, $right: false
  });

  expect(parseA1Range('A:$C')).toEqual({
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: true
  });
});

test('parseA1Range parses row ranges', () => {
  expect(parseA1Range('1:1')).toEqual({
    top: 0, left: null, bottom: 0, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('1:3')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('3:1')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('$1:3')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: true, $left: false, $bottom: false, $right: false
  });

  expect(parseA1Range('1:$3')).toEqual({
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: true, $right: false
  });
});

test('parseA1Range parses trimmed ranges', () => {
  expect(parseA1Range('A1.:B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'head'
  });

  expect(parseA1Range('A1:.B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'tail'
  });

  expect(parseA1Range('A1.:.B2')).toEqual({
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'both'
  });
});

test('parseA1Range handles partial column ranges', () => {
  const range = {
    top: 0, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  };
  expect(parseA1Range('A1:C')).toEqual(range);
  expect(parseA1Range('C:A1')).toEqual(range);
});

test('parseA1Range handles partial row ranges', () => {
  const range = {
    top: 0, left: 0, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  };
  expect(parseA1Range('A1:3')).toEqual(range);
  expect(parseA1Range('3:A1')).toEqual(range);
});

test('parseA1Range returns null for invalid references', () => {
  expect(parseA1Range('')).toBe(undefined);
  expect(parseA1Range('A')).toBe(undefined);
  expect(parseA1Range('1')).toBe(undefined);
  expect(parseA1Range('$A')).toBe(undefined);
  expect(parseA1Range('$1')).toBe(undefined);
  expect(parseA1Range('AAAA1')).toBe(undefined);
  expect(parseA1Range('A0')).toBe(undefined);
  expect(parseA1Range('A10000000')).toBe(undefined);
  expect(parseA1Range('123ABC')).toBe(undefined);
  expect(parseA1Range('A1:B2:C3')).toBe(undefined);
  expect(parseA1Range('A1::B2')).toBe(undefined);
  expect(parseA1Range('A1B2')).toBe(undefined);
  expect(parseA1Range('$$$A1')).toBe(undefined);
});

test('parseA1Range handles maximum valid values', () => {
  expect(parseA1Range('XFD1048576')).toEqual({
    top: 1048575, left: 16383, bottom: 1048575, right: 16383,
    $top: false, $left: false, $bottom: false, $right: false
  });
  expect(parseA1Range('XFD1048577')).toBe(undefined);
  expect(parseA1Range('XFE1048576')).toBe(undefined);
});

test('parseA1Range handles case insensitivity', () => {
  const lower = parseA1Range('a1');
  const upper = parseA1Range('A1');
  const mixed = parseA1Range('aA1');

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
