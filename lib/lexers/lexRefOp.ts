import { OPERATOR } from '../constants.js';
import type { Token } from '../extraTypes.ts';
import { advRangeOp } from './advRangeOp.js';

const EXCL = 33; // !

export function lexRefOp (str: string, pos: number, opts: { r1c1: boolean }): Token | undefined {
  // in R1C1 mode we only allow [ '!' ]
  if (str.charCodeAt(pos) === EXCL) {
    return { type: OPERATOR, value: str[pos] };
  }
  if (!opts.r1c1) {
    // in A1 mode we allow [ '!' ] + [ ':', '.:', ':.', '.:.']
    const opLen = advRangeOp(str, pos);
    if (opLen) {
      return { type: OPERATOR, value: str.slice(pos, pos + opLen) };
    }
  }
}
