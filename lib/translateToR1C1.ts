import { stringifyR1C1RefXlsx } from './stringifyR1C1Ref.ts';
import { tokenizeXlsx } from './tokenize.ts';
import { fromA1 } from './fromA1.ts';
import type { RangeR1C1, ReferenceA1Xlsx, Token } from './types.ts';
import { stringifyTokens } from './stringifyTokens.ts';
import { cloneToken } from './cloneToken.ts';
import { REF_BEAM, REF_RANGE, REF_TERNARY } from './constants.ts';
import { splitContext } from './parseRef.ts';

const calc = (abs: boolean, vX: number, aX: number): number => {
  if (vX == null) {
    return null;
  }
  return abs ? vX : vX - aX;
};

// We already know here that we're holding a token value from
// one of: REF_RANGE | REF_BEAM | REF_TERNARY
// So we can quickly scan for ! shortcut a bunch of parsing:
const unquote = d => d.slice(1, -1).replace(/''/g, "'");
function quickParseA1 (ref: string): ReferenceA1Xlsx {
  const split = ref.lastIndexOf('!');
  const data: Partial<ReferenceA1Xlsx> = {};
  if (split > -1) {
    if (ref.startsWith('\'')) {
      splitContext(unquote(ref.slice(0, split)), data, true);
    }
    else {
      splitContext(ref.slice(0, split), data, true);
    }
    data.range = fromA1(ref.slice(split + 1));
  }
  else {
    data.range = fromA1(ref);
  }
  return data as ReferenceA1Xlsx;
}

/**
 * Options for {@link translateFormulaToR1C1}.
 */
export type OptsTranslateToR1C1 = {
  /**
   * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`.
   * These are supported by Google Sheets but not Excel.
   * See: [References.md](./References.md).
   * @defaultValue true
   */
  allowTernary?: boolean,
};

/**
 * Translates ranges in a list of tokens from absolute A1 syntax to relative R1C1 syntax.
 *
 * ```js
 * translateFormulaToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param tokens A token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @returns A token list.
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
    const tokenType = token?.type;
    if (tokenType === REF_RANGE || tokenType === REF_BEAM || tokenType === REF_TERNARY) {
      token = cloneToken(token);
      const tokenValue = token.value;
      // We can get away with using the xlsx ref-parser here because it is more permissive
      // and we will end up with the same prefix after serialization anyway:
      const ref = quickParseA1(tokenValue);
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
 * Translates ranges in a formula from absolute A1 syntax to relative R1C1 syntax.
 *
 * ```js
 * translateFormulaToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param formula An Excel formula that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param [options={}] The options
 * @returns A formula string.
 */
export function translateFormulaToR1C1 (
  formula: string,
  anchorCell: string,
  options: OptsTranslateToR1C1 = {}
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
