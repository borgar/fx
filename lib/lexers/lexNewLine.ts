import { NEWLINE } from '../constants.js';
import type { Token } from '../types.ts';

export function lexNewLine (str: string, pos: number): Token | undefined {
  const start = pos;
  while (str.charCodeAt(pos) === 10) {
    pos++;
  }
  if (pos !== start) {
    return { type: NEWLINE, value: str.slice(start, pos) };
  }
}
