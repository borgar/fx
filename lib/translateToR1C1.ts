import { parseA1RefXlsx } from './parseA1Ref.ts';
import { stringifyR1C1RefXlsx } from './stringifyR1C1Ref.ts';
import { tokenizeXlsx } from './tokenize.ts';
import { isRange } from './isType.ts';
import { fromA1 } from './fromA1.ts';
import type { RangeR1C1, ReferenceA1Xlsx, Token } from './types.ts';
import { stringifyTokens } from './stringifyTokens.ts';
import { cloneToken } from './cloneToken.ts';

// Turn on the most permissive setting when parsing ranges so we don't have to think about
// this option. We already know that range tokens are legal, so we're not going to encounter
// ternary ranges who's validity we need to worry about.
const REF_OPTS = { allowTernary: true };

const calc = (abs: boolean, vX: number, aX: number): number => {
  if (vX == null) {
    return null;
  }
  return abs ? vX : vX - aX;
};

export type TranslateToR1C1Options = {
  /**
  * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`.
  * These are supported by Google Sheets but not Excel. See: References.md.
  * @defaultValue true
  */
  allowTernary?: boolean,
};

/**
 * Translates ranges in a formula or list of tokens from absolute A1 syntax to
 * relative R1C1 syntax.
 *
 * ```js
 * translateFormulaToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @returns A formula string or token list (depending on which was input)
 */
export function translateTokensToR1C1 (
  tokens: Token[],
  anchorCell: string
): Token[] {
  const anchorRange = fromA1(anchorCell);
  if (!anchorRange) {
    throw new Error('translateTokensToR1C1 got an invalid anchorCell: ' + anchorCell);
  }
  const { top, left } = anchorRange;

  let offsetSkew = 0;
  const outTokens = [];
  for (let token of tokens) {
    if (isRange(token)) {
      token = cloneToken(token);
      const tokenValue = token.value;
      // We can get away with using the xlsx ref-parser here because it is more permissive
      // and we will end up with the same prefix after serialization anyway:
      const ref = parseA1RefXlsx(tokenValue, REF_OPTS) as ReferenceA1Xlsx;
      const d = ref.range;
      const range: RangeR1C1 = {};
      range.r0 = calc(d.$top, d.top, top);
      range.r1 = calc(d.$bottom, d.bottom, top);
      range.c0 = calc(d.$left, d.left, left);
      range.c1 = calc(d.$right, d.right, left);
      range.$r0 = d.$top;
      range.$r1 = d.$bottom;
      range.$c0 = d.$left;
      range.$c1 = d.$right;
      if (d.trim) {
        range.trim = d.trim;
      }
      // @ts-expect-error -- reusing the object, switching it to R1C1 by swapping the range
      ref.range = range;
      token.value = stringifyR1C1RefXlsx(ref);
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

/**
 * Translates ranges in a formula or list of tokens from absolute A1 syntax to
 * relative R1C1 syntax.
 *
 * ```js
 * translateFormulaToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param [options={}] The options
 * @returns A formula string or token list (depending on which was input)
 */
export function translateFormulaToR1C1 (
  formula: string,
  anchorCell: string,
  options: TranslateToR1C1Options = {}
): string {
  if (typeof formula === 'string') {
    const tokens = tokenizeXlsx(formula, {
      mergeRefs: false,
      allowTernary: options.allowTernary ?? true
    });
    return stringifyTokens(translateTokensToR1C1(tokens, anchorCell));
  }
  throw new Error('translateFormulaToA1 expects a formula string');
}
