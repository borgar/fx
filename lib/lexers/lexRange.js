import { lexRangeA1 } from './lexRangeA1.js';
import { lexRangeR1C1 } from './lexRangeR1C1.js';

export function lexRange (str, pos, options) {
  if (options.r1c1) {
    return lexRangeR1C1(str, pos, options);
  }
  else {
    return lexRangeA1(str, pos, options);
  }
}
