/* eslint-disable object-property-newline, object-curly-newline */
import { describe, test, expect } from 'vitest';
import {
  toRow,
  toRelative,
  toAbsolute,
  parseA1Ref,
  stringifyA1Ref,
  toA1
} from './a1.js';
import { MAX_COLS, MAX_ROWS } from './constants.js';

function isA1Equal(expr: string, expected: any, opts?: any) {
  if (expected) {
    expected = opts?.xlsx
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
  expect(parseA1Ref(expr, opts)).toEqual(expected);
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

describe('A1 serialization', () => {
  test('cell references: A1', () => {
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2 })).toBe('C10');
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true })).toBe('C$10');
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2, $left: true, $right: true })).toBe('$C10');
    expect(toA1({ top: 9, bottom: 9, left: 2, right: 2, $top: true, $bottom: true, $left: true, $right: true })).toBe('$C$10');
  });

  test('rectangle references: A1:B2', () => {
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4 })).toBe('E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $right: true })).toBe('E3:$E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $top: true })).toBe('E$3:E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $left: true })).toBe('$E3:E3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true })).toBe('E3:E$3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, $bottom: true, $right: true })).toBe('E3:$E$3');
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 5 })).toBe('E3:F3');
    expect(toA1({ top: 2, bottom: 3, left: 4, right: 4 })).toBe('E3:E4');
    expect(toA1({ top: 2, bottom: 3, left: 4, right: 5 })).toBe('E3:F4');
  });

  test('beam references: A:A 1:1', () => {
    expect(toA1({ left: 0, right: 0 })).toBe('A:A');
    expect(toA1({ top: 0, bottom: MAX_ROWS, left: 0, right: 0 })).toBe('A:A');
    expect(toA1({ left: 10, right: 15 })).toBe('K:P');
    expect(toA1({ left: 10, right: 15, $left: true })).toBe('$K:P');
    expect(toA1({ left: 10, right: 15, $right: true })).toBe('K:$P');
    expect(toA1({ left: 10, right: 15, $left: true, $right: true })).toBe('$K:$P');
    expect(toA1({ top: 0, bottom: 0 })).toBe('1:1');
    expect(toA1({ top: 0, bottom: 0, left: 0, right: MAX_COLS })).toBe('1:1');
    expect(toA1({ top: 10, bottom: 15 })).toBe('11:16');
    expect(toA1({ top: 10, bottom: 15, $top: true })).toBe('$11:16');
    expect(toA1({ top: 10, bottom: 15, $bottom: true })).toBe('11:$16');
    expect(toA1({ top: 10, bottom: 15, $top: true, $bottom: true })).toBe('$11:$16');
  });

  test('partial references: B1:C B2:3', () => {
    expect(toA1({ top: 9, left: 0, right: 0 })).toBe('A10:A');
    expect(toA1({ bottom: 9, left: 0, right: 0 })).toBe('A10:A');
    expect(toA1({ top: 9, left: 0, right: 0, $top: true })).toBe('A$10:A');
    expect(toA1({ top: 9, left: 0, right: 0, $left: true })).toBe('$A10:A');
    expect(toA1({ top: 9, left: 0, right: 0, $right: true })).toBe('A10:$A');
    expect(toA1({ top: 0, left: 3, bottom: 0 })).toBe('D1:1');
    expect(toA1({ top: 0, right: 3, bottom: 0 })).toBe('D1:1');
    expect(toA1({ top: 0, left: 3, bottom: 0, $top: true })).toBe('D$1:1');
    expect(toA1({ top: 0, left: 3, bottom: 0, $left: true })).toBe('$D1:1');
    expect(toA1({ top: 0, left: 3, bottom: 0, $left: true })).toBe('$D1:1');
  });

  test('edge cases', () => {
    // allow skipping right/bottom for cells
    expect(toA1({ top: 0, left: 0 })).toBe('A1');
    // clamp the range at min/max dimensions
    expect(toA1({ top: -10, bottom: -5, left: -10, right: -5 })).toBe('A1');
    expect(toA1({ top: 15e5, bottom: 15e5, left: 20000, right: 20000 })).toBe('XFD1048576');
    expect(toA1({ top: 2, bottom: 2, left: 2.5, right: 2.5 })).toBe('C3');
    expect(toA1({ top: 1.5, bottom: 2.5, left: 4.5, right: 8.5 })).toBe('E2:I3');
  });

  test('trimming', () => {
    expect(toA1({ top: 2, bottom: 2, left: 4, right: 4, trim: 'both' })).toBe('E3');
    expect(toA1({ top: 2, bottom: 3, left: 4, right: 6, trim: 'both' })).toBe('E3.:.G4');
    expect(toA1({ top: 2, bottom: 3, trim: 'both' })).toBe('3.:.4');
    expect(toA1({ left: 4, right: 6, trim: 'both' })).toBe('E.:.G');
    expect(toA1({ top: 9, left: 0, right: 0, trim: 'tail' })).toBe('A10:.A');
    expect(toA1({ top: 9, left: 0, right: 0, trim: 'head' })).toBe('A10.:A');
    expect(toA1({ top: 9, left: 0, right: 0, trim: 'both' })).toBe('A10.:.A');
  });
});

