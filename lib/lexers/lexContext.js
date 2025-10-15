import { CONTEXT, CONTEXT_QUOTE } from '../constants.js';

const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const EXCL = 33; // !

// xlsx xml uses a variant of the syntax that has external references in
// bracets. Any of: [1]Sheet1!A1, '[1]Sheet one'!A1, [1]!named
export function lexContext (str, pos, options) {
  const c0 = str.charCodeAt(pos);
  let br1;
  let br2;
  // quoted context: '(?:''|[^'])*('|$)(?=!)
  if (c0 === QUOT_SINGLE) {
    const start = pos;
    pos++;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === BR_OPEN) {
        if (br1) { return; } // only 1 allowed
        br1 = pos;
      }
      else if (c === BR_CLOSE) {
        if (br2) { return; } // only 1 allowed
        br2 = pos;
      }
      else if (c === QUOT_SINGLE) {
        pos++;
        if (str.charCodeAt(pos) !== QUOT_SINGLE) {
          let valid = br1 == null && br2 == null;
          if (options.xlsx && (br1 === start + 1) && (br2 === pos - 2)) {
            valid = true;
          }
          if ((br1 >= start + 1) && (br2 < pos - 2) && (br2 > br1 + 1)) {
            valid = true;
          }
          if (valid && str.charCodeAt(pos) === EXCL) {
            return { type: CONTEXT_QUOTE, value: str.slice(start, pos) };
          }
          return;
        }
      }
      pos++;
    }
  }
  // unquoted context
  else if (c0 !== EXCL) {
    const start = pos;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === BR_OPEN) {
        if (br1) { return; } // only 1 allowed
        br1 = pos;
      }
      else if (c === BR_CLOSE) {
        if (br2) { return; } // only 1 allowed
        br2 = pos;
      }
      else if (c === EXCL) {
        let valid = br1 == null && br2 == null;
        if (options.xlsx && (br1 === start) && (br2 === pos - 1)) {
          valid = true;
        }
        if ((br1 >= start) && (br2 < pos - 1) && (br2 > br1 + 1)) {
          valid = true;
        }
        if (valid) {
          return { type: CONTEXT, value: str.slice(start, pos) };
        }
      }
      else if (
        (br1 != null && br2 == null) ||
        // [0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]
        (
          (c >= 65 && c <= 90) || // A-Z
          (c >= 97 && c <= 122) || // a-z
          (c >= 48 && c <= 57) || // 0-9
          (c === 46) || // .
          (c === 95) || // _
          (c === 161) || // ¡
          (c === 164) || // ¤
          (c === 167) || // §
          (c === 168) || // ¨
          (c === 170) || // ª
          (c === 173) || // \u00ad
          (c >= 175)    // ¯-\uffff
        )
      ) {
        // allow char
      }
      else {
        return;
      }
      // 0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff
      pos++;
    }
  }
}
