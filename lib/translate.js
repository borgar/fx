import { MAX_ROWS, MAX_COLS } from './constants.js';
import { fromA1, toA1 } from './a1.js';
import { fromRC, toRC } from './rc.js';
import { tokenize } from './lexer.js';
import { isRange } from './isType.js';

const calc = (abs, vX, aX) => {
  if (vX == null) {
    return null;
  }
  return abs ? vX : vX - aX;
};

export function translateToRC (fx, anchorCell) {
  const { top, left } = fromA1(anchorCell);
  const isString = typeof fx === 'string';

  const tokens = isString
    ? tokenize(fx, { emitRanges: false, mergeRanges: false, allowTernary: true, r1c2: false })
    : fx;

  tokens.forEach(token => {
    if (isRange(token)) {
      const range = {};
      const d = fromA1(token.value);
      range.r0 = calc(d.$top, d.top, top);
      range.$r0 = d.$top;
      range.r1 = calc(d.$bottom, d.bottom, top);
      range.$r1 = d.$bottom;
      range.c0 = calc(d.$left, d.left, left);
      range.$c0 = d.$left;
      range.c1 = calc(d.$right, d.right, left);
      range.$c1 = d.$right;
      token.value = toRC(range);
    }
  });

  return isString
    ? tokens.map(d => d.value).join('')
    : tokens;
}

function toFixed (val, abs, base, max) {
  let v = val;
  if (v != null && !abs) {
    v = base + val;
    // Excel "wraps around" when value goes out of lower bounds.
    // It's a bit quirky on entry as Excel _really wants_ to re-rewite the
    // references but the behaviour is consistent with INDIRECT:
    // ... In A1: RC[-1] => R1C[16383].
    if (v < 0) {
      v = max + v + 1;
    }
    // ... In B1: =RC[16383] => =RC[-1]
    if (v > max) {
      v -= max + 1;
    }
  }
  return v;
}

export function translateToA1 (fx, anchorCell) {
  const anchor = fromA1(anchorCell);
  const isString = typeof fx === 'string';

  const tokens = isString
    ? tokenize(fx, { emitRanges: false, mergeRanges: false, allowTernary: true, r1c1: true })
    : fx;

  tokens.forEach(token => {
    if (isRange(token)) {
      const range = {};
      const d = fromRC(token.value);
      const r0 = toFixed(d.r0, d.$r0, anchor.top, MAX_ROWS);
      const r1 = toFixed(d.r1, d.$r1, anchor.top, MAX_ROWS);
      if (r0 > r1) {
        range.top = r1;
        range.$top = d.$r1;
        range.bottom = r0;
        range.$bottom = d.$r0;
      }
      else {
        range.top = r0;
        range.$top = d.$r0;
        range.bottom = r1;
        range.$bottom = d.$r1;
      }
      const c0 = toFixed(d.c0, d.$c0, anchor.left, MAX_COLS);
      const c1 = toFixed(d.c1, d.$c1, anchor.left, MAX_COLS);
      if (c0 > c1) {
        range.left = c1;
        range.$left = d.$c1;
        range.right = c0;
        range.$right = d.$c0;
      }
      else {
        range.left = c0;
        range.$left = d.$c0;
        range.right = c1;
        range.$right = d.$c1;
      }
      token.value = toA1(range);
    }
  });

  return isString
    ? tokens.map(d => d.value).join('')
    : tokens;
}
