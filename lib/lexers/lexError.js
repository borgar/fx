/* eslint-disable no-mixed-operators */
import { ERROR } from '../constants.js';

const re_ERROR = /#(?:NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/iy;

export function lexError (str, pos) {
  if (str.charCodeAt(pos) === 35) {
    re_ERROR.lastIndex = pos;
    const m = re_ERROR.exec(str);
    if (m) {
      return { type: ERROR, value: m[0] };
    }
  }
}
