/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import {
  fromCol,
  toCol,
  fromRow,
  toRow,
  toRelative,
  toAbsolute,
  parseA1Ref,
  stringifyA1Ref,
  toA1
} from './a1.js';
import { MAX_COLS, MAX_ROWS } from './constants.js';

Test.prototype.isA1Equal = function isTokens (expr, expect, opts) {
  if (expect) {
    expect = {
      sheetName: '',
      workbookName: '',
      name: '',
      range: null,
      ...expect
    };
    if (expect.range && typeof expect.range === 'object') {
      // mix in some defaults so we don't have to write things out in full
      expect.range = {
        top: null, left: null, bottom: null, right: null,
        $top: false, $left: false, $bottom: false, $right: false,
        ...expect.range
      };
    }
  }
  this.deepEqual(parseA1Ref(expr, opts), expect, expr);
};

// What happens when B2:A1 -> should work!
test('convert to and from column and row ids', t => {
  t.is(fromCol('a'), 0);
  t.is(fromCol('A'), 0);
  t.is(fromCol('AA'), 26);
  t.is(fromCol('zz'), 701);
  t.is(fromCol('ZZZ'), 18277);
  t.is(toCol(0), 'A');
  t.is(toCol(26), 'AA');
  t.is(toCol(701), 'ZZ');
  t.is(toCol(18277), 'ZZZ');
  t.is(fromRow('11'), 10);
  t.is(fromRow('1'), 0);
  t.is(toRow(12), '13');
  t.is(toRow(77), '78');
  t.end();
});

