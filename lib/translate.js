import { MAX_ROWS, MAX_COLS, ERROR } from './constants.js';
import { fromA1, parseA1Ref, stringifyA1Ref } from './a1.js';
import { parseR1C1Ref, stringifyR1C1Ref } from './rc.js';
import { tokenize } from './lexer.js';
import { isRange } from './isType.js';

const calc = (abs, vX, aX) => {
  if (vX == null) {
    return null;
  }
  return abs ? vX : vX - aX;
};

const settings = {
  withLocation: false,
  mergeRefs: false,
  allowTernary: true,
  r1c1: false
};

/**
 * Translates ranges in a formula or list of tokens from absolute A1 syntax to
 * relative R1C1 syntax.
 *
 * Returns the same formula with the ranges translated. If an array of tokens
 * was supplied, then the same array is returned (be careful that `mergeRefs`
 * *must* be `false`).
 *
 * ```js
 * translateToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param {(string | Array<Object>)} formula A string (an Excel formula) or a token list that should be adjusted.
 * @param {string} anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @return {(string | Array<Object>)} A formula string or token list (depending on which was input)
 */
export function translateToR1C1 (fx, anchorCell) {
  const { top, left } = fromA1(anchorCell);
  const isString = typeof fx === 'string';

  const tokens = isString
    ? tokenize(fx, settings)
    : fx;

  let offsetSkew = 0;
  tokens.forEach(token => {
    if (isRange(token)) {
      const tokenValue = token.value;
      const ref = parseA1Ref(tokenValue, { allowTernary: true });
      const d = ref.range;
      const range = {};
      range.r0 = calc(d.$top, d.top, top);
      range.r1 = calc(d.$bottom, d.bottom, top);
      range.c0 = calc(d.$left, d.left, left);
      range.c1 = calc(d.$right, d.right, left);
      range.$r0 = d.$top;
      range.$r1 = d.$bottom;
      range.$c0 = d.$left;
      range.$c1 = d.$right;
      ref.range = range;
      token.value = stringifyR1C1Ref(ref);
      // if token includes offsets, those offsets are now likely wrong!
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    }
    else if (offsetSkew && token.loc) {
      token.loc[0] += offsetSkew;
      token.loc[1] += offsetSkew;
    }
  });

  return isString
    ? tokens.map(d => d.value).join('')
    : tokens;
}

function toFixed (val, abs, base, max, wrapEdges = true) {
  let v = val;
  if (v != null && !abs) {
    v = base + val;
    // Excel "wraps around" when value goes out of lower bounds.
    // It's a bit quirky on entry as Excel _really wants_ to re-rewite the
    // references but the behaviour is consistent with INDIRECT:
    // ... In A1: RC[-1] => R1C[16383].
    if (v < 0) {
      if (!wrapEdges) {
        return NaN;
      }
      v = max + v + 1;
    }
    // ... In B1: =RC[16383] => =RC[-1]
    if (v > max) {
      if (!wrapEdges) {
        return NaN;
      }
      v -= max + 1;
    }
  }
  return v;
}

const defaultOptions = {
  wrapEdges: true,
  mergeRefs: true
};

/**
 * Translates ranges in a formula or list of tokens from relative R1C1 syntax to
 * absolute A1 syntax.
 *
 * Returns the same formula with the ranges translated. If an array of tokens
 * was supplied, then the same array is returned (be careful that `mergeRefs`
 * *must* be `false`).
 *
 * ```js
 * translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
 * // => "=SUM(E10,$E$2,Sheet!$E$3)");
 * ```
 *
 * If an input range is -1,-1 relative rows/columns and the anchor is A1, the
 * resulting range will (by default) wrap around to the bottom of the sheet
 * resulting in the range XFD1048576. This may not be what you want so may set
 * `wrapEdges` to false which will instead turn the range into a `#REF!` error.
 *
 * ```js
 * translateToA1("=R[-1]C[-1]", "A1");
 * // => "=XFD1048576");
 *
 * translateToA1("=R[-1]C[-1]", "A1", { wrapEdges: false });
 * // => "=#REF!");
 * ```
 *
 * Note that if you are passing in a list of tokens that was not created using
 * `mergeRefs` and you disable edge wrapping (or you simply set both options
 * to false), you can end up with a formula such as `=#REF!:B2` or
 * `=Sheet3!#REF!:F3`. These are valid formulas in the Excel formula language
 * and Excel will accept them, but they are not supported in Google Sheets.
 *
 * @param {(string | Array<Object>)} formula A string (an Excel formula) or a token list that should be adjusted.
 * @param {string} anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param {Object} [options={}] The options
 * @param {boolean} [options.wrapEdges=true]  Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors
 * @param {boolean} [options.mergeRefs=true]   Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 * @return {(string | Array<Object>)} A formula string or token list (depending on which was input)
 */
export function translateToA1 (formula, anchorCell, options = defaultOptions) {
  const anchor = fromA1(anchorCell);
  const isString = typeof formula === 'string';
  const opts = { ...defaultOptions, ...options };

  const tokens = isString
    ? tokenize(formula, {
      withLocation: false,
      mergeRefs: opts.mergeRefs,
      allowTernary: true,
      r1c1: true
    })
    : formula;

  let offsetSkew = 0;
  tokens.forEach(token => {
    if (isRange(token)) {
      const tokenValue = token.value;
      const ref = parseR1C1Ref(tokenValue, { allowTernary: true });
      const d = ref.range;
      const range = {};
      const r0 = toFixed(d.r0, d.$r0, anchor.top, MAX_ROWS, opts.wrapEdges);
      const r1 = toFixed(d.r1, d.$r1, anchor.top, MAX_ROWS, opts.wrapEdges);
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
      const c0 = toFixed(d.c0, d.$c0, anchor.left, MAX_COLS, opts.wrapEdges);
      const c1 = toFixed(d.c1, d.$c1, anchor.left, MAX_COLS, opts.wrapEdges);
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
      if (isNaN(r0) || isNaN(r1) || isNaN(c0) || isNaN(c1)) {
        // convert to ref error
        token.type = ERROR;
        token.value = '#REF!';
        delete token.groupId;
      }
      else {
        ref.range = range;
        token.value = stringifyA1Ref(ref);
      }
      // if token includes offsets, those offsets are now likely wrong!
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    }
    else if (offsetSkew && token.loc) {
      token.loc[0] += offsetSkew;
      token.loc[1] += offsetSkew;
    }
  });

  return isString
    ? tokens.map(d => d.value).join('')
    : tokens;
}
