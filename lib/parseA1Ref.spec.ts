/* eslint-disable @stylistic/object-property-newline */
import { describe, test, expect } from 'vitest';
import { parseA1Ref, parseA1RefXlsx, type OptsParseA1Ref } from './parseA1Ref.ts';

type IsA1EqualOptions = OptsParseA1Ref & {
  xlsx?: boolean,
};

function isA1Equal (expr: string, expected: any, opts?: IsA1EqualOptions) {
  const xlsx = !!(opts?.xlsx);
  if (expected) {
    expected = xlsx
      ? { workbookName: '', sheetName: '', ...expected }
      : { context: [], ...expected };
    Object.assign(expected, expected);
    if (expected.range && typeof expected.range === 'object') {
      // mix in some defaults so we don't have to write things out in full
      expected.range = {
        top: null, left: null, bottom: null, right: null,
        $top: false, $left: false, $bottom: false, $right: false,
        ...expected.range
      };
    }
  }
  expect(xlsx ? parseA1RefXlsx(expr, opts) : parseA1Ref(expr, opts)).toEqual(expected);
}

describe('parse A1 references', () => {
  test('basic A1 references', () => {
    isA1Equal('A1', { range: { top: 0, left: 0, bottom: 0, right: 0 } });
    isA1Equal('A1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1 } });

    isA1Equal('$A1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1, $left: true } });
    isA1Equal('A$1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1, $top: true } });
    isA1Equal('A1:$B2', { range: { top: 0, left: 0, bottom: 1, right: 1, $right: true } });
    isA1Equal('A1:B$2', { range: { top: 0, left: 0, bottom: 1, right: 1, $bottom: true } });
  });

  test('column and row ranges', () => {
    isA1Equal('A:A', { range: { left: 0, right: 0 } });
    isA1Equal('C:C', { range: { left: 2, right: 2 } });
    isA1Equal('C:$C', { range: { left: 2, right: 2, $right: true } });
    isA1Equal('$C:C', { range: { left: 2, right: 2, $left: true } });
    isA1Equal('$C:$C', { range: { left: 2, right: 2, $left: true, $right: true } });

    isA1Equal('1:1', { range: { top: 0, bottom: 0 } });
    isA1Equal('10:10', { range: { top: 9, bottom: 9 } });
    isA1Equal('10:$10', { range: { top: 9, bottom: 9, $bottom: true } });
    isA1Equal('$10:10', { range: { top: 9, bottom: 9, $top: true } });
    isA1Equal('$10:$10', { range: { top: 9, bottom: 9, $top: true, $bottom: true } });
  });

  test('maximum ranges', () => {
    isA1Equal('XFD1048576', { range: { top: 1048575, left: 16383, bottom: 1048575, right: 16383 } });
  });

  test('sheet references', () => {
    isA1Equal('Sheet1!A1', {
      context: [ 'Sheet1' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });

    isA1Equal('\'Sheet1\'!A1', {
      context: [ 'Sheet1' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });

    isA1Equal('\'Sheet1\'\'s\'!A1', {
      context: [ 'Sheet1\'s' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });
  });

  test('workbook references', () => {
    isA1Equal('[Workbook.xlsx]Sheet1!A1', {
      context: [ 'Workbook.xlsx', 'Sheet1' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });

    isA1Equal("'[Workbook.xlsx]Sheet1'!A1", {
      context: [ 'Workbook.xlsx', 'Sheet1' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });

    isA1Equal("='[Workbook.xlsx]Sheet1'!A1", {
      context: [ 'Workbook.xlsx', 'Sheet1' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });

    isA1Equal('[foo bar]Sheet1!A1', {
      context: [ 'foo bar', 'Sheet1' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });

    isA1Equal('[a "b" c]d!A1', {
      context: [ 'a "b" c', 'd' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });
  });

  test('long context names', () => {
    // unless we know the contexts available, we don't know that this is a sheet
    // or a filename, so we can't reject it:
    isA1Equal('0123456789abcdefghijklmnopqrstuvwxyz!A1', {
      context: [ '0123456789abcdefghijklmnopqrstuvwxyz' ],
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    });
  });

  test('invalid references', () => {
    isA1Equal('[Workbook.xlsx]!A1', null);
    isA1Equal('[Workbook.xlsx]!A1:B2', null);
    isA1Equal('[Workbook.xlsx]!A:A', null);
    isA1Equal('[Workbook.xlsx]!1:1', null);
    isA1Equal('[]Sheet1!A1', null);
  });

  test('named ranges', () => {
    isA1Equal('namedrange', { name: 'namedrange' });

    isA1Equal('Workbook.xlsx!namedrange', {
      context: [ 'Workbook.xlsx' ],
      name: 'namedrange'
    });

    isA1Equal("'Workbook.xlsx'!namedrange", {
      context: [ 'Workbook.xlsx' ],
      name: 'namedrange'
    });

    isA1Equal('[Workbook.xlsx]!namedrange', null);
    isA1Equal('pensioneligibilitypartner1', { name: 'pensioneligibilitypartner1' });
    isA1Equal('XFE1048577', { name: 'XFE1048577' });
  });

  test('named ranges with allowNamed: false', () => {
    isA1Equal('namedrange', null, { allowNamed: false });
    isA1Equal('Workbook.xlsx!namedrange', null, { allowNamed: false });
    isA1Equal('pensioneligibilitypartner1', null, { allowNamed: false });
    isA1Equal('XFE1048577', null, { allowNamed: false });
  });
});

describe('parse A1 ranges in XLSX mode', () => {
  const opts = { xlsx: true };

  test('workbook references', () => {
    isA1Equal('[1]!A1', {
      workbookName: '1',
      sheetName: '',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal('[Workbook.xlsx]!A1', {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal('[1]Sheet1!A1', {
      workbookName: '1',
      sheetName: 'Sheet1',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal('[Workbook.xlsx]Sheet1!A1', {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);
  });

  test('named ranges in workbooks', () => {
    isA1Equal('[4]!name', {
      workbookName: '4',
      sheetName: '',
      name: 'name'
    }, opts);

    isA1Equal('[Workbook.xlsx]!name', {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      name: 'name'
    }, opts);

    isA1Equal('[16]Sheet1!name', {
      workbookName: '16',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);

    isA1Equal('[Workbook.xlsx]Sheet1!name', {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);
  });

  test('quoted references', () => {
    isA1Equal("='[1]'!A1", {
      workbookName: '1',
      sheetName: '',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal("='[Workbook.xlsx]'!A1", {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal("'[1]Sheet1'!A1", {
      workbookName: '1',
      sheetName: 'Sheet1',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal("'[Workbook.xlsx]Sheet1'!A1", {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      range: { top: 0, left: 0, bottom: 0, right: 0 }
    }, opts);

    isA1Equal("'[4]'!name", {
      workbookName: '4',
      sheetName: '',
      name: 'name'
    }, opts);

    isA1Equal("'[Workbook.xlsx]'!name", {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      name: 'name'
    }, opts);

    isA1Equal("'[16]Sheet1'!name", {
      workbookName: '16',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);

    isA1Equal("'[Workbook.xlsx]Sheet1'!name", {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);
  });
});

describe('A1 partial ranges', () => {
  const opt = { allowTernary: true };

  test('partial ranges not allowed by default', () => {
    isA1Equal('A10:A', null);
    isA1Equal('B3:2', null);
  });

  test('unbounded bottom ranges', () => {
    isA1Equal('A10:A', { range: { top: 9, left: 0, right: 0 } }, opt);
    isA1Equal('A:A10', { range: { top: 9, left: 0, right: 0 } }, opt);
    isA1Equal('A$5:A', { range: { top: 4, left: 0, right: 0, $top: true } }, opt);
    isA1Equal('A:A$5', { range: { top: 4, left: 0, right: 0, $top: true } }, opt);
    isA1Equal('A$5:A', { range: { top: 4, left: 0, right: 0, $top: true } }, opt);
    isA1Equal('A:$B5', { range: { top: 4, left: 0, right: 1, $right: true } }, opt);
    isA1Equal('$B:B3', { range: { top: 2, left: 1, right: 1, $left: true } }, opt);
    isA1Equal('$B:C5', { range: { top: 4, left: 1, right: 2, $left: true } }, opt);
    isA1Equal('C2:B', { range: { top: 1, left: 1, right: 2 } }, opt);
    isA1Equal('C:B2', { range: { top: 1, left: 1, right: 2 } }, opt);
  });

  test('unbounded right ranges', () => {
    isA1Equal('D1:1', { range: { top: 0, left: 3, bottom: 0 } }, opt);
    isA1Equal('1:D2', { range: { top: 0, left: 3, bottom: 1 } }, opt);
    isA1Equal('2:$D3', { range: { top: 1, left: 3, bottom: 2, $left: true } }, opt);
    isA1Equal('$D2:3', { range: { top: 1, left: 3, bottom: 2, $left: true } }, opt);
    isA1Equal('1:D$1', { range: { top: 0, left: 3, bottom: 0, $bottom: true } }, opt);
    isA1Equal('$1:D1', { range: { top: 0, left: 3, bottom: 0, $top: true } }, opt);
    isA1Equal('AA$3:4', { range: { top: 2, left: 26, bottom: 3, $top: true } }, opt);
    isA1Equal('B3:2', { range: { top: 1, bottom: 2, left: 1 } }, opt);
    isA1Equal('3:B2', { range: { top: 1, bottom: 2, left: 1 } }, opt);
  });
});

describe('A1 trimmed ranges', () => {
  const locks = { $top: true, $left: true, $bottom: true, $right: true };
  const opts = [ {}, { xlsx: true } ];

  for (const opt of opts) {
    test(`trimmed ranges with ${opt.xlsx ? 'XLSX' : 'default'} options`, () => {
      isA1Equal('A1:B2', { range: { top: 0, left: 0, bottom: 1, right: 1 } }, opt);
      isA1Equal('A1.:B2', { range: { top: 0, left: 0, bottom: 1, right: 1, trim: 'head' } }, opt);
      isA1Equal('A1:.B2', { range: { top: 0, left: 0, bottom: 1, right: 1, trim: 'tail' } }, opt);
      isA1Equal('A1.:.B2', { range: { top: 0, left: 0, bottom: 1, right: 1, trim: 'both' } }, opt);

      isA1Equal('$A$1:$B$2', { range: { top: 0, left: 0, bottom: 1, right: 1, ...locks } }, opt);
      isA1Equal('$A$1.:$B$2', { range: { top: 0, left: 0, bottom: 1, right: 1, trim: 'head', ...locks } }, opt);
      isA1Equal('$A$1:.$B$2', { range: { top: 0, left: 0, bottom: 1, right: 1, trim: 'tail', ...locks } }, opt);
      isA1Equal('$A$1.:.$B$2', { range: { top: 0, left: 0, bottom: 1, right: 1, trim: 'both', ...locks } }, opt);

      isA1Equal('J:J', { range: { top: null, left: 9, bottom: null, right: 9 } }, opt);
      isA1Equal('J.:J', { range: { top: null, left: 9, bottom: null, right: 9, trim: 'head' } }, opt);
      isA1Equal('J:.J', { range: { top: null, left: 9, bottom: null, right: 9, trim: 'tail' } }, opt);
      isA1Equal('J.:.J', { range: { top: null, left: 9, bottom: null, right: 9, trim: 'both' } }, opt);

      isA1Equal('10:10', { range: { top: 9, left: null, bottom: 9, right: null } }, opt);
      isA1Equal('10.:10', { range: { top: 9, left: null, bottom: 9, right: null, trim: 'head' } }, opt);
      isA1Equal('10:.10', { range: { top: 9, left: null, bottom: 9, right: null, trim: 'tail' } }, opt);
      isA1Equal('10.:.10', { range: { top: 9, left: null, bottom: 9, right: null, trim: 'both' } }, opt);

      isA1Equal('J10:J', null, { ...opt });
      isA1Equal('J10:10', null, { ...opt });
      isA1Equal('J10.:.J', null, { ...opt });
      isA1Equal('J10.:.10', null, { ...opt });
      isA1Equal('J10:J', { range: { top: 9, left: 9, bottom: null, right: 9 } }, { allowTernary: true, ...opt });
      isA1Equal('J10:10', { range: { top: 9, left: 9, bottom: 9, right: null } }, { allowTernary: true, ...opt });
      isA1Equal('J10.:.J', { range: { top: 9, left: 9, bottom: null, right: 9, trim: 'both' } }, { allowTernary: true, ...opt });
      isA1Equal('J10.:.10', { range: { top: 9, left: 9, bottom: 9, right: null, trim: 'both' } }, { allowTernary: true, ...opt });
    });
  }
});

describe('A1 trimmed ranges vs named ranges', () => {
  test('named ranges cannot be trimmed', () => {
    isA1Equal('name1.:.name1', null);
    isA1Equal('name1.:.foo', null);
    isA1Equal('foo.:.name1', null);
  });

  test('trimmed column references', () => {
    // prior to the intruduction of trimed ranges, the following would have
    // been an expression: NAME:`foo.` OP:`:`, COLUMN:`bar`
    isA1Equal('foo.:bar', { range: { left: 1395, right: 4460, trim: 'head' } });
    // prior to the intruduction of trimed ranges, the following would have
    // been an expression: NAME:`foo.` OP:`:`, CELL:`B2`
    isA1Equal('foo.:B2', { range: { top: 1, left: 1, right: 4460, trim: 'head' } }, { allowTernary: true });
  });
});
