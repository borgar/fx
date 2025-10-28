import type { Token } from '../extraTypes.ts';
import { lexRangeA1 } from './lexRangeA1.js';
import { lexRangeR1C1 } from './lexRangeR1C1.js';

type LexRangeOptions = {
  allowTernary: boolean,
  mergeRefs: boolean,
  r1c1: boolean
};

export function lexRange (str: string, pos: number, options: LexRangeOptions): Token | undefined {
  return options.r1c1
    ? lexRangeR1C1(str, pos, options)
    : lexRangeA1(str, pos, options);
}
