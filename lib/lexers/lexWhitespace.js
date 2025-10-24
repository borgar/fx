import { WHITESPACE } from '../constants.js';

export function isWS (c) {
  return (
    c === 0x9 ||
    c === 0xB ||
    c === 0xC ||
    c === 0xD ||
    c === 0x20 ||
    c === 0xA0 ||
    c === 0x1680 ||
    c === 0x2028 ||
    c === 0x2029 ||
    c === 0x202f ||
    c === 0x205f ||
    c === 0x3000 ||
    c === 0xfeff ||
    (c >= 0x2000 && c <= 0x200a)
  );
}

export function lexWhitespace (str, pos) {
  const start = pos;
  while (isWS(str.charCodeAt(pos))) {
    pos++;
  }
  if (pos !== start) {
    return { type: WHITESPACE, value: str.slice(start, pos) };
  }
}
