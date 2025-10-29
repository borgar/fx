import { REF_RANGE, REF_BEAM, REF_TERNARY, MAX_COLS, MAX_ROWS } from '../constants.js';
import type { Token } from '../types.ts';
import { advRangeOp } from './advRangeOp.js';
import { canEndRange, canEndPartialRange } from './canEndRange.js';

function advA1Col (str: string, pos: number): number {
  // [A-Z]{1,3}
  const start = pos;
  if (str.charCodeAt(pos) === 36) { // $
    pos++;
  }
  const stop = pos + 3;
  let col = 0;
  do {
    const c = str.charCodeAt(pos);
    if (c >= 65 && c <= 90) { // A-Z
      col = 26 * col + c - 64;
      pos++;
    }
    else if (c >= 97 && c <= 122) { // a-z
      col = 26 * col + c - 96;
      pos++;
    }
    else {
      break;
    }
  }
  while (pos < stop && pos < str.length);
  return (col && col <= MAX_COLS + 1) ? pos - start : 0;
}

function advA1Row (str: string, pos: number): number {
  // [1-9][0-9]{0,6}
  const start = pos;
  if (str.charCodeAt(pos) === 36) { // $
    pos++;
  }
  const stop = pos + 7;
  let row = 0;
  let c = str.charCodeAt(pos);
  if (c >= 49 && c <= 57) { // 1-9
    row = row * 10 + c - 48;
    pos++;
    do {
      c = str.charCodeAt(pos);
      if (c >= 48 && c <= 57) { // 0-9
        row = row * 10 + c - 48;
        pos++;
      }
      else {
        break;
      }
    }
    while (pos < stop && pos < str.length);
  }
  return (row && row <= MAX_ROWS + 1) ? pos - start : 0;
}

export function lexRangeA1 (
  str: string,
  pos: number,
  options: { mergeRefs: boolean, allowTernary: boolean }
): Token | undefined {
  let p = pos;
  const left = advA1Col(str, p);
  let right = 0;
  let bottom = 0;
  if (left) {
    // TLBR: could be A1:A1
    // TL R: could be A1:A (if allowTernary)
    // TLB : could be A1:1 (if allowTernary)
    //  LBR: could be A:A1 (if allowTernary)
    //  L R: could be A:A
    p += left;
    const top = advA1Row(str, p);
    p += top;
    const op = advRangeOp(str, p);
    const preOp = p;
    if (op) {
      p += op;
      right = advA1Col(str, p);
      p += right;
      bottom = advA1Row(str, p);
      p += bottom;
      if (top && bottom && right) {
        if (canEndRange(str, p) && options.mergeRefs) {
          return { type: REF_RANGE, value: str.slice(pos, p) };
        }
      }
      else if (!top && !bottom) {
        if (canEndRange(str, p)) {
          return { type: REF_BEAM, value: str.slice(pos, p) };
        }
      }
      else if (options.allowTernary && (bottom || right)) {
        if (canEndPartialRange(str, p)) {
          return { type: REF_TERNARY, value: str.slice(pos, p) };
        }
      }
    }
    // LT  : this is A1
    if (top && canEndRange(str, preOp)) {
      return { type: REF_RANGE, value: str.slice(pos, preOp) };
    }
  }
  else {
    // T B : could be 1:1
    // T BR: could be 1:A1 (if allowTernary)
    const top = advA1Row(str, p);
    if (top) {
      p += top;
      const op = advRangeOp(str, p);
      if (op) {
        p += op;
        right = advA1Col(str, p);
        if (right) {
          p += right;
        }
        bottom = advA1Row(str, p);
        p += bottom;
        if (right && bottom && options.allowTernary) {
          if (canEndPartialRange(str, p)) {
            return { type: REF_TERNARY, value: str.slice(pos, p) };
          }
        }
        if (!right && bottom) {
          if (canEndRange(str, p)) {
            return { type: REF_BEAM, value: str.slice(pos, p) };
          }
        }
      }
    }
  }
}
