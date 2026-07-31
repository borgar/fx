import { stringifyR1C1RefXlsx } from './stringifyR1C1Ref.ts';
import { tokenizeXlsx } from './tokenize.ts';
import { parseA1Range } from './parseA1Range.ts';
import type { RangeR1C1, ReferenceA1Xlsx, Token } from './types.ts';
import { stringifyTokens } from './stringifyTokens.ts';
import { cloneToken } from './cloneToken.ts';
import { CONTEXT, FUNCTION, OPERATOR, REF_BEAM, REF_RANGE, REF_TERNARY } from './constants.ts';
import { splitContext, unquoteParts } from './parseRef.ts';
import { isRCTokenValue } from './isRCTokenValue.ts';
import { prefixNeedsQuotes, quotePrefix } from './stringifyPrefix.ts';

const reLetLambda = /^l(?:ambda|et)$/i;

const calc = (abs: boolean, vX: number, aX: number): number => {
  if (vX == null) {
    return null;
  }
  return abs ? vX : vX - aX;
};

// We already know here that we're holding a token value from
// one of: REF_RANGE | REF_BEAM | REF_TERNARY
// So we can quickly scan for ! shortcut a bunch of parsing:
function quickParseA1 (ref: string): ReferenceA1Xlsx {
  const split = ref.lastIndexOf('!');
  const data: Partial<ReferenceA1Xlsx> = {};
  if (split > -1) {
    splitContext(unquoteParts(ref.slice(0, split)), data, true);
    data.range = parseA1Range(ref.slice(split + 1));
  }
  else {
    data.range = parseA1Range(ref);
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
  const anchorRange = parseA1Range(anchorCell);
  if (!anchorRange) {
    throw new Error('translateTokensToR1C1 got an invalid anchorCell: ' + anchorCell);
  }
  const { top, left } = anchorRange;
  let withinCall = 0;
  let parenDepth = 0;

  let offsetSkew = 0;
  const outTokens: Token[] = [];
  for (let token of tokens) {
    const tokenType = token?.type;
    if (tokenType === OPERATOR) {
      if (token.value === '(') {
        parenDepth++;
        const lastToken = outTokens[outTokens.length - 1];
        if (lastToken && lastToken.type === FUNCTION) {
          if (reLetLambda.test(lastToken.value)) {
            withinCall = parenDepth;
          }
        }
      }
      else if (token.value === ')') {
        parenDepth--;
        if (parenDepth < withinCall) {
          withinCall = 0;
        }
      }
    }
    if (tokenType === REF_RANGE || tokenType === REF_BEAM || tokenType === REF_TERNARY) {
      token = cloneToken(token);
      const tokenValue = token.value;
      // We can get away with using the xlsx ref-parser here because it is more permissive:
      const ref = quickParseA1(tokenValue);
      if (ref) {
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
        let val = stringifyR1C1RefXlsx(ref);
        if (isRCTokenValue(val) && withinCall) {
          val += '[0]';
        }
        token.value = val;
      }
      // if token includes offsets, those offsets are now likely wrong!
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    }
    // A prefix travels through untouched, so a sheet range it contains arrives in a notation that
    // may not read it as one: "RC:Dec!A1" is a sheet range in A1, where "RC" is no cell, but
    // bare "RC:Dec!R[-2]C[-2]" reads back as cell RC joined to 'Dec'!R[-2]C[-2]. Quotes keep the
    // pair together. A wholly quoted prefix is already one; a prefix that quotes only its far end
    // is not, so the quoting is redistributed over the whole of it.
    else if (tokenType === CONTEXT && prefixNeedsQuotes(token.value, true)) {
      token = cloneToken(token);
      const tokenValue = token.value;
      token.value = quotePrefix(unquoteParts(tokenValue));
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
 * @see {@link OptsTranslateToR1C1}
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
