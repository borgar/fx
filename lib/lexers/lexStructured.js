/* eslint-disable no-mixed-operators */
import { parseSRange } from '../parseSRange.js';
import { REF_STRUCT } from '../constants.js';

export function lexStructured (str, pos) {
  const structData = parseSRange(str, pos);
  if (structData && structData.length) {
    // we have a match for a valid SR
    let i = structData.length;
    // skip tailing whitespace
    while (str[pos + i] === ' ') {
      i++;
    }
    // and ensure that it isn't followed by a !
    if (str[pos + i] !== '!') {
      return {
        type: REF_STRUCT,
        value: structData.token
      };
    }
  }
}
