import { lexRangeA1 } from './lexRangeA1.js';
import { lexRangeR1C1 } from './lexRangeR1C1.js';

export function lexRange (str, pos, options) {
  return options.r1c1
    ? lexRangeR1C1(str, pos, options)
    : lexRangeA1(str, pos, options);
}
