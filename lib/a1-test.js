/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import {
  fromCol,
  toCol,
  fromRow,
  toRow,
  toRelative,
  toAbsolute,
  parseA1Ref
} from './a1.js';

Test.prototype.isA1Equal = function isTokens (expr, result, opts) {
  if (result) {
    result = {
      sheetName: '',
      workbookName: '',
      range: null,
      name: '',
      ...result
    };
    if (result.range && typeof result.range === 'object') {
      // mix in some defaults so we don't have to write things out in full
      result.range = {
        top: null, left: null, bottom: null, right: null,
        $top: false, $left: false, $bottom: false, $right: false,
        ...result.range
      };
    }
  }
  this.deepEqual(parseA1Ref(expr, opts), result, expr);
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

  t.isA1Equal('A:A', { range: { top: 0, left: 0, bottom: 1048575, right: 0, $top: true, $bottom: true } });
  t.isA1Equal('C:C', { range: { top: 0, left: 2, bottom: 1048575, right: 2, $top: true, $bottom: true } });
  t.isA1Equal('C:$C', { range: { top: 0, left: 2, bottom: 1048575, right: 2, $right: true, $top: true, $bottom: true } });
  t.isA1Equal('$C:C', { range: { top: 0, left: 2, bottom: 1048575, right: 2, $left: true, $top: true, $bottom: true } });
  t.isA1Equal('$C:$C', { range: { top: 0, left: 2, bottom: 1048575, right: 2, $left: true, $right: true, $top: true, $bottom: true } });

  t.isA1Equal('1:1', { range: { top: 0, left: 0, bottom: 0, right: 16383, $left: true, $right: true } });
  t.isA1Equal('10:10', { range: { top: 9, left: 0, bottom: 9, right: 16383, $left: true, $right: true } });
  t.isA1Equal('10:$10', { range: { top: 9, left: 0, bottom: 9, right: 16383, $bottom: true, $left: true, $right: true } });
  t.isA1Equal('$10:10', { range: { top: 9, left: 0, bottom: 9, right: 16383, $top: true, $left: true, $right: true } });
  t.isA1Equal('$10:$10', { range: { top: 9, left: 0, bottom: 9, right: 16383, $top: true, $bottom: true, $left: true, $right: true } });

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
  t.isA1Equal('namedrange', null, false);
  t.isA1Equal('Workbook.xlsx!namedrange', null, false);
  t.isA1Equal('pensioneligibilitypartner1', null, false);
  t.isA1Equal('XFE1048577', null, false);

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
  t.deepEqual(toAbsolute(relA1Range), absA1Range);
  t.deepEqual(toRelative(absA1Range), relA1Range);
  t.end();
});

