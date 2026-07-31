import { CONTEXT, CONTEXT_QUOTE } from '../constants.ts';
import type { Token } from '../types.ts';
import { advSheetName, isContextChar } from './advSheetName.ts';
import { lexRange } from './lexRange.ts';

const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const EXCL = 33; // !
const COLON = 58; // :

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

// Is the run from `start` to `pos` a whole range in its own right? A cell-shaped left end
// belongs to the range operator rather than to a sheet range, so "A1:B2!C3" is cell A1 joined to
// 'B2'!C3 rather than a reference into sheets A1 through B2. The formula lexers settle this by
// running lexRange ahead of the context lexers, but the reference lexers run this one first, so
// it has to ask.
function endsAWholeRange (str: string, start: number, pos: number, options: LexContextOptions): boolean {
  const range = lexRange(str, start, {
    allowTernary: !!options.allowTernary,
    mergeRefs: !!options.mergeRefs,
    r1c1: !!options.r1c1
  });
  return !!range && range.value.length >= pos - start;
}

export type LexContextOptions = {
  xlsx: boolean,
  allowTernary?: boolean,
  mergeRefs?: boolean,
  r1c1?: boolean
};

// xlsx xml uses a variant of the syntax that has external references in
// bracets. Any of: [1]Sheet1!A1, '[1]Sheet one'!A1, [1]!named
export function lexContextUnquoted (str: string, pos: number, options: LexContextOptions): Token | undefined {
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
        // "$Jan:$Mar!A1" on entry, and a file holding one does not open at all.
        //
        // Only one ":" is allowed, and the near end must be a name: the sheet begins after the
        // workbook brackets when there are any, so "[Book.xlsx]:Sheet2!A1" names no first sheet.
        if (colon || pos === (br2 == null ? start : br2 + 1)) { return; }
        if (endsAWholeRange(str, start, pos, options)) { return; }
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
