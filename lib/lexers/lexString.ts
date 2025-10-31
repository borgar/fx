import { STRING } from '../constants.ts';
import type { Token } from '../types.ts';

const QUOT = 34;

export function lexString (str: string, pos: number): Token | undefined {
  const start = pos;
  if (str.charCodeAt(pos) === QUOT) {
    pos++;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === QUOT) {
        pos++;
        if (str.charCodeAt(pos) !== QUOT) {
          return { type: STRING, value: str.slice(start, pos) };
        }
      }
      pos++;
    }
    return { type: STRING, value: str.slice(start, pos), unterminated: true };
  }
}
