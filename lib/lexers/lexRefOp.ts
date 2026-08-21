import { OPERATOR } from '../constants.ts';
import type { Token } from '../types.ts';
import { advRangeOp } from './advRangeOp.ts';

const EXCL = 33; // !

export function lexRefOp (str: string, pos: number): Token | undefined {
  if (str.charCodeAt(pos) === EXCL) {
    return { type: OPERATOR, value: str[pos] };
  }
  const opLen = advRangeOp(str, pos);
  if (opLen) {
    return { type: OPERATOR, value: str.slice(pos, pos + opLen) };
  }
}
