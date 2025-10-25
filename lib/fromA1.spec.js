/* eslint-disable object-property-newline */
import { test } from 'tape';
import { fromRow, fromA1 } from './fromA1.js';

test('fromRow converts row strings to zero-based indices', t => {
  t.is(fromRow('1'), 0);
  t.is(fromRow('2'), 1);
  t.is(fromRow('10'), 9);
  t.is(fromRow('100'), 99);
  t.is(fromRow('9999999'), 9999998);
  t.end();
});

test('fromA1 parses simple cell references', t => {
  t.deepEqual(fromA1('A1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('B2'), {
    top: 1, left: 1, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('Z10'), {
    top: 9, left: 25, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('AA100'), {
    top: 99, left: 26, bottom: 99, right: 26,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});

test('fromA1 parses absolute cell references', t => {
  t.deepEqual(fromA1('$A$1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: true, $bottom: true, $right: true
  });

  t.deepEqual(fromA1('$A1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: true, $bottom: false, $right: true
  });

  t.deepEqual(fromA1('A$1'), {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: false, $bottom: true, $right: false
  });

  t.end();
});

test('fromA1 parses range references', t => {
  t.deepEqual(fromA1('A1:B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('A1:Z10'), {
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('B2:D4'), {
    top: 1, left: 1, bottom: 3, right: 3,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});

test('fromA1 parses range references with mixed absolute/relative', t => {
  t.deepEqual(fromA1('$A$1:B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: true, $left: true, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('A1:$B$2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: true, $right: true
  });

  t.deepEqual(fromA1('$A1:B$2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: true, $bottom: true, $right: false
  });

  t.end();
});

test('fromA1 normalizes reversed ranges', t => {
  t.deepEqual(fromA1('B2:A1'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('Z10:A1'), {
    top: 0, left: 0, bottom: 9, right: 25,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});

test('fromA1 parses column ranges', t => {
  t.deepEqual(fromA1('A:A'), {
    top: null, left: 0, bottom: null, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('A:C'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('C:A'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('$A:C'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: true, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('A:$C'), {
    top: null, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: true
  });

  t.end();
});

test('fromA1 parses row ranges', t => {
  t.deepEqual(fromA1('1:1'), {
    top: 0, left: null, bottom: 0, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('1:3'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('3:1'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('$1:3'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: true, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('1:$3'), {
    top: 0, left: null, bottom: 2, right: null,
    $top: false, $left: false, $bottom: true, $right: false
  });

  t.end();
});

test('fromA1 parses trimmed ranges', t => {
  t.deepEqual(fromA1('A1.:B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'head'
  });

  t.deepEqual(fromA1('A1:.B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'tail'
  });

  t.deepEqual(fromA1('A1.:.B2'), {
    top: 0, left: 0, bottom: 1, right: 1,
    $top: false, $left: false, $bottom: false, $right: false,
    trim: 'both'
  });

  t.end();
});

test('fromA1 handles partial column ranges', t => {
  t.deepEqual(fromA1('A1:C'), {
    top: 0, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('C:A1'), {
    top: 0, left: 0, bottom: null, right: 2,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});

test('fromA1 handles partial row ranges', t => {
  t.deepEqual(fromA1('A1:3'), {
    top: 0, left: 0, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.deepEqual(fromA1('3:A1'), {
    top: 0, left: 0, bottom: 2, right: null,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});

test('fromA1 returns null for invalid references', t => {
  t.is(fromA1(''), null);
  t.is(fromA1('A'), null);
  t.is(fromA1('1'), null);
  t.is(fromA1('$A'), null);
  t.is(fromA1('$1'), null);
  t.is(fromA1('AAAA1'), null);
  t.is(fromA1('A0'), null);
  t.is(fromA1('A10000000'), null);
  t.is(fromA1('123ABC'), null);
  t.is(fromA1('A1:B2:C3'), null);
  t.is(fromA1('A1::B2'), null);
  t.is(fromA1('A1B2'), null);
  t.is(fromA1('$$$A1'), null);
  t.end();
});

test('fromA1 handles maximum valid values', t => {
  t.deepEqual(fromA1('AAA9999999'), {
    top: 9999998, left: 702, bottom: 9999998, right: 702,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});

test('fromA1 handles case insensitivity', t => {
  const lower = fromA1('a1');
  const upper = fromA1('A1');
  const mixed = fromA1('aA1');

  t.deepEqual(lower, upper);
  t.deepEqual(lower, {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  });
  t.deepEqual(mixed, {
    top: 0, left: 26, bottom: 0, right: 26,
    $top: false, $left: false, $bottom: false, $right: false
  });

  t.end();
});
