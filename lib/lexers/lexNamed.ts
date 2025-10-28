import { REF_NAMED } from '../constants.js';
import type { Token } from '../extraTypes.ts';

// The advertized named ranges rules are a bit off from what Excel seems to do.
// In the "extended range" of chars, it looks like it allows most things above
// U+00B0 with the range between U+00A0-U+00AF rather random:
// /^[a-zA-Z\\_¡¤§¨ª\u00ad¯\u00b0-\uffff][a-zA-Z0-9\\_.?¡¤§¨ª\u00ad¯\u00b0-\uffff]{0,254}/
//
// I've simplified to allowing everything above U+00A1:
// /^[a-zA-Z\\_\u00a1-\uffff][a-zA-Z0-9\\_.?\u00a1-\uffff]{0,254}/
export function lexNamed (str: string, pos: number): Token | undefined {
  const start = pos;
  // starts with: [a-zA-Z\\_\u00a1-\uffff]
  const s = str.charCodeAt(pos);
  if (
    (s >= 65 && s <= 90) || // A-Z
    (s >= 97 && s <= 122) || // a-z
    (s === 95) || // _
    (s === 92) || // \
    (s > 0xA0) // \u00a1-\uffff
  ) {
    pos++;
  }
  else {
    return;
  }
  // has any number of: [a-zA-Z0-9\\_.?\u00a1-\uffff]
  let c: number;
  do {
    c = str.charCodeAt(pos);
    if (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      (c === 95) || // _
      (c === 92) || // \
      (c === 46) || // .
      (c === 63) || // ?
      (c > 0xA0) // \u00a1-\uffff
    ) {
      pos++;
    }
    else {
      break;
    }
  } while (isFinite(c));

  const len = pos - start;
  if (len && len < 255) {
    // names starting with \ must be at least 3 char long
    if (s === 92 && len < 3) {
      return;
    }
    // single characters R and C are forbidden as names
    if (len === 1 && (s === 114 || s === 82 || s === 99 || s === 67)) {
      return;
    }
    return { type: REF_NAMED, value: str.slice(start, pos) };
  }
}
