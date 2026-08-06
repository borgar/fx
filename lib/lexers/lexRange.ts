import type { Token } from '../types.ts';
import { startsSheetPrefix } from './sheetPrefix.ts';
import { lexRangeA1 } from './lexRangeA1.ts';
import { lexRangeR1C1 } from './lexRangeR1C1.ts';

type LexRangeOptions = {
  allowTernary: boolean,
  mergeRefs: boolean,
  r1c1: boolean
};

export function lexRange (str: string, pos: number, options: LexRangeOptions): Token | undefined {
  // A sheet prefix belongs to the context lexers, whole. Detect that and lex nothing, because:
  // - "Jan:Dec" in "Jan:Dec!A1" is neither a column beam nor a range consisting of two references
  // - "a1" in "a1.b:Dec!A1" is not a cell
  if (startsSheetPrefix(str, pos, options.r1c1)) {
    return;
  }
  return options.r1c1
    ? lexRangeR1C1(str, pos, options)
    : lexRangeA1(str, pos, options);
}