test('parse A1 references', t => {
  t.isA1Equal('A1', { range: { top: 0, left: 0, bottom: 0, right: 0 } });
  t.isA1Equal('A1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1 } });

  t.isA1Equal('$A1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1, $left: true } });
  t.isA1Equal('A$1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1, $top: true } });
  t.isA1Equal('A1:$B2', { range: { top: 0, left: 0, bottom: 1, right: 1, $right: true } });
  t.isA1Equal('A1:B$2', { range: { top: 0, left: 0, bottom: 1, right: 1, $bottom: true } });

  t.isA1Equal('A:A', { range: { left: 0, right: 0 } });
  t.isA1Equal('C:C', { range: { left: 2, right: 2 } });
  t.isA1Equal('C:$C', { range: { left: 2, right: 2, $right: true } });
  t.isA1Equal('$C:C', { range: { left: 2, right: 2, $left: true } });
  t.isA1Equal('$C:$C', { range: { left: 2, right: 2, $left: true, $right: true } });

  t.isA1Equal('1:1', { range: { top: 0, bottom: 0 } });
  t.isA1Equal('10:10', { range: { top: 9, bottom: 9 } });
  t.isA1Equal('10:$10', { range: { top: 9, bottom: 9, $bottom: true } });
  t.isA1Equal('$10:10', { range: { top: 9, bottom: 9, $top: true } });
  t.isA1Equal('$10:$10', { range: { top: 9, bottom: 9, $top: true, $bottom: true } });

  t.isA1Equal('XFD1048576', { range: { top: 1048575, left: 16383, bottom: 1048575, right: 16383 } });

  t.isA1Equal('Sheet1!A1', {
    sheetName: 'Sheet1',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });

  t.isA1Equal('\'Sheet1\'!A1', {
    sheetName: 'Sheet1',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });

  t.isA1Equal('\'Sheet1\'\'s\'!A1', {
    sheetName: 'Sheet1\'s',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });

  t.isA1Equal('[Workbook.xlsx]Sheet1!A1', {
    sheetName: 'Sheet1',
    workbookName: 'Workbook.xlsx',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });

  t.isA1Equal("'[Workbook.xlsx]Sheet1'!A1", {
    sheetName: 'Sheet1',
    workbookName: 'Workbook.xlsx',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });

  t.isA1Equal("'[Workbook.xlsx]Sheet1'!A1", {
    sheetName: 'Sheet1',
    workbookName: 'Workbook.xlsx',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });

  t.isA1Equal("='[Workbook.xlsx]Sheet1'!A1", {
    sheetName: 'Sheet1',
    workbookName: 'Workbook.xlsx',
    range: { top: 0, left: 0, bottom: 0, right: 0 }
  });
  t.isA1Equal('0123456789abcdefghijklmnopqrstuvwxyz!A1', null);

  t.isA1Equal('[Workbook.xlsx]!A1', null);
  t.isA1Equal('[Workbook.xlsx]!A1:B2', null);
  t.isA1Equal('[Workbook.xlsx]!A:A', null);
  t.isA1Equal('[Workbook.xlsx]!1:1', null);
  t.isA1Equal('[]Sheet1!A1', null);
  t.isA1Equal('namedrange', { name: 'namedrange' });

  t.isA1Equal('Workbook.xlsx!namedrange', {
    workbookName: 'Workbook.xlsx',
    name: 'namedrange'
  });

  t.isA1Equal("'Workbook.xlsx'!namedrange", {
    workbookName: 'Workbook.xlsx',
    name: 'namedrange'
  });

  t.isA1Equal('[Workbook.xlsx]!namedrange', null);
  t.isA1Equal('pensioneligibilitypartner1', { name: 'pensioneligibilitypartner1' });
  t.isA1Equal('XFE1048577', { name: 'XFE1048577' });

  // with named ranges disallowed
  t.isA1Equal('namedrange', null, { allowNamed: false });
  t.isA1Equal('Workbook.xlsx!namedrange', null, { allowNamed: false });
  t.isA1Equal('pensioneligibilitypartner1', null, { allowNamed: false });
  t.isA1Equal('XFE1048577', null, { allowNamed: false });

  t.end();
});

test('A1 partial ranges', t => {
  const opt = { allowPartials: true };
  // partials are not allowed by defult
  t.isA1Equal('A10:A', null);
  t.isA1Equal('B3:2', null);
  // unbounded bottom:
  t.isA1Equal('A10:A', { range: { top: 9, left: 0, right: 0 } }, opt);
  t.isA1Equal('A:A10', { range: { top: 9, left: 0, right: 0 } }, opt);
  t.isA1Equal('A$5:A', { range: { top: 4, left: 0, right: 0, $top: true } }, opt);
  t.isA1Equal('A:A$5', { range: { top: 4, left: 0, right: 0, $top: true } }, opt);
  t.isA1Equal('A$5:A', { range: { top: 4, left: 0, right: 0, $top: true } }, opt);
  t.isA1Equal('A:$B5', { range: { top: 4, left: 0, right: 1, $right: true } }, opt);
  t.isA1Equal('$B:B3', { range: { top: 2, left: 1, right: 1, $left: true } }, opt);
  t.isA1Equal('$B:C5', { range: { top: 4, left: 1, right: 2, $left: true } }, opt);
  t.isA1Equal('C2:B', { range: { top: 1, left: 1, right: 2 } }, opt);
  t.isA1Equal('C:B2', { range: { top: 1, left: 1, right: 2 } }, opt);
  // unbounded right:
  t.isA1Equal('D1:1', { range: { top: 0, left: 3, bottom: 0 } }, opt);
  t.isA1Equal('1:D2', { range: { top: 0, left: 3, bottom: 1 } }, opt);
  t.isA1Equal('2:$D3', { range: { top: 1, left: 3, bottom: 2, $left: true } }, opt);
  t.isA1Equal('$D2:3', { range: { top: 1, left: 3, bottom: 2, $left: true } }, opt);
  t.isA1Equal('1:D$1', { range: { top: 0, left: 3, bottom: 0, $bottom: true } }, opt);
  t.isA1Equal('$1:D1', { range: { top: 0, left: 3, bottom: 0, $top: true } }, opt);
  t.isA1Equal('AA$3:4', { range: { top: 2, left: 26, bottom: 3, $top: true } }, opt);
  t.isA1Equal('B3:2', { range: { top: 1, bottom: 2, left: 1 } }, opt);
  t.isA1Equal('3:B2', { range: { top: 1, bottom: 2, left: 1 } }, opt);
  t.end();
});

test('A1 serialization', t => {
  // cell: A1
  t.is(toA1({ top: 9, bottom: 9, left: 2, right: 2 }), 'C10', 'C10');
  t.is(toA1({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true }), 'C$10', 'C$10');
  t.is(toA1({ top: 9, bottom: 9, left: 2, right: 2, $left: true, $right: true }), '$C10', '$C10');
  t.is(toA1({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true, $left: true, $right: true }), '$C$10', '$C$10');
  // rect: A1:A1
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 4 }), 'E3', 'E3');
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 4, $right: true }), 'E3:$E3', 'E3:$E3');
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 4, $top: true }), 'E$3:E3', 'E$3:E3');
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 4, $left: true }), '$E3:E3', '$E3:E3');
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true }), 'E3:E$3', 'E3:E$3');
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true, $right: true }), 'E3:$E$3', 'E3:$E$3');
  t.is(toA1({ top: 2, bottom: 2, left: 4, right: 5 }), 'E3:F3', 'E3:F3');
  t.is(toA1({ top: 2, bottom: 3, left: 4, right: 4 }), 'E3:E4', 'E3:E4');
  t.is(toA1({ top: 2, bottom: 3, left: 4, right: 5 }), 'E3:F4', 'E3:F4');
  // ray: A:A, 1:1
  t.is(toA1({ left: 0, right: 0 }), 'A:A', '1:A');
  t.is(toA1({ top: 0, bottom: MAX_ROWS, left: 0, right: 0 }), 'A:A', 'A:A (2)');
  t.is(toA1({ left: 10, right: 15 }), 'K:P', 'K:P');
  t.is(toA1({ left: 10, right: 15, $left: true }), '$K:P', '$K:P');
  t.is(toA1({ left: 10, right: 15, $right: true }), 'K:$P', 'K:$P');
  t.is(toA1({ left: 10, right: 15, $left: true, $right: true }), '$K:$P', '$K:$P');
  t.is(toA1({ top: 0, bottom: 0 }), '1:1', '1:1');
  t.is(toA1({ top: 0, bottom: 0, left: 0, right: MAX_COLS }), '1:1', '1:1 (2)');
  t.is(toA1({ top: 10, bottom: 15 }), '11:16', '11:16');
  t.is(toA1({ top: 10, bottom: 15, $top: true }), '$11:16', '$11:16');
  t.is(toA1({ top: 10, bottom: 15, $bottom: true }), '11:$16', '11:$16');
  t.is(toA1({ top: 10, bottom: 15, $top: true, $bottom: true }), '$11:$16', '$11:$16');
  // partial: A1:A, A1:1, A:A1, 1:A1
  t.is(toA1({ top: 9, left: 0, right: 0 }), 'A10:A', 'A10:A');
  t.is(toA1({ bottom: 9, left: 0, right: 0 }), 'A10:A', 'A:A10 → A10:A');
  t.is(toA1({ top: 9, left: 0, right: 0, $top: true }), 'A$10:A', 'A$10:A');
  t.is(toA1({ top: 9, left: 0, right: 0, $left: true }), '$A10:A', '$A10:A');
  t.is(toA1({ top: 9, left: 0, right: 0, $right: true }), 'A10:$A', 'A10:$A');
  t.is(toA1({ top: 0, left: 3, bottom: 0 }), 'D1:1', 'D1:1');
  t.is(toA1({ top: 0, right: 3, bottom: 0 }), 'D1:1', '1:D1 → D1:1');
  t.is(toA1({ top: 0, left: 3, bottom: 0, $top: true }), 'D$1:1', 'D$1:1');
  t.is(toA1({ top: 0, left: 3, bottom: 0, $left: true }), '$D1:1', '$D1:1');
  t.is(toA1({ top: 0, left: 3, bottom: 0, $bottom: true }), 'D1:$1', 'D1:$1');
  t.end();
});

