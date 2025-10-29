import { ERROR } from '../constants.js';
import type { Token } from '../types.ts';

const re_ERROR = /#(?:NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/iy;
const HASH = 35;

export function lexError (str: string, pos: number): Token | undefined {
  if (str.charCodeAt(pos) === HASH) {
    re_ERROR.lastIndex = pos;
    const m = re_ERROR.exec(str);
    if (m) {
      return { type: ERROR, value: m[0] };
    }
  }
}
