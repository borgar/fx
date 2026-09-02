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

// [0-9A-Za-z._\u00a1\u00a4\u00a7\u00a8\u00aa\u00ad\u00af-\uffff], the characters that a sheet name may contain
function isNameChar (c: number): boolean {
  return (
    (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) ||
    c === 46 || c === 95 || c === 161 || c === 164 || c === 167 || c === 168 ||
    c === 170 || c === 173 || c >= 175
  );
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

  // A sheet name may begin with digits, so digits that run on into name characters and then
  // reach a "!" or ":" are the start of a prefix rather than a number: the "2020plan" of
  // 2020plan!A1, or of Jan:2020plan!A1.
  if (!frac && isNameChar(tail)) {
    let end = pos;
    while (end < str.length && isNameChar(str.charCodeAt(end))) {
      end++;
    }
    const after = str.charCodeAt(end);
    if (after === EXCL || after === COLON) {
      return;
    }
  }

  return { type: NUMBER, value: str.slice(start, pos) };
}
