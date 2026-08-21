import { parseSRange } from '../parseSRange.ts';
import { REF_STRUCT } from '../constants.ts';
import { isWS } from './lexWhitespace.ts';
import type { Token } from '../types.ts';
import { isIdentityChar } from './lexNameFuncCntx.ts';

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
    const nextCode = str.charCodeAt(pos + i);
    if (nextCode !== EXCL && !isIdentityChar(nextCode)) {
      return {
        type: REF_STRUCT,
        value: structData.token
      };
    }
  }
}
