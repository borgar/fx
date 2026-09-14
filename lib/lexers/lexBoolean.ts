import { BOOLEAN } from '../constants.ts';
import type { Token } from '../types.ts';

const EXCL = 33; // !
const COLON = 58; // :

function preventMatch (c: number) {
  return (
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
    (c === 92) || // \
    (c === 40) || // (
    (c === 46) || // .
    (c === 63) || // ?
    (c > 0xA0) // \u00a1-\uffff
  );
}

// TRUE or FALSE between a colon and a ! is the right side of a sheet range: Alpha:TRUE!A1 is a
// 3-D reference over the sheets Alpha to TRUE. In TRUE!A1 when not preceded by a colon, TRUE is a
// boolean; Excel refuses that spelling as a reference.
function endsSheetRange (str: string, pos: number, end: number): boolean {
  return str.charCodeAt(end) === EXCL && str.charCodeAt(pos - 1) === COLON;
}

export function lexBoolean (str: string, pos: number): Token | undefined {
  // "true" (case insensitive)
  const c0 = str.charCodeAt(pos);
  if (c0 === 84 || c0 === 116) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === 82 || c1 === 114) {
      const c2 = str.charCodeAt(pos + 2);
      if (c2 === 85 || c2 === 117) {
        const c3 = str.charCodeAt(pos + 3);
        if (c3 === 69 || c3 === 101) {
          const c4 = str.charCodeAt(pos + 4);
          if (!preventMatch(c4) && !endsSheetRange(str, pos, pos + 4)) {
            return { type: BOOLEAN, value: str.slice(pos, pos + 4) };
          }
        }
      }
    }
  }
  // "false" (case insensitive)
  if (c0 === 70 || c0 === 102) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === 65 || c1 === 97) {
      const c2 = str.charCodeAt(pos + 2);
      if (c2 === 76 || c2 === 108) {
        const c3 = str.charCodeAt(pos + 3);
        if (c3 === 83 || c3 === 115) {
          const c4 = str.charCodeAt(pos + 4);
          if (c4 === 69 || c4 === 101) {
            const c5 = str.charCodeAt(pos + 5);
            if (!preventMatch(c5) && !endsSheetRange(str, pos, pos + 5)) {
              return { type: BOOLEAN, value: str.slice(pos, pos + 5) };
            }
          }
        }
      }
    }
  }
}
