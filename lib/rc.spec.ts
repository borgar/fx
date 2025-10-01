/* eslint-disable object-property-newline, object-curly-newline */
import { describe, test, expect } from 'vitest';
import { MAX_COLS, MAX_ROWS } from './constants.js';
import { parseR1C1Ref, stringifyR1C1Ref, toR1C1 } from './rc.js';

function isRCEqual(expr: string, expected: any, opts?: any) {
  if (expected) {
    expected = (opts?.xlsx)
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
  expect(parseR1C1Ref(expr, opts)).toEqual(expected);
}

function isR1C1Rendered(range: any, expected: string, d?: any) {
  expect(toR1C1(range, d)).toBe(expected);
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
    isRCEqual('R-10C-8', null);
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
    isRCEqual('R[1048576]', null);
    isRCEqual('C16385', { name: 'C16385' });
    isRCEqual('C[16384]', null);
  });
});

describe('R1C1 partial ranges', () => {
  const opts = { allowTernary: true };

  test('partials are not allowed by default', () => {
    isRCEqual('R[-5]C[-2]:C[-2]', null);
    isRCEqual('R1:R1C1', null);
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
    isRCEqual('R0:R0', null);
    isRCEqual('C0:C0', null);
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
    isRCEqual('R:C', null);
    isRCEqual('R:RC', null);
    isRCEqual('RC:R', null);
    isRCEqual('RC:C', null);
    isRCEqual('C:R', null);
    isRCEqual('C:RC', null);
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

      isRCEqual('R[2]C[2]:R[4]', null, { ...opt });
      isRCEqual('R[2]C[2]:C[4]', null, { ...opt });
      isRCEqual('R[2]C[2].:.R[4]', null, { ...opt });
      isRCEqual('R[2]C[2].:.C[4]', null, { ...opt });

      isRCEqual('R[2]C[2]:R[4]', { range: { r0: 2, r1: 4, c0: 2 } }, { allowTernary: true, ...opt });
      isRCEqual('R[2]C[2]:C[4]', { range: { r0: 2, c0: 2, c1: 4 } }, { allowTernary: true, ...opt });
      isRCEqual('R[2]C[2].:.R[4]', { range: { r0: 2, r1: 4, c0: 2, trim: 'both' } }, { allowTernary: true, ...opt });
      isRCEqual('R[2]C[2].:.C[4]', { range: { r0: 2, c0: 2, c1: 4, trim: 'both' } }, { allowTernary: true, ...opt });
    });
  }
});