test('stringifyA1Ref', t => {
  const rangeA1 = { top: 0, bottom: 0, left: 0, right: 0 };
  const testRef = (ref, expect) => t.is(stringifyA1Ref(ref), expect, expect);
  testRef({ range: rangeA1 }, 'A1');
  testRef({ sheetName: 'Sheet1', range: rangeA1 }, 'Sheet1!A1');
  testRef({ sheetName: 'Sheet 1', range: rangeA1 }, "'Sheet 1'!A1");
  testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 }, '[MyFile.xlsx]Sheet1!A1');
  testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', range: rangeA1 }, "'[My File.xlsx]Sheet1'!A1");
  testRef({ workbookName: 'MyFile.xlsx', range: rangeA1 }, 'MyFile.xlsx!A1');
  testRef({ workbookName: 'My File.xlsx', range: rangeA1 }, "'My File.xlsx'!A1");
  testRef({ name: 'foo' }, 'foo');
  testRef({ sheetName: 'Sheet1', name: 'foo' }, 'Sheet1!foo');
  testRef({ sheetName: 'Sheet 1', name: 'foo' }, "'Sheet 1'!foo");
  testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
  testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
  testRef({ workbookName: 'MyFile.xlsx', name: 'foo' }, 'MyFile.xlsx!foo');
  testRef({ workbookName: 'My File.xlsx', name: 'foo' }, "'My File.xlsx'!foo");
  t.end();
});

test('A1 utilities', t => {
  const relA1Range = {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: false, $left: false, $bottom: false, $right: false
  };
  const absA1Range = {
    top: 0, left: 0, bottom: 0, right: 0,
    $top: true, $left: true, $bottom: true, $right: true
  };
  t.deepEqual(toAbsolute(relA1Range), absA1Range, 'toAbsolute');
  t.deepEqual(toRelative(absA1Range), relA1Range, 'toRelative');
  t.end();
});

