import { isRange } from './isType.js';
import { parseA1Ref, stringifyA1Ref, addRangeBounds } from './a1.js';
import { parseSRef, stringifySRef } from './sr.js';
import { tokenize } from './lexer.js';
import { REF_STRUCT } from './constants.js';

// There is no R1C1 counerpart to this. This is because without an anchor cell
// it is impossible to determine if a relative+absolute range (R[1]C[1]:R5C5)
// needs to be flipped or not. The solution is to convert to A1 first:
// translateToRC(fixRanges(translateToA1(...)))

export function fixRanges (tokens, options = { addBounds: false }) {
  if (typeof tokens === 'string') {
    return fixRanges(tokenize(tokens, options), options)
      .map(d => d.value)
      .join('');
  }
  if (!Array.isArray(tokens)) {
    throw new Error('fixRanges expects an array of tokens');
  }
  const { addBounds, r1c1 } = options;
  if (r1c1) {
    throw new Error('fixRanges does not have an R1C1 mode');
  }
  let offsetSkew = 0;
  return tokens.map(t => {
    const token = { ...t };
    if (t.range) {
      token.range = [ ...t.range ];
    }
    let offsetDelta = 0;
    if (token.type === REF_STRUCT) {
      const newValue = stringifySRef(parseSRef(token.value));
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    }
    else if (isRange(token)) {
      const ref = parseA1Ref(token.value, { allowTernary: true });
      const range = ref.range;
      // fill missing dimensions?
      if (addBounds) {
        addRangeBounds(range);
      }
      const newValue = stringifyA1Ref(ref);
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    }
    // ensure that positioning is still correct
    if ((offsetSkew || offsetDelta) && token.range) {
      token.range[0] += offsetSkew;
      offsetSkew += offsetDelta;
      token.range[1] += offsetSkew;
    }
    else {
      offsetSkew += offsetDelta;
    }
    return token;
  });
}

