import { WHITESPACE } from '../constants.js';

export const WS = new Set([ 32, 12, 13, 9, 11, 0xA0, 5760, 8232, 8233, 8239, 8287, 12288, 65279 ]);
for (let i = 8192; i <= 8202; i++) { WS.add(i); }

export function lexWhitespace (str, pos) {
  const start = pos;
  while (WS.has(str.charCodeAt(pos))) {
    pos++;
  }
  if (pos !== start) {
    return { type: WHITESPACE, value: str.slice(start, pos) };
  }
}
