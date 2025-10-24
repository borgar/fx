import { NUMBER } from '../constants.js';

function advDigits (str, pos) {
  const start = pos;
  do {
    const c = str.charCodeAt(pos);
    if (c < 48 || c > 57) { // 0-9
      break;
    }
    pos++;
  }
  while (pos < str.length);
  return pos - start;
}

// \d+(\.\d+)?(?:[eE][+-]?\d+)?
export function lexNumber (str, pos) {
  const start = pos;

  // integer
  const lead = advDigits(str, pos);
  if (!lead) { return; }
  pos += lead;

  // optional fraction part
  const c0 = str.charCodeAt(pos);
  if (c0 === 46) { // .
    pos++;
    const frac = advDigits(str, pos);
    if (!frac) { return; }
    pos += frac;
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

  return { type: NUMBER, value: str.slice(start, pos) };
}
