/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import { MAX_COLS, MAX_ROWS } from './constants.js';
import { parseRCRef } from './rc.js';

Test.prototype.isRCEqual = function isTokens (expr, result, opts) {
  if (result) {
    result = {
      sheetName: '',
      workbookName: '',
      name: '',
      range: null,
      ...result
    };
    if (result.range && typeof result.range === 'object') {
      // mix in some defaults so we don't have to write things out in full
      result.range = {
        r0: null, c0: null, r1: null, c1: null,
        $r0: false, $c0: false, $r1: false, $c1: false,
        ...result.range
      };
    }
  }
  this.deepEqual(parseRCRef(expr, opts), result, expr);
};

test('parse single R1C1 references', t => {
  // current row
  t.isRCEqual('R', { range: { r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $c0: true, $c1: true } });
  t.isRCEqual('R[0]', { range: { r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $c0: true, $c1: true } });
  // row N (equivalent to 1:1)
  t.isRCEqual('R0', { name: 'R0' });
  t.isRCEqual('R1', { range: { r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $r0: true, $r1: true, $c0: true, $c1: true } });
  t.isRCEqual('R10', { range: { r0: 9, c0: 0, r1: 9, c1: MAX_COLS, $r0: true, $r1: true, $c0: true, $c1: true } });
  // row following current
  t.isRCEqual('R[1]', { range: { r0: 1, c0: 0, r1: 1, c1: MAX_COLS, $c0: true, $c1: true } });
  // row preceding current
  t.isRCEqual('R[-1]', { range: { r0: -1, c0: 0, r1: -1, c1: MAX_COLS, $c0: true, $c1: true } });
  // current column
  t.isRCEqual('C', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $r0: true, $r1: true } });
  t.isRCEqual('C[0]', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $r0: true, $r1: true } });
  // column N (equivalent to A:A)
  t.isRCEqual('C0', { name: 'C0' });
  t.isRCEqual('C1', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('C10', { range: { r0: 0, c0: 9, r1: MAX_ROWS, c1: 9, $c0: true, $c1: true, $r0: true, $r1: true } });
  // column following current
  t.isRCEqual('C[1]', { range: { r0: 0, c0: 1, r1: MAX_ROWS, c1: 1, $r0: true, $r1: true } });
  // column preceding current
  t.isRCEqual('C[-1]', { range: { r0: 0, c0: -1, r1: MAX_ROWS, c1: -1, $r0: true, $r1: true } });
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

test('parse joined R1C1 references', t => {
  // all "mirrored" refs are equivalent of the non mirrored counterparts...
  t.isRCEqual('R:R', { range: { r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $c0: true, $c1: true } });
  t.isRCEqual('R[0]:R[0]', { range: { r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $c0: true, $c1: true } });
  t.isRCEqual('R1:R1', { range: { r0: 0, c0: 0, r1: 0, c1: MAX_COLS, $r0: true, $r1: true, $c0: true, $c1: true } });
  t.isRCEqual('R10:R10', { range: { r0: 9, c0: 0, r1: 9, c1: MAX_COLS, $r0: true, $r1: true, $c0: true, $c1: true } });
  t.isRCEqual('R[1]:R[1]', { range: { r0: 1, c0: 0, r1: 1, c1: MAX_COLS, $c0: true, $c1: true } });
  t.isRCEqual('R[-1]:R[-1]', { range: { r0: -1, c0: 0, r1: -1, c1: MAX_COLS, $c0: true, $c1: true } });
  t.isRCEqual('C:C', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $r0: true, $r1: true } });
  t.isRCEqual('C[0]:C[0]', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $r0: true, $r1: true } });
  t.isRCEqual('C1:C1', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('C10:C10', { range: { r0: 0, c0: 9, r1: MAX_ROWS, c1: 9, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('C[1]:C[1]', { range: { r0: 0, c0: 1, r1: MAX_ROWS, c1: 1, $r0: true, $r1: true } });
  t.isRCEqual('C[-1]:C[-1]', { range: { r0: 0, c0: -1, r1: MAX_ROWS, c1: -1, $r0: true, $r1: true } });
  t.isRCEqual('R0:R0', null);
  t.isRCEqual('C0:C0', null);
  t.isRCEqual('R[9]C9:R[9]C9', { range: { r0: 9, c0: 8, r1: 9, c1: 8, $c0: true, $c1: true } });
  t.isRCEqual('R9C[9]:R9C[9]', { range: { r0: 8, c0: 9, r1: 8, c1: 9, $r0: true, $r1: true } });
  t.isRCEqual('R[1]C[1]:R1C1', { range: { r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true } });
  t.isRCEqual('R[1]C[1]:R1C1', { range: { r0: 1, c0: 1, r1: 0, c1: 0, $c1: true, $r1: true } });
  t.isRCEqual('R1C1:R2C2', { range: { r0: 0, c0: 0, r1: 1, c1: 1, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('R2C2:R1C1', { range: { r0: 1, c0: 1, r1: 0, c1: 0, $c0: true, $c1: true, $r0: true, $r1: true } });
  // single thing
  t.isRCEqual('C1:C3', { range: { r0: 0, c0: 0, r1: MAX_ROWS, c1: 2, $c0: true, $c1: true, $r0: true, $r1: true } });
  t.isRCEqual('R[1]:R3', { range: { r0: 1, c0: 0, r1: 2, c1: MAX_COLS, $c0: true, $c1: true, $r0: false, $r1: true } });
  t.isRCEqual('R[1]C1:R1C[-1]', { range: { r0: 1, c0: 0, r1: 0, c1: -1, $r0: false, $c0: true, $r1: true, $c1: false } });
  // many things
  t.isRCEqual('R:C', null);
  t.isRCEqual('R:RC', null);
  t.isRCEqual('RC:R', null);
  t.isRCEqual('RC:C', null);
  t.isRCEqual('C:R', null);
  t.isRCEqual('C:RC', null);
  t.end();
});