describe('stringifyA1Ref', () => {
  const rangeA1 = { top: 0, bottom: 0, left: 0, right: 0 };

  test('basic stringification', () => {
    expect(stringifyA1Ref({ range: rangeA1 })).toBe('A1');
    expect(stringifyA1Ref({ context: [ 'Sheet1' ], range: rangeA1 })).toBe('Sheet1!A1');
    expect(stringifyA1Ref({ context: [ 'Sheet 1' ], range: rangeA1 })).toBe("'Sheet 1'!A1");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 })).toBe('[MyFile.xlsx]Sheet1!A1');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx', 'Sheet1' ], range: rangeA1 })).toBe("'[My File.xlsx]Sheet1'!A1");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx' ], range: rangeA1 })).toBe('MyFile.xlsx!A1');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx' ], range: rangeA1 })).toBe("'My File.xlsx'!A1");
  });

  test('named ranges', () => {
    expect(stringifyA1Ref({ name: 'foo' })).toBe('foo');
    expect(stringifyA1Ref({ context: [ 'Sheet1' ], name: 'foo' })).toBe('Sheet1!foo');
    expect(stringifyA1Ref({ context: [ 'Sheet 1' ], name: 'foo' })).toBe("'Sheet 1'!foo");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' })).toBe('[MyFile.xlsx]Sheet1!foo');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx', 'Sheet1' ], name: 'foo' })).toBe("'[My File.xlsx]Sheet1'!foo");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx' ], name: 'foo' })).toBe('MyFile.xlsx!foo');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx' ], name: 'foo' })).toBe("'My File.xlsx'!foo");
  });

  test('ignore workbookName/sheetName in non-XLSX mode', () => {
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 })).toBe('A1');
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' })).toBe('foo');
  });
});

describe('stringifyA1Ref in XLSX mode', () => {
  const rangeA1 = { top: 0, bottom: 0, left: 0, right: 0 };

  test('basic stringification', () => {
    expect(stringifyA1Ref({ range: rangeA1 }, { xlsx: true })).toBe('A1');
    expect(stringifyA1Ref({ sheetName: 'Sheet1', range: rangeA1 }, { xlsx: true })).toBe('Sheet1!A1');
    expect(stringifyA1Ref({ sheetName: 'Sheet 1', range: rangeA1 }, { xlsx: true })).toBe("'Sheet 1'!A1");
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 }, { xlsx: true })).toBe('[MyFile.xlsx]Sheet1!A1');
    expect(stringifyA1Ref({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', range: rangeA1 }, { xlsx: true })).toBe("'[My File.xlsx]Sheet1'!A1");
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', range: rangeA1 }, { xlsx: true })).toBe('[MyFile.xlsx]!A1');
    expect(stringifyA1Ref({ workbookName: 'My File.xlsx', range: rangeA1 }, { xlsx: true })).toBe("'[My File.xlsx]'!A1");
  });

  test('named ranges', () => {
    expect(stringifyA1Ref({ name: 'foo' }, { xlsx: true })).toBe('foo');
    expect(stringifyA1Ref({ sheetName: 'Sheet1', name: 'foo' }, { xlsx: true })).toBe('Sheet1!foo');
    expect(stringifyA1Ref({ sheetName: 'Sheet 1', name: 'foo' }, { xlsx: true })).toBe("'Sheet 1'!foo");
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' }, { xlsx: true })).toBe('[MyFile.xlsx]Sheet1!foo');
    expect(stringifyA1Ref({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', name: 'foo' }, { xlsx: true })).toBe("'[My File.xlsx]Sheet1'!foo");
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', name: 'foo' }, { xlsx: true })).toBe('[MyFile.xlsx]!foo');
    expect(stringifyA1Ref({ workbookName: 'My File.xlsx', name: 'foo' }, { xlsx: true })).toBe("'[My File.xlsx]'!foo");
  });

  test('ignore context in XLSX mode', () => {
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, { xlsx: true })).toBe('A1');
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, { xlsx: true })).toBe('foo');
  });
});

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

    const relA1RangeT = {
      top: 0, left: 0, bottom: 0, right: 0,
      $top: false, $left: false, $bottom: false, $right: false,
      trim: 'both'
    };
    const absA1RangeT = {
      top: 0, left: 0, bottom: 0, right: 0,
      $top: true, $left: true, $bottom: true, $right: true,
      trim: 'both'
    };
    expect(toAbsolute(relA1RangeT)).toEqual(absA1RangeT);
    expect(toRelative(absA1RangeT)).toEqual(relA1RangeT);
  });
});
