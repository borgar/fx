/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import { MAX_COLS, MAX_ROWS } from './constants.js';
import { parseR1C1Ref, stringifyR1C1Ref, toR1C1 } from './rc.js';

Test.prototype.isRCEqual = function isTokens (expr, expect, opts) {
  if (expect) {
    expect = (opts?.xlsx)
      ? { workbookName: '', sheetName: '', ...expect }
      : { context: [], ...expect };
    if (expect.range && typeof expect.range === 'object') {
      // mix in some defaults so we don't have to write things out in full
      expect.range = {
        r0: null, c0: null, r1: null, c1: null,
        $r0: false, $c0: false, $r1: false, $c1: false,
        trimTL: false, trimBR: false,
        ...expect.range
      };
    }
  }
  this.deepEqual(parseR1C1Ref(expr, opts), expect, expr);
};

Test.prototype.isR1C1Rendered = function isTokens (range, expect, d) {
  this.is(toR1C1(range, d), expect, expect);
};

test('parse single R1C1 references', t => {
  // current row
  t.isRCEqual('R', { range: { r0: 0, r1: 0 } });
  t.isRCEqual('R[0]', { range: { r0: 0, r1: 0 } });
  // row N (equivalent to 1:1)
  t.isRCEqual('R0', { name: 'R0' });
  t.isRCEqual('R1', { range: { r0: 0, r1: 0, $r0: true, $r1: true } });
  t.isRCEqual('R10', { range: { r0: 9, r1: 9, $r0: true, $r1: true } });
  // row following current
  t.isRCEqual('R[1]', { range: { r0: 1, r1: 1 } });
  // row preceding current
  t.isRCEqual('R[-1]', { range: { r0: -1, r1: -1 } });

  // current column
  t.isRCEqual('C', { range: { c0: 0, c1: 0 } });
  t.isRCEqual('C[0]', { range: { c0: 0, c1: 0 } });
  // column N (equivalent to A:A)
  t.isRCEqual('C0', { name: 'C0' });
  t.isRCEqual('C1', { range: { c0: 0, c1: 0, $c0: true, $c1: true } });
  t.isRCEqual('C10', { range: { c0: 9, c1: 9, $c0: true, $c1: true } });
  // column following current
  t.isRCEqual('C[1]', { range: { c0: 1, c1: 1 } });
  // column preceding current
  t.isRCEqual('C[-1]', { range: { c0: -1, c1: -1 } });
  // current cell
  t.isRCEqual('RC', { range: { r0: 0, c0: 0, r1: 0, c1: 0 } });
  t.isRCEqual('R0C0', { name: 'R0C0' });
  // fixed cell
  t.isRCEqual('R1C1', { range: { r0: 0, c0: 0, r1: 0, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('R10C8', { range: { r0: 9, c0: 7, r1: 9, c1: 7, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('R-10C-8', null);

  // relative parts
  t.isRCEqual('R[2]C', { range: { r0: 2, c0: 0, r1: 2, c1: 0 } });
  t.isRCEqual('R[-2]C', { range: { r0: -2, c0: 0, r1: -2, c1: 0 } });
  t.isRCEqual('RC[3]', { range: { r0: 0, c0: 3, r1: 0, c1: 3 } });
  t.isRCEqual('RC[-3]', { range: { r0: 0, c0: -3, r1: 0, c1: -3 } });
  t.isRCEqual('R[2]C[4]', { range: { r0: 2, c0: 4, r1: 2, c1: 4 } });
  t.isRCEqual('R[-2]C[-4]', { range: { r0: -2, c0: -4, r1: -2, c1: -4 } });
  // mixed fixed and relative
  t.isRCEqual('R[9]C9', { range: { r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true } });
  t.isRCEqual('R9C[9]', { range: { r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true } });

  // out of bounds
  t.isRCEqual('R1048577', { name: 'R1048577' });
  t.isRCEqual('R[1048576]', null);
  t.isRCEqual('C16385', { name: 'C16385' });
  t.isRCEqual('C[16384]', null);

  t.end();
});

test('R1C1 partial ranges', t => {
  const opts = { allowTernary: true };
  // partials are not allowed by defult
  t.isRCEqual('R[-5]C[-2]:C[-2]', null);
  t.isRCEqual('R1:R1C1', null);
  // beam type partials A1:A @ C6
  t.isRCEqual('R[-5]C[-2]:C[-2]', { range: { r0: -5, c0: -2, c1: -2 } }, opts);
  t.isRCEqual('C[-2]:R[-5]C[-2]', { range: { r0: -5, c0: -2, c1: -2 } }, opts);
  t.isRCEqual('R[-5]C[-3]:R[-5]', { range: { r0: -5, c0: -3, r1: -5 } }, opts);
  t.isRCEqual('R[-5]:R[-5]C[-3]', { range: { r0: -5, c0: -3, r1: -5 } }, opts);
  t.isRCEqual('R[-6]C1:C1', { range: { r0: -6, c0: 0, c1: 0, $c0: true, $c1: true } }, opts);
  t.isRCEqual('C1:R[-6]C1', { range: { r0: -6, c0: 0, c1: 0, $c0: true, $c1: true } }, opts);
  t.isRCEqual('R[-6]C1:R[-6]', { range: { r0: -6, c0: 0, r1: -6, $c0: true, $c1: true } }, opts);
  t.isRCEqual('R[-6]:R[-6]C1', { range: { r0: -6, c0: 0, r1: -6, $c0: true, $c1: true } }, opts);
  t.isRCEqual('R1C[-2]:C[-2]', { range: { r0: 0, c0: -2, c1: -2, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
  t.isRCEqual('C[-2]:R1C[-2]', { range: { r0: 0, c0: -2, c1: -2, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
  t.isRCEqual('R1C[-3]:R1', { range: { r0: 0, c0: -3, r1: 0, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
  t.isRCEqual('R1:R1C[-3]', { range: { r0: 0, c0: -3, r1: 0, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
  t.isRCEqual('R1C1:C1', { range: { r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  t.isRCEqual('C1:R1C1', { range: { r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  t.isRCEqual('R1C1:R1', { range: { r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  t.isRCEqual('R1:R1C1', { range: { r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  // range type partials P1:10 @ F6
  t.isRCEqual('R[-5]C[10]:R[4]', { range: { r0: -5, c0: 10, r1: 4 } }, opts);
  t.isRCEqual('R[4]:R[-5]C[10]', { range: { r0: -5, c0: 10, r1: 4 } }, opts);
  t.isRCEqual('R[-6]C16:R[3]', { range: { r0: -6, c0: 15, r1: 3, $c0: true, $c1: true } }, opts);
  t.isRCEqual('R[3]:R[-6]C16', { range: { r0: -6, c0: 15, r1: 3, $c0: true, $c1: true } }, opts);
  t.isRCEqual('R1C[10]:R10', { range: { r0: 0, c0: 10, r1: 9, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
  t.isRCEqual('R10:R1C[10]', { range: { r0: 0, c0: 10, r1: 9, $r0: true, $c0: false, $r1: true, $c1: false } }, opts);
  t.isRCEqual('R1C16:R10', { range: { r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  t.isRCEqual('R10:R1C16', { range: { r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true } }, opts);
  t.end();
});

test('parse joined R1C1 references', t => {
  // all "mirrored" refs are equivalent of the non mirrored counterparts...
  t.isRCEqual('R:R', { range: { r0: 0, r1: 0 } });
  t.isRCEqual('R[0]:R[0]', { range: { r0: 0, r1: 0 } });
  t.isRCEqual('R1:R1', { range: { r0: 0, r1: 0, $r0: true, $r1: true } });
  t.isRCEqual('R10:R10', { range: { r0: 9, r1: 9, $r0: true, $r1: true } });
  t.isRCEqual('R[1]:R[1]', { range: { r0: 1, r1: 1 } });
  t.isRCEqual('R[-1]:R[-1]', { range: { r0: -1, r1: -1 } });

  t.isRCEqual('C:C', { range: { c0: 0, c1: 0 } });
  t.isRCEqual('C[0]:C[0]', { range: { c0: 0, c1: 0 } });
  t.isRCEqual('C1:C1', { range: { c0: 0, c1: 0, $c0: true, $c1: true } });
  t.isRCEqual('C10:C10', { range: { c0: 9, c1: 9, $c0: true, $c1: true } });
  t.isRCEqual('C[1]:C[1]', { range: { c0: 1, c1: 1 } });
  t.isRCEqual('C[-1]:C[-1]', { range: { c0: -1, c1: -1 } });

  t.isRCEqual('R0:R0', null);
  t.isRCEqual('C0:C0', null);
  t.isRCEqual('R[9]C9:R[9]C9', { range: { r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true } });
  t.isRCEqual('R9C[9]:R9C[9]', { range: { r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true } });
  t.isRCEqual('R[1]C[1]:R1C1', { range: { r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true } });
  t.isRCEqual('R[1]C[1]:R1C1', { range: { r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true } });
  t.isRCEqual('R1C1:R2C2', { range: { r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('R2C2:R1C1', { range: { r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true } });
  // single thing
  t.isRCEqual('C1:C3', { range: { c0: 0, c1: 2, $c0: true, $c1: true } });
  t.isRCEqual('R[1]:R3', { range: { r0: 1, r1: 2, $r1: true } });
  t.isRCEqual('R[1]C1:R1C[-1]', { range: { r0: 1, c0: 0, r1: 0, c1: -1, $c0: true, $r1: true, $c1: false } });
  // many things
  t.isRCEqual('R:C', null);
  t.isRCEqual('R:RC', null);
  t.isRCEqual('RC:R', null);
  t.isRCEqual('RC:C', null);
  t.isRCEqual('C:R', null);
  t.isRCEqual('C:RC', null);
  t.end();
});

test('parse R1C1 ranges in XLSX mode', t => {
  const opts = { xlsx: true };
  const rcRange = { r0: 0, c0: 0, r1: 0, c1: 0 };
  t.isRCEqual('[1]!RC', {
    workbookName: '1',
    sheetName: '',
    range: rcRange
  }, opts);

  t.isRCEqual('[Workbook.xlsx]!RC', {
    workbookName: 'Workbook.xlsx',
    sheetName: '',
    range: rcRange
  }, opts);

  t.isRCEqual('[1]Sheet1!RC', {
    workbookName: '1',
    sheetName: 'Sheet1',
    range: rcRange
  }, opts);

  t.isRCEqual('[Workbook.xlsx]Sheet1!RC', {
    workbookName: 'Workbook.xlsx',
    sheetName: 'Sheet1',
    range: rcRange
  }, opts);

  t.isRCEqual('[4]!name', {
    workbookName: '4',
    sheetName: '',
    name: 'name'
  }, opts);

  t.isRCEqual('[Workbook.xlsx]!name', {
    workbookName: 'Workbook.xlsx',
    sheetName: '',
    name: 'name'
  }, opts);

  t.isRCEqual('[16]Sheet1!name', {
    workbookName: '16',
    sheetName: 'Sheet1',
    name: 'name'
  }, opts);

  t.isRCEqual('[Workbook.xlsx]Sheet1!name', {
    workbookName: 'Workbook.xlsx',
    sheetName: 'Sheet1',
    name: 'name'
  }, opts);

  t.isRCEqual("='[1]'!RC", {
    workbookName: '1',
    sheetName: '',
    range: rcRange
  }, opts);

  t.isRCEqual("='[Workbook.xlsx]'!RC", {
    workbookName: 'Workbook.xlsx',
    sheetName: '',
    range: rcRange
  }, opts);

  t.isRCEqual("'[1]Sheet1'!RC", {
    workbookName: '1',
    sheetName: 'Sheet1',
    range: rcRange
  }, opts);

  t.isRCEqual("'[Workbook.xlsx]Sheet1'!RC", {
    workbookName: 'Workbook.xlsx',
    sheetName: 'Sheet1',
    range: rcRange
  }, opts);

  t.isRCEqual("'[4]'!name", {
    workbookName: '4',
    sheetName: '',
    name: 'name'
  }, opts);

  t.isRCEqual("'[Workbook.xlsx]'!name", {
    workbookName: 'Workbook.xlsx',
    sheetName: '',
    name: 'name'
  }, opts);

  t.isRCEqual("'[16]Sheet1'!name", {
    workbookName: '16',
    sheetName: 'Sheet1',
    name: 'name'
  }, opts);

  t.isRCEqual("'[Workbook.xlsx]Sheet1'!name", {
    workbookName: 'Workbook.xlsx',
    sheetName: 'Sheet1',
    name: 'name'
  }, opts);

  t.end();
});

test('R1C1 trimmed ranges', t => {
  const locks = { $r0: true, $r1: true, $c0: true, $c1: true };
  const opts = [ {}, { xlsx: true } ];
  for (const opt of opts) {
    t.isRCEqual('R[1]C[1]:R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2 } }, opt);
    t.isRCEqual('R[1]C[1].:R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trimTL: true } }, opt);
    t.isRCEqual('R[1]C[1]:.R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trimBR: true } }, opt);
    t.isRCEqual('R[1]C[1].:.R[2]C[2]', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trimTL: true, trimBR: true } }, opt);

    t.isRCEqual('R2C2:R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, ...locks } }, opt);
    t.isRCEqual('R2C2.:R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trimTL: true, ...locks } }, opt);
    t.isRCEqual('R2C2:.R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trimBR: true, ...locks } }, opt);
    t.isRCEqual('R2C2.:.R3C3', { range: { r0: 1, r1: 2, c0: 1, c1: 2, trimTL: true, trimBR: true, ...locks } }, opt);

    t.isRCEqual('C[1]:C[2]', { range: { c0: 1, c1: 2 } }, opt);
    t.isRCEqual('C[1].:C[2]', { range: { c0: 1, c1: 2, trimTL: true } }, opt);
    t.isRCEqual('C[1]:.C[2]', { range: { c0: 1, c1: 2, trimBR: true } }, opt);
    t.isRCEqual('C[1].:.C[2]', { range: { c0: 1, c1: 2, trimTL: true, trimBR: true } }, opt);

    t.isRCEqual('R[10]:R[10]', { range: { r0: 10, r1: 10 } }, opt);
    t.isRCEqual('R[10].:R[10]', { range: { r0: 10, r1: 10, trimTL: true } }, opt);
    t.isRCEqual('R[10]:.R[10]', { range: { r0: 10, r1: 10, trimBR: true } }, opt);
    t.isRCEqual('R[10].:.R[10]', { range: { r0: 10, r1: 10, trimTL: true, trimBR: true } }, opt);

    t.isRCEqual('R[2]C[2]:R[4]', null, { ...opt });
    t.isRCEqual('R[2]C[2]:C[4]', null, { ...opt });
    t.isRCEqual('R[2]C[2].:.R[4]', null, { ...opt });
    t.isRCEqual('R[2]C[2].:.C[4]', null, { ...opt });

    t.isRCEqual('R[2]C[2]:R[4]', { range: { r0: 2, r1: 4, c0: 2 } }, { allowTernary: true, ...opt });
    t.isRCEqual('R[2]C[2]:C[4]', { range: { r0: 2, c0: 2, c1: 4 } }, { allowTernary: true, ...opt });
    t.isRCEqual('R[2]C[2].:.R[4]', { range: { r0: 2, r1: 4, c0: 2, trimTL: true, trimBR: true } }, { allowTernary: true, ...opt });
    t.isRCEqual('R[2]C[2].:.C[4]', { range: { r0: 2, c0: 2, c1: 4, trimTL: true, trimBR: true } }, { allowTernary: true, ...opt });
  }
  t.end();
});

test('R1C1 serialization', t => {
  // ray
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: MAX_COLS }, 'R');
  t.isR1C1Rendered({ r0: 0, r1: 0 }, 'R');
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $r0: true, $r1: true }, 'R1');
  t.isR1C1Rendered({ r0: 0, r1: 0, $r0: true, $r1: true }, 'R1');
  t.isR1C1Rendered({ r0: 1, c0: 0, r1: 1, c1: MAX_COLS }, 'R[1]');
  t.isR1C1Rendered({ r0: 1, r1: 1 }, 'R[1]');
  // ray
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: MAX_ROWS, c1: 0 }, 'C');
  t.isR1C1Rendered({ c0: 0, c1: 0 }, 'C');
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $c0: true, $c1: true }, 'C1');
  t.isR1C1Rendered({ c0: 0, c1: 0, $c0: true, $c1: true }, 'C1');
  t.isR1C1Rendered({ r0: 0, c0: 1, r1: MAX_ROWS, c1: 1 }, 'C[1]');
  t.isR1C1Rendered({ c0: 1, c1: 1 }, 'C[1]');
  // rect
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: 0 }, 'RC');
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: 0, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true }, 'R1C1');
  t.isR1C1Rendered({ r0: 9, c0: 7, r1: 9, c1: 7, $c0: true, $c1: true, $r0: true, $r1: true }, 'R10C8');
  t.isR1C1Rendered({ r0: 2, c0: 0, r1: 2, c1: 0 }, 'R[2]C');
  t.isR1C1Rendered({ r0: -2, c0: 0, r1: -2, c1: 0 }, 'R[-2]C');
  t.isR1C1Rendered({ r0: 0, c0: 3, r1: 0, c1: 3 }, 'RC[3]');
  t.isR1C1Rendered({ r0: 0, c0: -3, r1: 0, c1: -3 }, 'RC[-3]');
  t.isR1C1Rendered({ r0: 2, c0: 4, r1: 2, c1: 4 }, 'R[2]C[4]');
  t.isR1C1Rendered({ r0: -2, c0: -4, r1: -2, c1: -4 }, 'R[-2]C[-4]');
  t.isR1C1Rendered({ r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true }, 'R[9]C9');
  t.isR1C1Rendered({ r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true }, 'R9C[9]');
  t.isR1C1Rendered({ r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true }, 'R[1]C[1]:R1C1');
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true }, 'R1C1:R2C2');
  t.isR1C1Rendered({ c0: 0, c1: 2, $c0: true, $c1: true }, 'C1:C3');
  t.isR1C1Rendered({ r0: 1, r1: 2, $r1: true }, 'R[1]:R3');
  t.isR1C1Rendered({ r0: 1, c0: 0, r1: 0, c1: -1, $c0: true, $r1: true }, 'R[1]C1:R1C[-1]');
  // partial
  t.isR1C1Rendered({ r0: -5, c0: -2, c1: -2 }, 'R[-5]C[-2]:C[-2]');
  t.isR1C1Rendered({ r0: -5, c0: -3, r1: -5 }, 'R[-5]C[-3]:R[-5]');
  t.isR1C1Rendered({ r0: -6, c0: 0, c1: 0, $c0: true, $c1: true }, 'R[-6]C1:C1');
  t.isR1C1Rendered({ r0: -6, c0: 0, r1: -6, $c0: true, $c1: true }, 'R[-6]C1:R[-6]');
  t.isR1C1Rendered({ r0: 0, c0: -2, c1: -2, $r0: true, $r1: true }, 'R1C[-2]:C[-2]');
  t.isR1C1Rendered({ r0: 0, c0: -3, r1: 0, $r0: true, $r1: true }, 'R1C[-3]:R1');
  t.isR1C1Rendered({ r0: 0, c0: 0, c1: 0, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C1:C1');
  t.isR1C1Rendered({ r0: 0, c0: 0, r1: 0, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C1:R1');
  t.isR1C1Rendered({ r0: -5, c0: 10, r1: 4 }, 'R[-5]C[10]:R[4]');
  t.isR1C1Rendered({ r0: -6, c0: 15, r1: 3, $c0: true, $c1: true }, 'R[-6]C16:R[3]');
  t.isR1C1Rendered({ r0: 0, c0: 10, r1: 9, $r0: true, $r1: true }, 'R1C[10]:R10');
  t.isR1C1Rendered({ r0: 0, c0: 15, r1: 9, $r0: true, $c0: true, $r1: true, $c1: true }, 'R1C16:R10');
  // allow skipping right/bottom for cells
  t.isR1C1Rendered({ r0: -5, c0: -2 }, 'R[-5]C[-2]');
  // clamp the range at min/max dimensions
  const abs = { $r0: true, $c0: true, $r1: true, $c1: true };
  t.isR1C1Rendered({ r0: 1, c0: -20000, r1: 1, c1: 20000, ...abs }, 'R2');
  t.isR1C1Rendered({ r0: -15e5, c0: 1, r1: 15e5, c1: 1, ...abs }, 'C2');
  t.isR1C1Rendered({ r0: -5, c0: -2, r1: -8, c1: -7, ...abs }, 'R1C1');
  t.isR1C1Rendered({ r0: 0, c0: -20000, r1: 0, c1: 20000 }, 'RC[-16383]:RC[16383]');
  t.isR1C1Rendered({ r0: -15e5, c0: 0, r1: 15e5, c1: 0 }, 'R[-1048575]C:R[1048575]C');
  t.isR1C1Rendered({ r0: 0.5, c0: 0.5, r1: 0.5, c1: 0.5, ...abs }, 'R1C1');
  t.isR1C1Rendered({ r0: 0.5, c0: 0.5, r1: 0.5, c1: 0.5 }, 'RC');
  // trimming
  t.isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2 }, 'R[1]C[1]:R[2]C[2]');
  t.isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trimTL: true }, 'R[1]C[1].:R[2]C[2]');
  t.isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trimBR: true }, 'R[1]C[1]:.R[2]C[2]');
  t.isR1C1Rendered({ r0: 1, c0: 1, r1: 2, c1: 2, trimTL: true, trimBR: true }, 'R[1]C[1].:.R[2]C[2]');
  t.isR1C1Rendered({ r0: 1, c0: 1, r1: 1, c1: 1, trimTL: true, trimBR: true }, 'R[1]C[1]');
  t.isR1C1Rendered({ r0: 1, r1: 1 }, 'R[1]');
  t.isR1C1Rendered({ r0: 1, r1: 1, trimTL: true }, 'R[1].:R[1]');
  t.isR1C1Rendered({ r0: 1, r1: 1, trimTL: true, trimBR: true }, 'R[1].:.R[1]');
  t.isR1C1Rendered({ c0: 1, c1: 1 }, 'C[1]');
  t.isR1C1Rendered({ c0: 1, c1: 1, trimBR: true }, 'C[1]:.C[1]');
  t.isR1C1Rendered({ c0: 1, c1: 1, trimTL: true, trimBR: true }, 'C[1].:.C[1]');
  t.isR1C1Rendered({ r0: -5, c0: -2, c1: -2, trimTL: true, trimBR: true }, 'R[-5]C[-2].:.C[-2]');
  t.end();
});

test('stringifyR1C1Ref', t => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };
  const testRef = (ref, expect) => t.is(stringifyR1C1Ref(ref), expect, expect);
  testRef({ range: rangeA1 }, 'R[2]C[4]');
  testRef({ context: [ 'Sheet1' ], range: rangeA1 }, 'Sheet1!R[2]C[4]');
  testRef({ context: [ 'Sheet 1' ], range: rangeA1 }, "'Sheet 1'!R[2]C[4]");
  testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, '[MyFile.xlsx]Sheet1!R[2]C[4]');
  testRef({ context: [ 'My File.xlsx', 'Sheet1' ], range: rangeA1 }, "'[My File.xlsx]Sheet1'!R[2]C[4]");
  testRef({ context: [ 'MyFile.xlsx' ], range: rangeA1 }, 'MyFile.xlsx!R[2]C[4]');
  testRef({ context: [ 'My File.xlsx' ], range: rangeA1 }, "'My File.xlsx'!R[2]C[4]");
  testRef({ name: 'foo' }, 'foo');
  testRef({ context: [ 'Sheet1' ], name: 'foo' }, 'Sheet1!foo');
  testRef({ context: [ 'Sheet 1' ], name: 'foo' }, "'Sheet 1'!foo");
  testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
  testRef({ context: [ 'My File.xlsx', 'Sheet1' ], name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
  testRef({ context: [ 'MyFile.xlsx' ], name: 'foo' }, 'MyFile.xlsx!foo');
  testRef({ context: [ 'My File.xlsx' ], name: 'foo' }, "'My File.xlsx'!foo");
  t.end();
});

test('stringifyR1C1Ref in XLSX mode', t => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };
  const testRef = (ref, expect) => t.is(stringifyR1C1Ref(ref, { xlsx: true }), expect, expect);
  testRef({ range: rangeA1 }, 'R[2]C[4]');
  testRef({ sheetName: 'Sheet1', range: rangeA1 }, 'Sheet1!R[2]C[4]');
  testRef({ sheetName: 'Sheet 1', range: rangeA1 }, "'Sheet 1'!R[2]C[4]");
  testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 }, '[MyFile.xlsx]Sheet1!R[2]C[4]');
  testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', range: rangeA1 }, "'[My File.xlsx]Sheet1'!R[2]C[4]");
  testRef({ workbookName: 'MyFile.xlsx', range: rangeA1 }, '[MyFile.xlsx]!R[2]C[4]');
  testRef({ workbookName: 'My File.xlsx', range: rangeA1 }, "'[My File.xlsx]'!R[2]C[4]");
  testRef({ name: 'foo' }, 'foo');
  testRef({ sheetName: 'Sheet1', name: 'foo' }, 'Sheet1!foo');
  testRef({ sheetName: 'Sheet 1', name: 'foo' }, "'Sheet 1'!foo");
  testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
  testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
  testRef({ workbookName: 'MyFile.xlsx', name: 'foo' }, '[MyFile.xlsx]!foo');
  testRef({ workbookName: 'My File.xlsx', name: 'foo' }, "'[My File.xlsx]'!foo");
  // ignore .context
  testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, 'R[2]C[4]');
  testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, 'foo');
  t.end();
});
