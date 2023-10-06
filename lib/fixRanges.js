import { isRange } from './isType.js';
import { parseA1Ref, stringifyA1Ref, addA1RangeBounds } from './a1.js';
import { parseStructRef, stringifyStructRef } from './sr.js';
import { tokenize } from './lexer.js';
import { REF_STRUCT } from './constants.js';

// There is no R1C1 counterpart to this. This is because without an anchor cell
// it is impossible to determine if a relative+absolute range (R[1]C[1]:R5C5)
// needs to be flipped or not. The solution is to convert to A1 first:
// translateToRC(fixRanges(translateToA1(...)))

/**
 * Normalizes A1 style ranges and structured references in a formula or list of
 * tokens.
 * 
 * It ensures that that the top and left coordinates of an A1 range are on the
 * left-hand side of a colon operator:
 *
 * `B2:A1` → `A1:B2`  
 * `1:A1` → `A1:1`  
 * `A:A1` → `A1:A`  
 * `B:A` → `A:B`  
 * `2:1` → `1:2`  
 * `A1:A1` → `A1`  
 *
 * When `{ addBounds: true }` is passed as an option, the missing bounds are
 * also added. This can be done to ensure Excel compatible ranges. The fixes
 * then additionally include:
 *
 * `1:A1` → `A1:1` → `1:1`  
 * `A:A1` → `A1:A` → `A:A`  
 * `A1:A` → `A:A`  
 * `A1:1` → `A:1`  
 * `B2:B` → `B2:1048576`  
 * `B2:2` → `B2:XFD2`  
 *
 * Structured ranges are normalized cleaned up to have consistent order and
 * capitalization of sections as well as removing redundant ones.
 *
 * Returns the same formula with the ranges updated. If an array of tokens was
 * supplied, then a new array is returned.
 *
 * @param {(string | Array<Token>)} formula A string (an Excel formula) or a token list that should be adjusted.
 * @param {object} [options={}]  Options
 * @param {boolean} [options.addBounds=false]  Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383.
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(string | Array<Token>)} A formula string or token list (depending on which was input)
 */
export function fixRanges (formula, options = { addBounds: false }) {
  if (typeof formula === 'string') {
    return fixRanges(tokenize(formula, options), options)
      .map(d => d.value)
      .join('');
  }
  if (!Array.isArray(formula)) {
    throw new Error('fixRanges expects an array of tokens');
  }
  const { addBounds, r1c1, xlsx } = options;
  if (r1c1) {
    throw new Error('fixRanges does not have an R1C1 mode');
  }
  let offsetSkew = 0;
  return formula.map(t => {
    const token = { ...t };
    if (t.loc) {
      token.loc = [ ...t.loc ];
    }
    let offsetDelta = 0;
    if (token.type === REF_STRUCT) {
      const sref = parseStructRef(token.value, { xlsx });
      const newValue = stringifyStructRef(sref, { xlsx });
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    }
    else if (isRange(token)) {
      const ref = parseA1Ref(token.value, { xlsx, allowTernary: true });
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
    return token;
  });
}

