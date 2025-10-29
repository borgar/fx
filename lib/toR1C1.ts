import { rangeOperator } from './a1.ts';
import { MAX_ROWS, MAX_COLS } from './constants.ts';
import type { RangeR1C1 } from './extraTypes.ts';

const clamp = (min: number, val: number, max: number) => Math.min(Math.max(val, min), max);

function toCoord (value: number, isAbs: boolean): string {
  if (isAbs) {
    return String(value + 1);
  }
  return value ? '[' + value + ']' : '';
}

/**
 * Stringify a range object into R1C1 syntax.
 * @internal
 */
export function toR1C1 (range: RangeR1C1): string {
  let { r0, c0, r1, c1 } = range;
  const { $c0, $c1, $r0, $r1 } = range;
  const nullR0 = r0 == null;
  const nullC0 = c0 == null;
  let nullR1 = r1 == null;
  let nullC1 = c1 == null;
  const op = rangeOperator(range.trim);
  const hasTrim = !!range.trim;
  r0 = clamp($r0 ? 0 : -MAX_ROWS, r0 | 0, MAX_ROWS);
  c0 = clamp($c0 ? 0 : -MAX_COLS, c0 | 0, MAX_COLS);
  if (!nullR0 && nullR1 && !nullC0 && nullC1) {
    r1 = r0;
    nullR1 = false;
    c1 = c0;
    nullC1 = false;
  }
  else {
    r1 = clamp($r1 ? 0 : -MAX_ROWS, r1 | 0, MAX_ROWS);
    c1 = clamp($c1 ? 0 : -MAX_COLS, c1 | 0, MAX_COLS);
  }
  // C:C
  const allRows = r0 === 0 && r1 >= MAX_ROWS;
  if ((allRows && !nullC0 && !nullC1) || (nullR0 && nullR1)) {
    const a = toCoord(c0, $c0);
    const b = toCoord(c1, $c1);
    return 'C' + (a === b && !hasTrim ? a : a + op + 'C' + b);
  }
  // R:R
  const allCols = c0 === 0 && c1 >= MAX_COLS;
  if ((allCols && !nullR0 && !nullR1) || (nullC0 && nullC1)) {
    const a = toCoord(r0, $r0);
    const b = toCoord(r1, $r1);
    return 'R' + (a === b && !hasTrim ? a : a + op + 'R' + b);
  }
  const s_r0 = toCoord(r0, $r0);
  const s_r1 = toCoord(r1, $r1);
  const s_c0 = toCoord(c0, $c0);
  const s_c1 = toCoord(c1, $c1);
  // RC:R, RC:C
  if (nullR0 || nullR1 || nullC0 || nullC1) {
    return (
      (nullR0 ? '' : 'R' + s_r0) +
      (nullC0 ? '' : 'C' + s_c0) +
      op +
      (nullR1 ? '' : 'R' + s_r1) +
      (nullC1 ? '' : 'C' + s_c1)
    );
  }
  // RC:RC
  if (s_r0 !== s_r1 || s_c0 !== s_c1) {
    return 'R' + s_r0 + 'C' + s_c0 + op + 'R' + s_r1 + 'C' + s_c1;
  }
  // RC
  return 'R' + s_r0 + 'C' + s_c0;
}
