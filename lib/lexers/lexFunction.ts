import { FUNCTION } from '../constants.js';
import type { Token } from '../types.ts';

const PAREN_OPEN = 40;

// [A-Za-z_]+[A-Za-z\d_.]*(?=\()
export function lexFunction (str: string, pos: number): Token | undefined {
  const start = pos;
  // starts with: a-zA-Z_
  let c = str.charCodeAt(pos);
  if (
    (c < 65 || c > 90) && // A-Z
    (c < 97 || c > 122) && // a-z
    (c !== 95) // _
  ) {
    return;
  }
  pos++;
  // has any number of: a-zA-Z0-9_.
  do {
    c = str.charCodeAt(pos);
    if (
      (c < 65 || c > 90) && // A-Z
      (c < 97 || c > 122) && // a-z
      (c < 48 || c > 57) && // 0-9
      (c !== 95) && // _
      (c !== 46) // .
    ) {
      break;
    }
    pos++;
  } while (pos < str.length);
  // followed by a (
  if (str.charCodeAt(pos) === PAREN_OPEN) {
    return { type: FUNCTION, value: str.slice(start, pos) };
  }
}
