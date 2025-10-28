import { OPERATOR_TRIM } from '../constants.js';
import type { Token } from '../extraTypes.ts';

const PERIOD = 46;
const COLON = 58;

export function lexRangeTrim (str: string, pos: number): Token | undefined {
  const c0 = str.charCodeAt(pos);
  if (c0 === PERIOD || c0 === COLON) {
    const c1 = str.charCodeAt(pos + 1);
    if (c0 !== c1) {
      if (c1 === COLON) {
        return {
          type: OPERATOR_TRIM,
          value: str.slice(pos, pos + (str.charCodeAt(pos + 2) === PERIOD ? 3 : 2))
        };
      }
      else if (c1 === PERIOD) {
        return {
          type: OPERATOR_TRIM,
          value: str.slice(pos, pos + 2)
        };
      }
    }
  }
}
