/* eslint-disable object-property-newline */
import { test } from 'tape';
import { fromRow, fromA1 } from './fromA1.js';

test('fromRow converts row strings to zero-based indices', t => {
  t.is(fromRow('1'), 0, '1');
  t.is(fromRow('2'), 1, '2');
  t.is(fromRow('10'), 9, '10');
  t.is(fromRow('100'), 99, '100');
  t.is(fromRow('9999999'), 9999998, '9999999');
  t.end();
});

test('fromA1 parses simple cell references', t => {
  t.deepEqual(fromA1('A1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'A1');

  t.deepEqual(fromA1('B2'), {
    top: 1, left: 1, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'B2');

  t.deepEqual(fromA1('Z10'), {
    top: 9, left: 25, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'Z10');

  t.deepEqual(fromA1('AA100'), {
    top: 99, left: 26, bottom: 99, right: 26,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'AA100');

  t.end();
});

test('fromA1 parses absolute cell references', t => {
  t.deepEqual(fromA1('$A$1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: true, $bottom: true, $right: true
  }, '$A$1');

  t.deepEqual(fromA1('$A1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: true, $bottom: false, $right: true
  }, '$A1');

  t.deepEqual(fromA1('A$1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: false, $bottom: true, $right: false
  }, 'A$1');

  t.end();
});

test('fromA1 parses range references', t => {
  t.deepEqual(fromA1('A1:B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'A1:B2');

  t.deepEqual(fromA1('A1:Z10'), {
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'A1:Z10');

  t.deepEqual(fromA1('B2:D4'), {
    top: 1, left: 1, bottom: 3, right: 3,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'B2:D4');

  t.end();
});

test('fromA1 parses range references with mixed absolute/relative', t => {
  t.deepEqual(fromA1('$A$1:B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: true, $left: true, $bottom: false, $right: false
  }, '$A$1:B2');

  t.deepEqual(fromA1('A1:$B$2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: true, $right: true
  }, 'A1:$B$2');

  t.deepEqual(fromA1('$A1:B$2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: true, $bottom: true, $right: false
  }, '$A1:B$2');

  t.end();
});

test('fromA1 normalizes reversed ranges', t => {
  t.deepEqual(fromA1('B2:A1'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'B2:A1');

  t.deepEqual(fromA1('Z10:A1'), {
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'Z10:A1');

  t.end();
});

test('fromA1 parses column ranges', t => {
  t.deepEqual(fromA1('A:A'), {
    top: null, left: 0, bottom: null, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'A:A');

  t.deepEqual(fromA1('A:C'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'A:C');

  t.deepEqual(fromA1('C:A'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'C:A');

  t.deepEqual(fromA1('$A:C'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: true, $bottom: false, $right: false
  }, '$A:C');

  t.deepEqual(fromA1('A:$C'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: true
  }, 'A:$C');

  t.end();
});

test('fromA1 parses row ranges', t => {
  t.deepEqual(fromA1('1:1'), {
    top: 0, left: null, bottom: 0, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  }, '1:1');

  t.deepEqual(fromA1('1:3'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  }, '1:3');

  t.deepEqual(fromA1('3:1'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  }, '3:1');

  t.deepEqual(fromA1('$1:3'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: true, $left: false, $bottom: false, $right: false
  }, '$1:3');

  t.deepEqual(fromA1('1:$3'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: true, $right: false
  }, '1:$3');

  t.end();
});

test('fromA1 parses trimmed ranges', t => {
  t.deepEqual(fromA1('A1.:B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'head'
  }, 'A1.:B2');

  t.deepEqual(fromA1('A1:.B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'tail'
  }, 'A1:.B2');

  t.deepEqual(fromA1('A1.:.B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'both'
  }, 'A1.:.B2');

  t.end();
});

test('fromA1 handles partial column ranges', t => {
  const range = {
    top: 0, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  };
  t.deepEqual(fromA1('A1:C'), range, 'A1:C');
  t.deepEqual(fromA1('C:A1'), range, 'C:A1');
  t.end();
});

test('fromA1 handles partial row ranges', t => {
  const range = {
    top: 0, left: 0, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  };
  t.deepEqual(fromA1('A1:3'), range, 'A1:3');
  t.deepEqual(fromA1('3:A1'), range, '3:A1');
  t.end();
});

test('fromA1 returns null for invalid references', t => {
  t.is(fromA1(''), null, '');
  t.is(fromA1('A'), null, 'A');
  t.is(fromA1('1'), null, '1');
  t.is(fromA1('$A'), null, '$A');
  t.is(fromA1('$1'), null, '$1');
  t.is(fromA1('AAAA1'), null, 'AAAA1');
  t.is(fromA1('A0'), null, 'A0');
  t.is(fromA1('A10000000'), null, 'A10000000');
  t.is(fromA1('123ABC'), null, '123ABC');
  t.is(fromA1('A1:B2:C3'), null, 'A1:B2:C3');
  t.is(fromA1('A1::B2'), null, 'A1::B2');
  t.is(fromA1('A1B2'), null, 'A1B2');
  t.is(fromA1('$$$A1'), null, '$$$A1');
  t.end();
});

test('fromA1 handles maximum valid values', t => {
  t.deepEqual(fromA1('XFD1048576'), {
    top: 1048575, left: 16383, bottom: 1048575, right: 16383,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'XFD1048576');
  t.deepEqual(fromA1('XFD1048577'), null, 'XFD1048577');
  t.deepEqual(fromA1('XFE1048576'), null, 'XFE1048576');
  t.end();
});

test('fromA1 handles case insensitivity', t => {
  const lower = fromA1('a1');
  const upper = fromA1('A1');
  const mixed = fromA1('aA1');

  t.deepEqual(lower, upper, 'a1 equals A1');
  t.deepEqual(lower, {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'a1');
  t.deepEqual(mixed, {
    top: 0, left: 26, bottom: 0, right: 26,
    $top: false, $left: false, $bottom: false, $right: false
  }, 'aA1');

  t.end();
});

