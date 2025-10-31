/* eslint-disable @stylistic/object-property-newline */
import { describe, test, expect } from 'vitest';
import { parseR1C1Ref, parseR1C1RefXlsx } from './parseR1C1Ref.ts';

type OptsIsRCEqual = {
  allowNamed?: boolean;
  allowTernary?: boolean;
  xlsx?: boolean;
};

function isRCEqual (expr: string, expected: any, opts?: OptsIsRCEqual) {
  const xlsx = !!opts?.xlsx;
  if (expected) {
    expected = xlsx
      ? { workbookName: '', sheetName: '', ...expected }
      : { context: [], ...expected };
    if (expected.range && typeof expected.range === 'object') {
      // mix in some defaults so we don't have to write things out in full
      expected.range = {
        r0: null, c0: null, r1: null, c1: null,
        $r0: false, $c0: false, $r1: false, $c1: false,
        ...expected.range
      };
    }
  }
  expect(xlsx ? parseR1C1RefXlsx(expr, opts) : parseR1C1Ref(expr, opts)).toEqual(expected);
}

describe('parse single R1C1 references', () => {
  test('current row references', () => {
    isRCEqual('R', { range: { r0: 0, r1: 0 } });
    isRCEqual('R[0]', { range: { r0: 0, r1: 0 } });
  });

  test('fixed row references', () => {
    isRCEqual('R0', { name: 'R0' });
    isRCEqual('R1', { range: { r0: 0, r1: 0, $r0: true, $r1: true } });
    isRCEqual('R10', { range: { r0: 9, r1: 9, $r0: true, $r1: true } });
  });

  test('relative row references', () => {
    isRCEqual('R[1]', { range: { r0: 1, r1: 1 } });
    isRCEqual('R[-1]', { range: { r0: -1, r1: -1 } });
  });

  test('current column references', () => {
    isRCEqual('C', { range: { c0: 0, c1: 0 } });
    isRCEqual('C[0]', { range: { c0: 0, c1: 0 } });
  });

  test('fixed column references', () => {
    isRCEqual('C0', { name: 'C0' });
    isRCEqual('C1', { range: { c0: 0, c1: 0, $c0: true, $c1: true } });
    isRCEqual('C10', { range: { c0: 9, c1: 9, $c0: true, $c1: true } });
  });

  test('relative column references', () => {
    isRCEqual('C[1]', { range: { c0: 1, c1: 1 } });
    isRCEqual('C[-1]', { range: { c0: -1, c1: -1 } });
  });

  test('cell references', () => {
    isRCEqual('RC', { range: { r0: 0, c0: 0, r1: 0, c1: 0 } });
    isRCEqual('R0C0', { name: 'R0C0' });
    isRCEqual('R1C1', { range: { r0: 0, c0: 0, r1: 0, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true } });
    isRCEqual('R10C8', { range: { r0: 9, c0: 7, r1: 9, c1: 7, $c0: true, $c1: true, $r0: true, $r1: true } });
    isRCEqual('R-10C-8', undefined);
  });

  test('relative cell parts', () => {
    isRCEqual('R[2]C', { range: { r0: 2, c0: 0, r1: 2, c1: 0 } });
    isRCEqual('R[-2]C', { range: { r0: -2, c0: 0, r1: -2, c1: 0 } });
    isRCEqual('RC[3]', { range: { r0: 0, c0: 3, r1: 0, c1: 3 } });
    isRCEqual('RC[-3]', { range: { r0: 0, c0: -3, r1: 0, c1: -3 } });
    isRCEqual('R[2]C[4]', { range: { r0: 2, c0: 4, r1: 2, c1: 4 } });
    isRCEqual('R[-2]C[-4]', { range: { r0: -2, c0: -4, r1: -2, c1: -4 } });
  });

  test('mixed fixed and relative references', () => {
    isRCEqual('R[9]C9', { range: { r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true } });
    isRCEqual('R9C[9]', { range: { r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true } });
  });

  test('out of bounds references', () => {
    isRCEqual('R1048577', { name: 'R1048577' });
    isRCEqual('R[1048576]', undefined);
    isRCEqual('C16385', { name: 'C16385' });
    isRCEqual('C[16384]', undefined);
  });
});

