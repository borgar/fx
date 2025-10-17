/* eslint-disable no-mixed-operators */
import { REF_RANGE, REF_BEAM, REF_TERNARY, MAX_COLS, MAX_ROWS } from '../constants.js';
import { advRangeOp } from './advRangeOp.js';
import { canEndRange } from './canEndRange.js';

const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const UC_R = 82;
const LC_R = 114;
const UC_C = 67;
const LC_C = 99;
const PLUS = 43;
const MINUS = 45;

// C
// C\[[+-]?\d+\]
// C[1-9][0-9]{0,4}
// R
// R\[[+-]?\d+\]
// R[1-9][0-9]{0,6}
function lexR1C1Part (str, pos, isRow = false) {
  const start = pos;
  const c0 = str.charCodeAt(pos);
  if ((isRow ? c0 === UC_R || c0 === LC_R : c0 === UC_C || c0 === LC_C)) {
    pos++;
    let digits = 0;
    let value = 0;
    let stop = str.length;
    const c1 = str.charCodeAt(pos);
    let c;
    let sign = 1;
    const relative = c1 === BR_OPEN;
    if (relative) {
      stop = Math.min(stop, pos + (isRow ? 8 : 6));
      pos++;
      // allow +-
      c = str.charCodeAt(pos);
      if (c === PLUS || c === MINUS) {
        pos++;
        stop++;
        sign = c === MINUS ? -1 : 1;
      }
    }
    else if (c1 < 49 || c1 > 57 || isNaN(c1)) {
      // char must be 1-9, or part is either just "R" or "C"
      return 1;
    }

    do {
      const c = str.charCodeAt(pos);
      if (c >= 48 && c <= 57) { // 0-9
        value = value * 10 + c - 48;
        digits++;
        pos++;
      }
      else {
        break;
      }
    }
    while (pos < stop);

    const MAX = isRow ? MAX_ROWS : MAX_COLS;
    if (relative) {
      const c = str.charCodeAt(pos);
      if (c !== BR_CLOSE) {
        return 0;
      }
      // isRow: next char must not be a number!
      pos++;
      value *= sign;
      return (digits && (-MAX <= value) && (value <= MAX))
        ? pos - start
        : 0;
    }
    // isRow: next char must not be a number!
    return (digits && value <= (MAX + 1)) ? pos - start : 0;
  }
  return 0;
}

export function lexRangeR1C1 (str, pos, options) {
  let p = pos;
  // C1
  // C1:C1
  // C1:R1C1  --partial
  // R1
  // R1:R1
  // R1:R1C1  --partial
  // R1C1
  // R1C1:C1  --partial
  // R1C1:R1  --partial
  const r1 = lexR1C1Part(str, p, true);
  p += r1;
  const c1 = lexR1C1Part(str, p);
  p += c1;
  if (c1 || r1) {
    const op = advRangeOp(str, p);
    const preOp = p;
    if (op) {
      p += op;
      const r2 = lexR1C1Part(str, p, true); // R1
      p += r2;
      const c2 = lexR1C1Part(str, p); // C1
      p += c2;

      // C1:R2C2  --partial
      // R1:R2C2  --partial
      // R1C1:C2  --partial
      // R1C1:R2  --partial
      if (
        (r1 && !c1 && r2 && c2) ||
        (!r1 && c1 && r2 && c2) ||
        (r1 && c1 && r2 && !c2) ||
        (r1 && c1 && !r2 && c2)
      ) {
        if (options.allowTernary && canEndRange(str, p)) {
          return { type: REF_TERNARY, value: str.slice(pos, p) };
        }
      }
      // C1:C2 -- beam
      // R1:R2 -- beam
      else if (
        (c1 && c2 && !r1 && !r2) ||
        (!c1 && !c2 && r1 && r2)
      ) {
        if (canEndRange(str, p)) {
          return { type: REF_BEAM, value: str.slice(pos, p) };
        }
      }
      // Note: we do not capture R1C1:R1C1, mergeRefTokens will join the parts
    }
    // R1
    // C1
    // R1C1
    if (canEndRange(str, preOp)) {
      return {
        type: (r1 && c1) ? REF_RANGE : REF_BEAM,
        value: str.slice(pos, preOp)
      };
    }
  }
}
