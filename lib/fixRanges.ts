import { isRange } from './isType.ts';
import { parseA1Ref } from './parseA1Ref.ts';
import { stringifyA1Ref } from './stringifyA1Ref.ts';
import { addA1RangeBounds } from './addA1RangeBounds.ts';
import { parseStructRef } from './parseStructRef.ts';
import { stringifyStructRef, stringifyStructRefXlsx } from './stringifyStructRef.ts';
import { tokenize } from './tokenize.ts';
import { REF_STRUCT } from './constants.ts';
import type { ReferenceA1, ReferenceA1Xlsx, Token } from './types.ts';
import { cloneToken } from './cloneToken.ts';
import { stringifyTokens } from './tokensToString.ts';

// There is no R1C1 counterpart to this. This is because without an anchor cell
// it is impossible to determine if a relative+absolute range (R[1]C[1]:R5C5)
// needs to be flipped or not. The solution is to convert to A1 first:
// translateToRC(fixRanges(translateToA1(...)))

export type FixRangesOptions = {
  /**
   * Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383.
   * @defaultValue false
   */
  addBounds?: boolean,
  /**
   * Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks.
   * See: [Prefixes.md](./Prefixes.md)
   * @defaultValue false
   */
  xlsx?: boolean,
  /**
   * Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges.
   * @defaultValue false
   */
  thisRow?: boolean,
};

/**
 * Normalizes A1 style ranges and structured references in a list of tokens.
 *
 * It ensures that that the top and left coordinates of an A1 range are on the
 * left-hand side of a colon operator:
 *
 * ```
 * B2:A1 → A1:B2
 * 1:A1 → A1:1
 * A:A1 → A1:A
 * B:A → A:B
 * 2:1 → 1:2
 * A1:A1 → A1
 * ```
 *
 * When `{ addBounds: true }` is passed as an option, the missing bounds are
 * also added. This can be done to ensure Excel compatible ranges. The fixes
 * then additionally include:
 *
 * ```
 * 1:A1 → A1:1 → 1:1
 * A:A1 → A1:A → A:A
 * A1:A → A:A
 * A1:1 → A:1
 * B2:B → B2:1048576
 * B2:2 → B2:XFD2
 * ```
 *
 * Structured ranges are normalized to have consistent order and capitalization
 * of sections as well as removing redundant ones.
 *
 * Returns a new array of tokens with values and position data updated.
 *
 * @param tokens A list of tokens to be adjusted.
 * @param [options]  Options
 * @returns A token list with ranges adjusted
 */
export function fixTokenRanges (
  tokens: Token[],
  options: FixRangesOptions = {}
): Token[] {
  if (!Array.isArray(tokens)) {
    throw new Error('fixRanges expects an array of tokens');
  }
  const { addBounds, xlsx, thisRow } = options;
  let offsetSkew = 0;
  const output: Token[] = [];
  for (const t of tokens) {
    const token = cloneToken(t);
    let offsetDelta = 0;
    if (token.type === REF_STRUCT) {
      const sref = parseStructRef(token.value, { xlsx });
      const newValue = xlsx
        ? stringifyStructRefXlsx(sref, { thisRow })
        : stringifyStructRef(sref, { thisRow });
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    }
    else if (isRange(token)) {
      const ref = parseA1Ref(token.value, { xlsx, allowTernary: true }) as ReferenceA1 | ReferenceA1Xlsx;
      const range = ref.range;
      // fill missing dimensions?
      if (addBounds) {
        addA1RangeBounds(range);
      }
      const newValue = stringifyA1Ref(ref, { xlsx });
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    }
    // ensure that positioning is still correct
    if (offsetSkew || offsetDelta) {
      if (token.loc) {
        token.loc[0] += offsetSkew;
      }
      offsetSkew += offsetDelta;
      if (token.loc) {
        token.loc[1] += offsetSkew;
      }
    }
    else {
      offsetSkew += offsetDelta;
    }
    output.push(token);
  }

  return output;
}

/**
 * Normalizes A1 style ranges and structured references in a formula.
 *
 * Internally it uses {@link fixTokenRanges} so see it's documentation for details.
 *
 * Returns the same formula with the ranges updated. If an array of tokens was
 * supplied, then a new array is returned.
 *
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param [options]  Options
 * @returns A formula string with ranges adjusted
 */
export function fixFormulaRanges (
  formula: string,
  options: FixRangesOptions = {}
): string {
  if (typeof formula !== 'string') {
    throw new Error('fixFormulaRanges expects a string formula');
  }
  return stringifyTokens(
    fixTokenRanges(
      tokenize(formula, options),
      options
    )
  );
}
