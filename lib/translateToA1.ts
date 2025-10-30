import { MAX_ROWS, MAX_COLS, ERROR } from './constants.ts';
import { stringifyA1Ref, stringifyA1RefXlsx } from './stringifyA1Ref.ts';
import { parseR1C1Ref, parseR1C1RefXlsx } from './parseR1C1Ref.ts';
import { tokenize, tokenizeXlsx } from './tokenize.ts';
import { isRange } from './isType.ts';
import { fromA1 } from './fromA1.ts';
import type { RangeA1, ReferenceR1C1, ReferenceR1C1Xlsx, Token } from './types.ts';
import { stringifyTokens } from './stringifyTokens.ts';
import { cloneToken } from './cloneToken.ts';

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

export type TranslateToA1Options = {
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
  * Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks.
  * See: [Prefixes.md](./Prefixes.md)
  * @defaultValue false
  */
  xlsx?: boolean,
  /**
  * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`.
  * These are supported by Google Sheets but not Excel. See: References.md.
  * @defaultValue true
  */
  allowTernary?: boolean,
};

/**
 * Translates ranges in a formula or list of tokens from relative R1C1 syntax to
 * absolute A1 syntax.
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
 * @param {boolean} [options.wrapEdges]  Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors
 * @param {boolean} [options.mergeRefs]  Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 * @param {boolean} [options.xlsx]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param {boolean} [options.allowTernary]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @returns A formula string or token list (depending on which was input)
 */
export function translateToA1 (
  formula: string | Token[],
  anchorCell: string,
  options: TranslateToA1Options = {}
): string | Token[] {
  const anchorRange = fromA1(anchorCell);
  if (!anchorRange) {
    throw new Error('translateToR1C1 got an invalid anchorCell: ' + anchorCell);
  }
  const { top, left } = anchorRange;
  const isString = typeof formula === 'string';
  const {
    wrapEdges = true,
    mergeRefs = true,
    allowTernary = true,
    xlsx = false
  } = options;

  const tokens = isString
    ? xlsx
      ? tokenizeXlsx(formula, {
        withLocation: false,
        mergeRefs: mergeRefs,
        allowTernary: allowTernary,
        r1c1: true
      })
      : tokenize(formula, {
        withLocation: false,
        mergeRefs: mergeRefs,
        allowTernary: allowTernary,
        r1c1: true
      })
    : formula;

  let offsetSkew = 0;
  const refOpts = { allowTernary: allowTernary };
  const outTokens = [];
  for (let token of tokens) {
    if (isRange(token)) {
      token = cloneToken(token);
      const tokenValue = token.value;
      const ref = xlsx
        ? parseR1C1RefXlsx(tokenValue, refOpts) as ReferenceR1C1Xlsx
        : parseR1C1Ref(tokenValue, refOpts) as ReferenceR1C1;
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
        token.value = xlsx ? stringifyA1RefXlsx(ref) : stringifyA1Ref(ref);
      }
      // if token includes offsets, those offsets are now likely wrong!
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    }
    else if (offsetSkew && token.loc && !isString) {
      token = cloneToken(token);
      token.loc[0] += offsetSkew;
      token.loc[1] += offsetSkew;
    }
    outTokens[outTokens.length] = token;
  }

  return isString
    ? stringifyTokens(outTokens)
    : outTokens;
}
