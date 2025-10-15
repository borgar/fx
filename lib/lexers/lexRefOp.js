/* eslint-disable no-mixed-operators */
import { OPERATOR } from '../constants.js';
import { advRangeOp } from './advRangeOp.js';

const EXCL = 33; // !

export function lexRefOp (str, pos, opts) {
  // in R1C1 mode we only allow [ '!' ]
  if (opts.r1c1) {
    if (str.charCodeAt(pos) === EXCL) {
      return { type: OPERATOR, value: str[pos] };
    }
  }
  // in A1 mode we allow [ '!', ':', '.:', ':.', '.:.']
  const c0 = str.charCodeAt(pos);
  if (c0 === EXCL) {
    return { type: OPERATOR, value: str[pos] };
  }
  const opLen = advRangeOp(str, pos);
  if (opLen) {
    return { type: OPERATOR, value: str.slice(pos, pos + opLen) };
  }
}
