import { MAX_ROWS, MAX_COLS, ERROR } from './constants.ts';
import { stringifyA1RefXlsx } from './stringifyA1Ref.ts';
import { parseR1C1RefXlsx } from './parseR1C1Ref.ts';
import { tokenizeXlsx } from './tokenize.ts';
import { isRange } from './isType.ts';
import { fromA1 } from './fromA1.ts';
import type { RangeA1, ReferenceR1C1Xlsx, Token } from './types.ts';
import { stringifyTokens } from './stringifyTokens.ts';
import { cloneToken } from './cloneToken.ts';

// Turn on the most permissive setting when parsing ranges so we don't have to think about
// this option. We already know that range tokens are legal, so we're not going to encounter
// ternary ranges who's validity we need to worry about.
const REF_OPTS = { allowTernary: true };

function toFixed (val: number, abs: boolean, base: number, max: number, wrapEdges = true) {
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

export type TranslateTokensToA1Options = {
  /**
  * Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors.
  * @defaultValue true
  */
  wrapEdges?: boolean,
};

/**
 * Translates ranges in a list of tokens from relative R1C1 syntax to absolute A1 syntax.
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
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param options Translation options.
 * @returns A formula string or token list (depending on which was input)
 */
export function translateTokensToA1 (
  tokens: Token[],
  anchorCell: string,
  options: TranslateTokensToA1Options = {}
): Token[] {
  const anchorRange = fromA1(anchorCell);
  if (!anchorRange) {
    throw new Error('translateToR1C1 got an invalid anchorCell: ' + anchorCell);
  }
  const { top, left } = anchorRange;
  const { wrapEdges = true } = options;

  let offsetSkew = 0;
  const outTokens = [];
  for (let token of tokens) {
    if (isRange(token)) {
      token = cloneToken(token);
      const tokenValue = token.value;
      // We can get away with using the xlsx ref-parser here because it is more permissive
      // and we will end up with the same prefix after serialization anyway:
      const ref = parseR1C1RefXlsx(tokenValue, REF_OPTS) as ReferenceR1C1Xlsx;
      const d = ref.range;
      const range: RangeA1 = { top: 0, left: 0 };
      const r0 = toFixed(d.r0, d.$r0, top, MAX_ROWS, wrapEdges);
      const r1 = toFixed(d.r1, d.$r1, top, MAX_ROWS, wrapEdges);
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
      const c0 = toFixed(d.c0, d.$c0, left, MAX_COLS, wrapEdges);
      const c1 = toFixed(d.c1, d.$c1, left, MAX_COLS, wrapEdges);
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
      if (d.trim) {
        range.trim = d.trim;
      }
      if (isNaN(r0) || isNaN(r1) || isNaN(c0) || isNaN(c1)) {
        // convert to ref error
        token.type = ERROR;
        token.value = '#REF!';
        delete token.groupId;
      }
      else {
        ref.range = range;
        // @ts-expect-error -- reusing the object, switching it to A1 by swapping the range
        token.value = stringifyA1RefXlsx(ref);
      }
      // if token includes offsets, those offsets are now likely wrong!
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    }
    else if (offsetSkew && token.loc) {
      token = cloneToken(token);
      token.loc[0] += offsetSkew;
      token.loc[1] += offsetSkew;
    }
    outTokens[outTokens.length] = token;
  }

  return outTokens;
}

export type TranslateFormulaToA1Options = {
  /**
  * Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors.
  * @defaultValue true
  */
  wrapEdges?: boolean,
  /**
  * Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens
  * for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
  * @defaultValue true
  */
  mergeRefs?: boolean,
  /**
  * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`.
  * These are supported by Google Sheets but not Excel. See: References.md.
  * @defaultValue true
  */
  allowTernary?: boolean,
};

/**
 * Translates ranges in a formula from relative R1C1 syntax to absolute A1 syntax.
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
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param options Translation options.
 * @returns A formula string or token list (depending on which was input)
 */
export function translateFormulaToA1 (
  formula: string,
  anchorCell: string,
  options: TranslateFormulaToA1Options = {}
): string {
  if (typeof formula === 'string') {
    return stringifyTokens(translateTokensToA1(tokenizeXlsx(formula, {
      allowTernary: options.allowTernary ?? true,
      mergeRefs: options.mergeRefs,
      r1c1: true
    }), anchorCell, options));
  }
  throw new Error('translateFormulaToA1 expects a formula string');
}
