import { NUMBER } from '../constants.ts';
import type { Token } from '../types.ts';

const EXCL = 33; // !
const COLON = 58; // :

function advDigits (str: string, pos: number): number {
  const start = pos;
  while (pos < str.length) {
    const c = str.charCodeAt(pos);
    if (c < 48 || c > 57) { // 0-9
      break;
    }
    pos++;
  }
  return pos - start;
}

// (?:\d+(\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?
export function lexNumber (str: string, pos: number): Token | undefined {
  const start = pos;

  // integer part, optional when there is a fraction part (.5)
  const lead = advDigits(str, pos);
  pos += lead;

  // fraction part, optional when there is an integer part (5.)
  const c0 = str.charCodeAt(pos);
  let frac = 0;
  if (c0 === 46) { // .
    pos++;
    frac = advDigits(str, pos);
    pos += frac;
  }
  if (!frac && !lead) {
    return;
  }
  // optional exponent part
  const c1 = str.charCodeAt(pos);
  if (c1 === 69 || c1 === 101) { // E e
    pos++;
    const sign = str.charCodeAt(pos);
    if (sign === 43 || sign === 45) { // + -
      pos++;
    }
    const exp = advDigits(str, pos);
    if (!exp) { return; }
    pos += exp;
  }

  // don't allow ! or : to follow a number
  const tail = str.charCodeAt(pos);
  if (tail === EXCL || tail === COLON) {
    return;
  }

  return { type: NUMBER, value: str.slice(start, pos) };
}