describe('R1C1 partial ranges', () => {
  const opts = { allowTernary: true };

  test('partials are not allowed by default', () => {
    isRCEqual('R[-5]C[-2]:C[-2]', undefined);
    isRCEqual('R1:R1C1', undefined);
  });

  test('beam type partials', () => {
    isRCEqual('R[-5]C[-2]:C[-2]', { range: { r0: -5, c0: -2, c1: -2 } }, opts);
    isRCEqual('C[-2]:R[-5]C[-2]', { range: { r0: -5, c0: -2, c1: -2 } }, opts);
    isRCEqual('R[-5]C[-3]:R[-5]', { range: { r0: -5, c0: -3, r1: -5 } }, opts);
    isRCEqual('R[-5]:R[-5]C[-3]', { range: { r0: -5, c0: -3, r1: -5 } }, opts);
    isRCEqual('R[-6]C1:C1', { range: { r0: -6, c0: 0, c1: 0, $c0: true, $c1: true } }, opts);
    isRCEqual('C1:R[-6]C1', { range: { r0: -6, c0: 0, c1: 0, $c0: true, $c1: true } }, opts);
    isRCEqual('R[-6]C1:R[-6]', { range: { r0: -6, c0: 0, r1: -6, $c0: true, $c1: true } }, opts);
    isRCEqual('R[-6]:R[-6]C1', { range: { r0: -6, c0: 0, r1: -6, $c0: true, $c1: true } }, opts);
    isRCEqual('R1C[-2]:C[-2]', { range: { r0: 0, c0: -2, c1: -2, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
    isRCEqual('C[-2]:R1C[-2]', { range: { r0: 0, c0: -2, c1: -2, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
    isRCEqual('R1C[-3]:R1', { range: { r0: 0, c0: -3, r1: 0, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
    isRCEqual('R1:R1C[-3]', { range: { r0: 0, c0: -3, r1: 0, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
    isRCEqual('R1C1:C1', { range: { r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
    isRCEqual('C1:R1C1', { range: { r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
    isRCEqual('R1C1:R1', { range: { r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
    isRCEqual('R1:R1C1', { range: { r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  });

  test('range type partials', () => {
    isRCEqual('R[-5]C[10]:R[4]', { range: { r0: -5, c0: 10, r1: 4 } }, opts);
    isRCEqual('R[4]:R[-5]C[10]', { range: { r0: -5, c0: 10, r1: 4 } }, opts);
    isRCEqual('R[-6]C16:R[3]', { range: { r0: -6, c0: 15, r1: 3, $c0: true, $c1: true } }, opts);
    isRCEqual('R[3]:R[-6]C16', { range: { r0: -6, c0: 15, r1: 3, $c0: true, $c1: true } }, opts);
    isRCEqual('R1C[10]:R10', { range: { r0: 0, c0: 10, r1: 9, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
    isRCEqual('R10:R1C[10]', { range: { r0: 0, c0: 10, r1: 9, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
    isRCEqual('R1C16:R10', { range: { r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
    isRCEqual('R10:R1C16', { range: { r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  });
});

describe('parse joined R1C1 references', () => {
  test('equivalent mirrored references', () => {
    isRCEqual('R:R', { range: { r0: 0, r1: 0 } });
    isRCEqual('R[0]:R[0]', { range: { r0: 0, r1: 0 } });
    isRCEqual('R1:R1', { range: { r0: 0, r1: 0, $r0: true, $r1: true } });
    isRCEqual('R10:R10', { range: { r0: 9, r1: 9, $r0: true, $r1: true } });
    isRCEqual('R[1]:R[1]', { range: { r0: 1, r1: 1 } });
    isRCEqual('R[-1]:R[-1]', { range: { r0: -1, r1: -1 } });

    isRCEqual('C:C', { range: { c0: 0, c1: 0 } });
    isRCEqual('C[0]:C[0]', { range: { c0: 0, c1: 0 } });
    isRCEqual('C1:C1', { range: { c0: 0, c1: 0, $c0: true, $c1: true } });
    isRCEqual('C10:C10', { range: { c0: 9, c1: 9, $c0: true, $c1: true } });
    isRCEqual('C[1]:C[1]', { range: { c0: 1, c1: 1 } });
    isRCEqual('C[-1]:C[-1]', { range: { c0: -1, c1: -1 } });
  });

  test('invalid range combinations', () => {
    isRCEqual('R0:R0', undefined);
    isRCEqual('C0:C0', undefined);
  });

  test('complex range references', () => {
    isRCEqual('R[9]C9:R[9]C9', { range: { r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true } });
    isRCEqual('R9C[9]:R9C[9]', { range: { r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true } });
    isRCEqual('R[1]C[1]:R1C1', { range: { r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true } });
    isRCEqual('R1C1:R2C2', { range: { r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true } });
    isRCEqual('R2C2:R1C1', { range: { r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true } });
  });

  test('single dimension ranges', () => {
    isRCEqual('C1:C3', { range: { c0: 0, c1: 2, $c0: true, $c1: true } });
    isRCEqual('R[1]:R3', { range: { r0: 1, r1: 2, $r1: true } });
    isRCEqual('R[1]C1:R1C[-1]', { range: { r0: 1, c0: 0, r1: 0, c1: -1, $c0: true, $r1: true, $c1: false } });
  });

  test('invalid mixed references', () => {
    isRCEqual('R:C', undefined);
    isRCEqual('R:RC', undefined);
    isRCEqual('RC:R', undefined);
    isRCEqual('RC:C', undefined);
    isRCEqual('C:R', undefined);
    isRCEqual('C:RC', undefined);
  });
});

describe('parse R1C1 ranges in XLSX mode', () => {
  const opts = { xlsx: true };
  const rcRange = { r0: 0, c0: 0, r1: 0, c1: 0 };

  test('workbook-only references', () => {
    isRCEqual('[1]!RC', {
      workbookName: '1',
      sheetName: '',
      range: rcRange
    }, opts);

    isRCEqual('[Workbook.xlsx]!RC', {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      range: rcRange
    }, opts);
  });

  test('workbook and sheet references', () => {
    isRCEqual('[1]Sheet1!RC', {
      workbookName: '1',
      sheetName: 'Sheet1',
      range: rcRange
    }, opts);

    isRCEqual('[Workbook.xlsx]Sheet1!RC', {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      range: rcRange
    }, opts);
  });

  test('named references', () => {
    isRCEqual('[4]!name', {
      workbookName: '4',
      sheetName: '',
      name: 'name'
    }, opts);

    isRCEqual('[Workbook.xlsx]!name', {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      name: 'name'
    }, opts);

    isRCEqual('[16]Sheet1!name', {
      workbookName: '16',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);

    isRCEqual('[Workbook.xlsx]Sheet1!name', {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);
  });

  test('quoted references', () => {
    isRCEqual("='[1]'!RC", {
      workbookName: '1',
      sheetName: '',
      range: rcRange
    }, opts);

    isRCEqual("='[Workbook.xlsx]'!RC", {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      range: rcRange
    }, opts);

    isRCEqual("'[1]Sheet1'!RC", {
      workbookName: '1',
      sheetName: 'Sheet1',
      range: rcRange
    }, opts);

    isRCEqual("'[Workbook.xlsx]Sheet1'!RC", {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      range: rcRange
    }, opts);

    isRCEqual("'[4]'!name", {
      workbookName: '4',
      sheetName: '',
      name: 'name'
    }, opts);

    isRCEqual("'[Workbook.xlsx]'!name", {
      workbookName: 'Workbook.xlsx',
      sheetName: '',
      name: 'name'
    }, opts);

    isRCEqual("'[16]Sheet1'!name", {
      workbookName: '16',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);

    isRCEqual("'[Workbook.xlsx]Sheet1'!name", {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      name: 'name'
    }, opts);
  });
});

describe('R1C1 trimmed ranges', () => {
  const locks = { $r0: true, $r1: true, $c0: true, $c1: true };
  const opts = [ {}, { xlsx: true } ];

  for (const opt of opts) {
    test(`trimmed ranges with ${opt.xlsx ? 'XLSX' : 'default'} options`, () => {
      isRCEqual('R[1]C[1]:R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2 } }, opt);
      isRCEqual('R[1]C[1].:R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trim: 'head' } }, opt);
      isRCEqual('R[1]C[1]:.R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trim: 'tail' } }, opt);
      isRCEqual('R[1]C[1].:.R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trim: 'both' } }, opt);

      isRCEqual('R2C2:R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, ...locks } }, opt);
      isRCEqual('R2C2.:R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trim: 'head', ...locks } }, opt);
      isRCEqual('R2C2:.R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trim: 'tail', ...locks } }, opt);
      isRCEqual('R2C2.:.R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trim: 'both', ...locks } }, opt);

      isRCEqual('C[1]:C[2]', { range: { c0: 1, c1: 2 } }, opt);
      isRCEqual('C[1].:C[2]', { range: { c0: 1, c1: 2, trim: 'head' } }, opt);
      isRCEqual('C[1]:.C[2]', { range: { c0: 1, c1: 2, trim: 'tail' } }, opt);
      isRCEqual('C[1].:.C[2]', { range: { c0: 1, c1: 2, trim: 'both' } }, opt);

      isRCEqual('R[10]:R[10]', { range: { r0: 10, r1: 10 } }, opt);
      isRCEqual('R[10].:R[10]', { range: { r0: 10, r1: 10, trim: 'head' } }, opt);
      isRCEqual('R[10]:.R[10]', { range: { r0: 10, r1: 10, trim: 'tail' } }, opt);
      isRCEqual('R[10].:.R[10]', { range: { r0: 10, r1: 10, trim: 'both' } }, opt);

      isRCEqual('R[2]C[2]:R[4]', undefined, { ...opt });
      isRCEqual('R[2]C[2]:C[4]', undefined, { ...opt });
      isRCEqual('R[2]C[2].:.R[4]', undefined, { ...opt });
      isRCEqual('R[2]C[2].:.C[4]', undefined, { ...opt });

      isRCEqual('R[2]C[2]:R[4]', { range: { r0: 2, r1: 4, c0: 2 } }, { allowTernary: true, ...opt });
      isRCEqual('R[2]C[2]:C[4]', { range: { r0: 2, c0: 2, c1: 4 } }, { allowTernary: true, ...opt });
      isRCEqual('R[2]C[2].:.R[4]', { range: { r0: 2, r1: 4, c0: 2, trim: 'both' } }, { allowTernary: true, ...opt });
      isRCEqual('R[2]C[2].:.C[4]', { range: { r0: 2, c0: 2, c1: 4, trim: 'both' } }, { allowTernary: true, ...opt });
    });
  }
});
