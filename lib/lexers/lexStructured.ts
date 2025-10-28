import { parseSRange } from '../parseSRange.js';
import { REF_STRUCT } from '../constants.js';
import { isWS } from './lexWhitespace.js';
import type { Token } from '../extraTypes.ts';

const EXCL = 33; // !

export function lexStructured (str: string, pos: number): Token | undefined {
  const structData = parseSRange(str, pos);
  if (structData && structData.length) {
    // we have a match for a valid SR
    let i = structData.length;
    // skip tailing whitespace
    while (isWS(str.charCodeAt(pos + i))) {
      i++;
    }
    // and ensure that it isn't followed by a !
    if (str.charCodeAt(pos + i) !== EXCL) {
      return {
        type: REF_STRUCT,
        value: structData.token
      };
    }
  }
}
