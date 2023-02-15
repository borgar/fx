import { isRange } from './isType.js';
import { parseA1Ref, stringifyA1Ref, addRangeBounds } from './a1.js';
import { tokenize } from './lexer.js';

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
  return tokens.map(token => {
    if (isRange(token)) {
      const ref = parseA1Ref(token.value, options);
      const range = ref.range;
      // fill missing dimensions?
      if (addBounds) {
        addRangeBounds(range);
      }
      const ret = { ...token };
      ret.value = stringifyA1Ref(ref);
      if (ret.range) {
        ret.range = range;
      }
      return ret;
    }
    return token;
  });
}

