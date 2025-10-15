/* eslint-disable no-mixed-operators */
import { NEWLINE } from '../constants.js';

export function lexNewLine (str, pos) {
  const start = pos;
  while (str.charCodeAt(pos) === 10) {
    pos++;
  }
  if (pos !== start) {
    return { type: NEWLINE, value: str.slice(start, pos) };
  }
}
