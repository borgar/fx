import { OPERATOR } from '../constants.ts';
import type { Token } from '../types.ts';
import { advRangeOp } from './advRangeOp.ts';
import { startsSheetPrefix } from './sheetPrefix.ts';

const EXCL = 33; // !
const PERIOD = 46; // .

export function lexRefOp (str: string, pos: number, opts: { r1c1: boolean }): Token | undefined {
  // in R1C1 mode we only allow [ '!' ]
  if (str.charCodeAt(pos) === EXCL) {
    return { type: OPERATOR, value: str[pos] };
  }
  if (!opts.r1c1) {
    // in A1 mode we allow [ '!' ] + [ ':', '.:', ':.', '.:.']
    const opLen = advRangeOp(str, pos);
    if (opLen) {
      // see lexRangeTrim: a sheet may be named ".", and a sheet range starting with one takes the
      // "." that would otherwise open a trim range operator
      if (str.charCodeAt(pos) === PERIOD && startsSheetPrefix(str, pos, false)) {
        return;
      }
      return { type: OPERATOR, value: str.slice(pos, pos + opLen) };
    }
  }
}
