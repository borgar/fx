import { CONTEXT, CONTEXT_QUOTE } from '../constants.ts';
import type { Token } from '../types.ts';

const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const EXCL = 33; // !
const COLON = 58; // :

// [0-9A-Za-z._¡¤§¨ª­¯-￿]
export function isContextChar (c: number): boolean {
  return (
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
    (c === 173) || // ­
    (c >= 175)    // ¯-￿
  );
}

// Advances over a quoted sheet name, "''" standing for a quote within it. Returns the number of
// characters consumed, or 0 if the quote is never closed. Brackets are refused: a workbook may
// only be named ahead of the whole prefix, never inside one end of a sheet range.
function advQuotedSheetName (str: string, pos: number): number {
  const start = pos;
  pos++;
  while (pos < str.length) {
    const c = str.charCodeAt(pos);
    if (c === BR_OPEN || c === BR_CLOSE) {
      return 0;
    }
    if (c === QUOT_SINGLE) {
      pos++;
      if (str.charCodeAt(pos) !== QUOT_SINGLE) {
        return pos - start;
      }
    }
    pos++;
  }
  return 0;
}

// Advances over one end of a sheet range, quoted or not. Excel writes both ends the same way, but
// hand-written formulas quote them separately ("foo:'bar'!A1"), so each end is taken on its own.
export function advSheetName (str: string, pos: number): number {
  if (str.charCodeAt(pos) === QUOT_SINGLE) {
    return advQuotedSheetName(str, pos);
  }
  const start = pos;
  while (pos < str.length && isContextChar(str.charCodeAt(pos))) {
    pos++;
  }
  return pos - start;
}

// xlsx xml uses a variant of the syntax that has external references in
// bracets. Any of: [1]Sheet1!A1, '[1]Sheet one'!A1, [1]!named
export function lexContextQuoted (str: string, pos: number, options: { xlsx: boolean }): Token | undefined {
  const c0 = str.charCodeAt(pos);
  let br1: number;
  let br2: number;
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
          if (valid && str.charCodeAt(pos) === COLON) {
            // this is the near end of a sheet range that quotes its ends separately
            const len = advSheetName(str, pos + 1);
            if (len && str.charCodeAt(pos + 1 + len) === EXCL) {
              return { type: CONTEXT_QUOTE, value: str.slice(start, pos + 1 + len) };
            }
          }
          return;
        }
      }
      pos++;
    }
  }
}

// xlsx xml uses a variant of the syntax that has external references in
// bracets. Any of: [1]Sheet1!A1, '[1]Sheet one'!A1, [1]!named
export function lexContextUnquoted (str: string, pos: number, options: { xlsx: boolean }): Token | undefined {
  const c0 = str.charCodeAt(pos);
  let br1: number;
  let br2: number;
  // Offset of the ":" of a sheet range (`Sheet1:Sheet2!A1`, a 3-D reference), 0 when there is
  // none. Excel forbids ":" in sheet names, so at most one may occur here and it must have a
  // sheet name on either side of it.
  let colon = 0;
  if (c0 !== QUOT_SINGLE && c0 !== EXCL) {
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
        if (colon && colon === pos - 1) {
          valid = false; // the second sheet name is missing
        }
        if (valid) {
          return { type: CONTEXT, value: str.slice(start, pos) };
        }
      }
      else if (c === COLON && (br1 == null || br2 != null)) {
        // ":" joins the two names, but "$" is not admitted alongside it: Excel refuses
        // "$Jan:$Mar!A1" on entry, and a file holding one does not open at all
        if (colon || pos === start) { return; } // only 1 allowed, and not leading
        colon = pos;
        if (str.charCodeAt(pos + 1) === QUOT_SINGLE) {
          // the far end of a sheet range may be quoted on its own: "foo:'bar'!A1"
          const len = advSheetName(str, pos + 1);
          if (!len || str.charCodeAt(pos + 1 + len) !== EXCL) { return; }
          pos += len;
        }
      }
      else if ((br1 == null || br2 != null) && !isContextChar(c)) {
        return;
      }
      pos++;
    }
  }
}