describe('R1C1 serialization', () => {
  test('ray serialization', () => {
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: MAX_COLS }, 'R');
    isR1C1Rendered({ r0: 0, r1: 0 }, 'R');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $r0: true, $r1: true }, 'R1');
    isR1C1Rendered({ r0: 0, r1: 0, $r0: true, $r1: true }, 'R1');
    isR1C1Rendered({ r0: 1, c0: 0, r1: 1, c1: MAX_COLS }, 'R[1]');
    isR1C1Rendered({ r0: 1, r1: 1 }, 'R[1]');

    isR1C1Rendered({ r0: 0, c0: 0, r1: MAX_ROWS, c1: 0 }, 'C');
    isR1C1Rendered({ c0: 0, c1: 0 }, 'C');
    isR1C1Rendered({ r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $c0: true, $c1: true }, 'C1');
    isR1C1Rendered({ c0: 0, c1: 0, $c0: true, $c1: true }, 'C1');
    isR1C1Rendered({ r0: 0, c0: 1, r1: MAX_ROWS, c1: 1 }, 'C[1]');
    isR1C1Rendered({ c0: 1, c1: 1 }, 'C[1]');
  });

  test('rectangle serialization', () => {
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: 0 }, 'RC');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true }, 'R1C1');
    isR1C1Rendered({ r0: 9, c0: 7, r1: 9, c1: 7, $c0: true, $c1: true, $r0: true, $r1: true }, 'R10C8');
    isR1C1Rendered({ r0: 2, c0: 0, r1: 2, c1: 0 }, 'R[2]C');
    isR1C1Rendered({ r0: -2, c0: 0, r1: -2, c1: 0 }, 'R[-2]C');
    isR1C1Rendered({ r0: 0, c0: 3, r1: 0, c1: 3 }, 'RC[3]');
    isR1C1Rendered({ r0: 0, c0: -3, r1: 0, c1: -3 }, 'RC[-3]');
    isR1C1Rendered({ r0: 2, c0: 4, r1: 2, c1: 4 }, 'R[2]C[4]');
    isR1C1Rendered({ r0: -2, c0: -4, r1: -2, c1: -4 }, 'R[-2]C[-4]');
    isR1C1Rendered({ r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true }, 'R[9]C9');
    isR1C1Rendered({ r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true }, 'R9C[9]');
  });

  test('range serialization', () => {
    isR1C1Rendered({ r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true }, 'R[1]C[1]:R1C1');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true }, 'R1C1:R2C2');
    isR1C1Rendered({ c0: 0, c1: 2, $c0: true, $c1: true }, 'C1:C3');
    isR1C1Rendered({ r0: 1, r1: 2, $r1: true }, 'R[1]:R3');
    isR1C1Rendered({ r0: 1, c0: 0, r1: 0, c1: -1, $c0: true, $r1: true }, 'R[1]C1:R1C[-1]');
  });

  test('partial serialization', () => {
    isR1C1Rendered({ r0: -5, c0: -2, c1: -2 }, 'R[-5]C[-2]:C[-2]');
    isR1C1Rendered({ r0: -5, c0: -3, r1: -5 }, 'R[-5]C[-3]:R[-5]');
    isR1C1Rendered({ r0: -6, c0: 0, c1: 0, $c0: true, $c1: true }, 'R[-6]C1:C1');
    isR1C1Rendered({ r0: -6, c0: 0, r1: -6, $c0: true, $c1: true }, 'R[-6]C1:R[-6]');
    isR1C1Rendered({ r0: 0, c0: -2, c1: -2, $r0: true, $r1: true }, 'R1C[-2]:C[-2]');
    isR1C1Rendered({ r0: 0, c0: -3, r1: 0, $r0: true, $r1: true }, 'R1C[-3]:R1');
    isR1C1Rendered({ r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C1:C1');
    isR1C1Rendered({ r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C1:R1');
    isR1C1Rendered({ r0: -5, c0: 10, r1: 4 }, 'R[-5]C[10]:R[4]');
    isR1C1Rendered({ r0: -6, c0: 15, r1: 3, $c0: true, $c1: true }, 'R[-6]C16:R[3]');
    isR1C1Rendered({ r0: 0, c0: 10, r1: 9, $r0: true, $r1: true }, 'R1C[10]:R10');
    isR1C1Rendered({ r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C16:R10');
  });

  test('edge cases', () => {
    // allow skipping right/bottom for cells
    isR1C1Rendered({ r0: -5, c0: -2 }, 'R[-5]C[-2]');

    // clamp the range at min/max dimensions
    const abs = { $r0: true, $c0: true, $r1: true, $c1: true };
    isR1C1Rendered({ r0: 1, c0: -20000, r1: 1, c1: 20000, ...abs }, 'R2');
    isR1C1Rendered({ r0: -15e5, c0: 1, r1: 15e5, c1: 1, ...abs }, 'C2');
    isR1C1Rendered({ r0: -5, c0: -2, r1: -8, c1: -7, ...abs }, 'R1C1');
    isR1C1Rendered({ r0: 0, c0: -20000, r1: 0, c1: 20000 }, 'RC[-16383]:RC[16383]');
    isR1C1Rendered({ r0: -15e5, c0: 0, r1: 15e5, c1: 0 }, 'R[-1048575]C:R[1048575]C');
    isR1C1Rendered({ r0: 0.5, c0: 0.5, r1: 0.5, c1: 0.5, ...abs }, 'R1C1');
    isR1C1Rendered({ r0: 0.5, c0: 0.5, r1: 0.5, c1: 0.5 }, 'RC');
  });

  test('trimming', () => {
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2 }, 'R[1]C[1]:R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trim: 'head' }, 'R[1]C[1].:R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trim: 'tail' }, 'R[1]C[1]:.R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trim: 'both' }, 'R[1]C[1].:.R[2]C[2]');
    isR1C1Rendered({ r0: 1, c0: 1, r1: 1, c1: 1, trim: 'both' }, 'R[1]C[1]');
    isR1C1Rendered({ r0: 1, r1: 1 }, 'R[1]');
    isR1C1Rendered({ r0: 1, r1: 1, trim: 'head' }, 'R[1].:R[1]');
    isR1C1Rendered({ r0: 1, r1: 1, trim: 'both' }, 'R[1].:.R[1]');
    isR1C1Rendered({ c0: 1, c1: 1 }, 'C[1]');
    isR1C1Rendered({ c0: 1, c1: 1, trim: 'tail' }, 'C[1]:.C[1]');
    isR1C1Rendered({ c0: 1, c1: 1, trim: 'both' }, 'C[1].:.C[1]');
    isR1C1Rendered({ r0: -5, c0: -2, c1: -2, trim: 'both' }, 'R[-5]C[-2].:.C[-2]');
  });
});

describe('stringifyR1C1Ref', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  function testRef(ref: any, expected: string) {
    expect(stringifyR1C1Ref(ref)).toBe(expected);
  }

  test('basic stringification', () => {
    testRef({ range: rangeA1 }, 'R[2]C[4]');
    testRef({ context: [ 'Sheet1' ], range: rangeA1 }, 'Sheet1!R[2]C[4]');
    testRef({ context: [ 'Sheet 1' ], range: rangeA1 }, "'Sheet 1'!R[2]C[4]");
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, '[MyFile.xlsx]Sheet1!R[2]C[4]');
    testRef({ context: [ 'My File.xlsx', 'Sheet1' ], range: rangeA1 }, "'[My File.xlsx]Sheet1'!R[2]C[4]");
    testRef({ context: [ 'MyFile.xlsx' ], range: rangeA1 }, 'MyFile.xlsx!R[2]C[4]');
    testRef({ context: [ 'My File.xlsx' ], range: rangeA1 }, "'My File.xlsx'!R[2]C[4]");
  });

  test('named ranges', () => {
    testRef({ name: 'foo' }, 'foo');
    testRef({ context: [ 'Sheet1' ], name: 'foo' }, 'Sheet1!foo');
    testRef({ context: [ 'Sheet 1' ], name: 'foo' }, "'Sheet 1'!foo");
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
    testRef({ context: [ 'My File.xlsx', 'Sheet1' ], name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
    testRef({ context: [ 'MyFile.xlsx' ], name: 'foo' }, 'MyFile.xlsx!foo');
    testRef({ context: [ 'My File.xlsx' ], name: 'foo' }, "'My File.xlsx'!foo");
  });
});

describe('stringifyR1C1Ref in XLSX mode', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  function testRef(ref: any, expected: string) {
    expect(stringifyR1C1Ref(ref, { xlsx: true })).toBe(expected);
  }

  test('basic stringification', () => {
    testRef({ range: rangeA1 }, 'R[2]C[4]');
    testRef({ sheetName: 'Sheet1', range: rangeA1 }, 'Sheet1!R[2]C[4]');
    testRef({ sheetName: 'Sheet 1', range: rangeA1 }, "'Sheet 1'!R[2]C[4]");
    testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 }, '[MyFile.xlsx]Sheet1!R[2]C[4]');
    testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', range: rangeA1 }, "'[My File.xlsx]Sheet1'!R[2]C[4]");
    testRef({ workbookName: 'MyFile.xlsx', range: rangeA1 }, '[MyFile.xlsx]!R[2]C[4]');
    testRef({ workbookName: 'My File.xlsx', range: rangeA1 }, "'[My File.xlsx]'!R[2]C[4]");
  });

  test('named ranges', () => {
    testRef({ name: 'foo' }, 'foo');
    testRef({ sheetName: 'Sheet1', name: 'foo' }, 'Sheet1!foo');
    testRef({ sheetName: 'Sheet 1', name: 'foo' }, "'Sheet 1'!foo");
    testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
    testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
    testRef({ workbookName: 'MyFile.xlsx', name: 'foo' }, '[MyFile.xlsx]!foo');
    testRef({ workbookName: 'My File.xlsx', name: 'foo' }, "'[My File.xlsx]'!foo");
  });

  test('ignores context in XLSX mode', () => {
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, 'R[2]C[4]');
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, 'foo');
  });
});
