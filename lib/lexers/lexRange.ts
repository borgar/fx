import type { Token } from '../types.ts';
import { startsSheetRange } from './advSheetName.ts';
import { lexRangeA1 } from './lexRangeA1.ts';
import { lexRangeR1C1 } from './lexRangeR1C1.ts';

type LexRangeOptions = {
  allowTernary: boolean,
  mergeRefs: boolean,
  r1c1: boolean
};

export function lexRange (str: string, pos: number, options: LexRangeOptions): Token | undefined {
  // A sheet range belongs to the context lexers, whole. Standing aside here is what stops a range
  // lexer claiming a piece of one: "Jan:Dec" in "Jan:Dec!A1" is neither a column beam nor two
  // references joined by the range operator, and "a1" is not a cell in "a1.b:Dec!A1".
  if (startsSheetRange(str, pos, options.r1c1)) {
    return;
  }
  return options.r1c1
    ? lexRangeR1C1(str, pos, options)
    : lexRangeA1(str, pos, options);
}
