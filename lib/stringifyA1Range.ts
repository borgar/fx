import { MAX_ROWS, MAX_COLS } from './constants.ts';
import { toCol } from './toCol.ts';
import type { RangeA1 } from './types.ts';
import { rangeOperator } from './a1.ts';

const clamp = (min: number, val: number, max: number) => Math.min(Math.max(val, min), max);
const toColStr = (c: number, a: boolean) => (a ? '$' : '') + toCol(c);
const toRowStr = (r: number, a: boolean) => (a ? '$' : '') + toRow(r);
const toRow = (top: number): string => String(top + 1);

/**
 * Stringify a range object into A1 syntax.
 * @param range A range object
 * @returns An A1-style string represenation of a range
 * @internal
 */
export function stringifyA1Range (range: Partial<RangeA1>): string {
  // eslint-disable-next-line prefer-const
  let { top, left, bottom, right, trim } = range;
  const { $left, $right, $top, $bottom } = range;
  const noLeft = left == null;
  const noRight = right == null;
  const noTop = top == null;
  const noBottom = bottom == null;
  // allow skipping right and bottom to define a cell
  top = clamp(0, top | 0, MAX_ROWS);
  left = clamp(0, left | 0, MAX_COLS);
  if (!noLeft && !noTop && noRight && noBottom) {
    bottom = top;
    right = left;
  }
  else {
    bottom = clamp(0, bottom | 0, MAX_ROWS);
    right = clamp(0, right | 0, MAX_COLS);
  }
  const op = rangeOperator(trim);
  // A:A
  const allRows = top === 0 && bottom >= MAX_ROWS;
  const haveAbsCol = ($left && !noLeft) || ($right && !noRight);
  if ((allRows && !noLeft && !noRight && (!haveAbsCol || left === right)) || (noTop && noBottom)) {
    return toColStr(left, $left) + op + toColStr(right, $right);
  }
  // 1:1
  const allCols = left === 0 && right >= MAX_COLS;
  const haveAbsRow = ($top && !noTop) || ($bottom && !noBottom);
  if ((allCols && !noTop && !noBottom && (!haveAbsRow || top === bottom)) || (noLeft && noRight)) {
    return toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  // A1:1
  if (!noLeft && !noTop && !noRight && noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toColStr(right, $right);
  }
  // A:A1 => A1:1
  if (!noLeft && noTop && !noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(bottom, $bottom) + op + toColStr(right, $right);
  }
  // A1:A
  if (!noLeft && !noTop && noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  // A:A1 => A1:A
  if (noLeft && !noTop && !noRight && !noBottom) {
    return toColStr(right, $right) + toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  // A1:A1
  if (right !== left || bottom !== top || $right !== $left || $bottom !== $top) {
    return toColStr(left, $left) + toRowStr(top, $top) + op +
           toColStr(right, $right) + toRowStr(bottom, $bottom);
  }
  // A1
  return toColStr(left, $left) + toRowStr(top, $top);
}
