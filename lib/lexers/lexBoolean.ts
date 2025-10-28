import { BOOLEAN } from '../constants.js';
import type { Token } from '../extraTypes.ts';

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
          // non char to follow?
          return { type: BOOLEAN, value: str.slice(pos, pos + 4) };
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
            // non char to follow?
            return { type: BOOLEAN, value: str.slice(pos, pos + 5) };
          }
        }
      }
    }
  }
}
