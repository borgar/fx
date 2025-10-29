import { MAX_COLS, MAX_ROWS } from './constants.ts';
import type { RangeA1 } from './types.ts';

export function fromRow (rowStr: string): number {
  return +rowStr - 1;
}

const CHAR_DOLLAR = 36;
const CHAR_PERIOD = 46;
const CHAR_COLON = 58;
const CHAR_A_LC = 97;
const CHAR_A_UC = 65;
const CHAR_Z_LC = 122;
const CHAR_Z_UC = 90;
const CHAR_0 = 48;
const CHAR_1 = 49;
const CHAR_9 = 57;

function advRangeOp (str: string, pos: number): [ number, string ] {
  const c0 = str.charCodeAt(pos);
  if (c0 === CHAR_PERIOD) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === CHAR_COLON) {
      return str.charCodeAt(pos + 2) === CHAR_PERIOD
        ? [ 3, 'both' ]
        : [ 2, 'head' ];
    }
  }
  else if (c0 === CHAR_COLON) {
    const c1 = str.charCodeAt(pos + 1);
    return c1 === CHAR_PERIOD
      ? [ 2, 'tail' ]
      : [ 1, '' ];
  }
  return [ 0, '' ];
}

function advA1Col (str: string, pos: number): [ number, number, boolean ] {
  // [A-Z]{1,3}
  const start = pos;
  const lock = str.charCodeAt(pos) === CHAR_DOLLAR;
  if (lock) { pos++; }
  const stop = pos + 3;
  let col = 0;
  do {
    const c = str.charCodeAt(pos);
    if (c >= CHAR_A_UC && c <= CHAR_Z_UC) {
      col = (26 * col) + c - (CHAR_A_UC - 1);
      pos++;
    }
    else if (c >= CHAR_A_LC && c <= CHAR_Z_LC) {
      col = (26 * col) + c - (CHAR_A_LC - 1);
      pos++;
    }
    else {
      break;
    }
  }
  while (pos < stop && pos < str.length);
  return (col && col <= MAX_COLS + 1)
    ? [ pos - start, col - 1, lock ]
    : [ 0, 0, false ];
}

function advA1Row (str: string, pos: number): [number, number, boolean] {
  // [1-9][0-9]{0,6}
  const start = pos;
  const lock = str.charCodeAt(pos) === CHAR_DOLLAR;
  if (lock) { pos++; }
  const stop = pos + 7;
  let row = 0;
  let c = str.charCodeAt(pos);
  if (c >= CHAR_1 && c <= CHAR_9) {
    row = (row * 10) + c - CHAR_0;
    pos++;
    do {
      c = str.charCodeAt(pos);
      if (c >= CHAR_0 && c <= CHAR_9) {
        row = (row * 10) + c - CHAR_0;
        pos++;
      }
      else {
        break;
      }
    }
    while (pos < stop && pos < str.length);
  }
  return (row && row <= MAX_ROWS + 1)
    ? [ pos - start, row - 1, lock ]
    : [ 0, 0, false ];
}

function makeRange (
  top: number | null,
  $top: boolean | null,
  left: number | null,
  $left: boolean | null,
  bottom: number | null,
  $bottom: boolean | null,
  right: number | null,
  $right: boolean | null,
  trim
): RangeA1 {
  // flip left/right and top/bottom as needed
  // for partial ranges we perfer the coord on the left-side of the:
  if (right != null && (left == null || (left != null && right < left))) {
    [ left, right, $left, $right ] = [ right, left, $right, $left ];
  }
  if (bottom != null && (top == null || (top != null && bottom < top))) {
    [ top, bottom, $top, $bottom ] = [ bottom, top, $bottom, $top ];
  }
  const range: RangeA1 = { top, left, bottom, right, $top, $left, $bottom, $right };
  if (trim) {
    range.trim = trim;
  }
  return range;
}

export function fromA1 (str, allowTernary = true): RangeA1 | null {
  let p = 0;
  const [ leftChars, left, $left ] = advA1Col(str, p);
  let right = 0;
  let $right = false;
  let bottom = 0;
  let $bottom = false;
  let rightChars: number;
  let bottomChars: number;
  if (leftChars) {
    // TLBR: could be A1:A1
    // TL R: could be A1:A (if allowTernary)
    // TLB : could be A1:1 (if allowTernary)
    //  LBR: could be A:A1 (if allowTernary)
    //  L R: could be A:A
    p += leftChars;
    const [ topChars, top, $top ] = advA1Row(str, p);
    p += topChars;
    const [ op, trim ] = advRangeOp(str, p);
    if (op) {
      p += op;
      [ rightChars, right, $right ] = advA1Col(str, p);
      p += rightChars;
      [ bottomChars, bottom, $bottom ] = advA1Row(str, p);
      p += bottomChars;
      if (topChars && bottomChars && rightChars) {
        if (p === str.length) {
          return makeRange(top, $top, left, $left, bottom, $bottom, right, $right, trim);
        }
      }
      else if (!topChars && !bottomChars) {
        if (p === str.length) {
          return makeRange(null, false, left, $left, null, false, right, $right, trim);
        }
      }
      else if (allowTernary && (bottomChars || rightChars) && p === str.length) {
        if (!topChars) {
          return makeRange(null, false, left, $left, bottom, $bottom, right, $right, trim);
        }
        else if (!bottomChars) {
          return makeRange(top, $top, left, $left, null, false, right, $right, trim);
        }
        else {
          return makeRange(top, $top, left, $left, bottom, $bottom, null, false, trim);
        }
      }
    }
    // LT  : this is A1
    if (topChars && p === str.length) {
      return makeRange(top, $top, left, $left, top, $top, left, $left, trim);
    }
  }
  else {
    // T B : could be 1:1
    // T BR: could be 1:A1 (if allowTernary)
    const [ topChars, top, $top ] = advA1Row(str, p);
    if (topChars) {
      p += topChars;
      const [ op, trim ] = advRangeOp(str, p);
      if (op) {
        p += op;
        [ rightChars, right, $right ] = advA1Col(str, p);
        p += rightChars;
        [ bottomChars, bottom, $bottom ] = advA1Row(str, p);
        p += bottomChars;
        if (rightChars && bottomChars && allowTernary) {
          if (p === str.length) {
            return makeRange(top, $top, null, false, bottom, $bottom, right, $right, trim);
          }
        }
        else if (!rightChars && bottomChars) {
          if (p === str.length) {
            return makeRange(top, $top, null, false, bottom, $bottom, null, false, trim);
          }
        }
      }
    }
  }
  return null;
}
