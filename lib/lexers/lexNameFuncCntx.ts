import { CONTEXT, FUNCTION, REF_NAMED, UNKNOWN } from '../constants.ts';
import type { Token } from '../types.ts';
import { advSheetName, operandAllowsSheetRange } from './sheetPrefix.ts';
import { lexContextUnquoted, type LexContextOptions } from './lexContext.ts';

const BR_OPEN = 91; // [
const PAREN_OPEN = 40;
const EXCL = 33; // !
const COLON = 58; // :
const QUOT_SINGLE = 39; // '
const OFFS = 32;

// build a map of characters to allow-bitmasks
const ALLOWED = new Uint8Array(180 - OFFS);
const OK_NAME_0 = 0b000001;
const OK_FUNC_0 = 0b000010;
const OK_CNTX_0 = 0b000100;
const OK_NAME_N = 0b001000;
const OK_FUNC_N = 0b010000;
const OK_CNTX_N = 0b100000;
const OK_0 = OK_NAME_0 | OK_FUNC_0 | OK_CNTX_0;
const OK_N = OK_NAME_N | OK_FUNC_N | OK_CNTX_N;
const OK_HIGHCHAR = OK_NAME_0 | OK_NAME_N | OK_CNTX_0 | OK_CNTX_N;
for (let c = OFFS; c < 180; c++) {
  const char = String.fromCharCode(c);
  const n0 = /^[a-zA-Z_\\\u00a1-\uffff]$/.test(char);
  const f0 = /^[a-zA-Z_]$/.test(char);
  const nN = /^[a-zA-Z0-9_.\\?\u00a1-\uffff]$/.test(char);
  const fN = /^[a-zA-Z0-9_.]$/.test(char);
  const cX = /^[a-zA-Z0-9_.¡¤§¨ª\u00ad¯-\uffff]$/.test(char);
  // ":" is a context character, but only past the first one, where it separates the two sheet
  // names of a sheet range (`Sheet1:Sheet2!A1`, a 3-D reference). See the COLON handling below.
  // It is never the ":" of a Windows drive letter: a path holds "\" or "/", neither of which is a
  // context character, so no path can be an unquoted context in the first place.
  const cN = cX || c === COLON;
  ALLOWED[c - OFFS] = (
    (n0 ? OK_NAME_0 : 0) |
    (nN ? OK_NAME_N : 0) |
    (f0 ? OK_FUNC_0 : 0) |
    (fN ? OK_FUNC_N : 0) |
    (cX ? OK_CNTX_0 : 0) |
    (cN ? OK_CNTX_N : 0)
  );
}

function nameOrUnknown (str, s, start, pos, name) {
  const len = pos - start;
  if (name && len && len < 255) {
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
  return { type: UNKNOWN, value: str.slice(start, pos) };
}

export function lexNameFuncCntx (
  str: string,
  pos: number,
  opts: LexContextOptions
): Token | undefined {
  const start = pos;

  const s = str.charCodeAt(pos);
  const a = s >= 180 ? OK_HIGHCHAR : ALLOWED[s - OFFS];
  // name: [a-zA-Z_\\\u00a1-\uffff]
  // func: [a-zA-Z_]
  // cntx: [a-zA-Z_0-9.¡¤§¨ª\u00ad¯-\uffff]
  if (((a & OK_CNTX_0) && !(a & OK_NAME_0) && !(a & OK_FUNC_0)) || s === BR_OPEN) {
    // its a context so delegate to that lexer
    return lexContextUnquoted(str, pos, opts);
  }
  if (!(a & OK_0)) {
    return;
  }
  let name = (a & OK_NAME_0) ? 1 : 0;
  let func = (a & OK_FUNC_0) ? 1 : 0;
  let cntx = (a & OK_CNTX_0) ? 1 : 0;
  pos++;

  // Offset of the ":" of a sheet range (`Sheet1:Sheet2!A1`, a 3-D reference), 0 when there is
  // none. Excel forbids ":" in a sheet name, so at most one may occur here, with a sheet name on
  // either side of it.
  let colon = 0;
  // Where the name run ended, 0 while it is still running. Only a ":" can end it while the
  // context run continues, so if the run turns out not to be a context after all, this is where
  // the name to emit ends: the "foo" of "foo:B2".
  let nameEnd = 0;

  let c: number;
  do {
    c = str.charCodeAt(pos);
    // Every character past the table's last entry is allowed wherever a high character is, which
    // is what OK_HIGHCHAR says. The mask has to be read off the character in hand: reading it off
    // the token's first character instead let everything after a high one pass as high too, so
    // that "Ærið!A1" and "Ærið:Ärger!A1" were swallowed whole into a single name token.
    const a = c >= 180 ? OK_HIGHCHAR : ALLOWED[c - OFFS] ?? 0;
    if (a & OK_N) {
      // name: [a-zA-Z_0-9.\\?\u00a1-\uffff]
      // func: [a-zA-Z_0-9.]
      // cntx: [a-zA-Z_0-9.:¡¤§¨ª\u00ad¯-\uffff]
      if (name && !(a & OK_NAME_N)) {
        name = 0;
        nameEnd = pos;
      }
      if (func && !(a & OK_FUNC_N)) {
        func = 0;
      }
      if (cntx && !(a & OK_CNTX_N)) {
        cntx = 0;
      }
      else if (cntx && c === COLON) {
        if (colon) {
          cntx = 0; // only 1 allowed
        }
        else if (str.charCodeAt(pos + 1) === QUOT_SINGLE) {
          // the second name of a sheet range may be quoted on its own: "foo:'bar'!A1"
          const len = advSheetName(str, pos + 1);
          if (
            len &&
            str.charCodeAt(pos + 1 + len) === EXCL &&
            operandAllowsSheetRange(str, pos + len + 2, !!opts.r1c1)
          ) {
            return { type: CONTEXT, value: str.slice(start, pos + 1 + len) };
          }
          cntx = 0;
        }
        else {
          colon = pos;
        }
      }
    }
    else {
      if (c === PAREN_OPEN && func) {
        return { type: FUNCTION, value: str.slice(start, pos) };
      }
      // A trailing colon means the second sheet name is missing. A colon at all means a sheet
      // range, and one stands only in front of a cell reference: where the operand is not one,
      // the colon is the range operator and what precedes it is a name, not a prefix.
      else if (
        c === EXCL && cntx &&
        !(colon && colon === pos - 1) &&
        (!colon || operandAllowsSheetRange(str, pos + 1, !!opts.r1c1))
      ) {
        return { type: CONTEXT, value: str.slice(start, pos) };
      }
      return nameOrUnknown(str, s, start, nameEnd || pos, nameEnd ? 1 : name);
    }
    pos++;
  }
  while ((name || func || cntx) && pos < str.length);

  if (start !== pos) {
    return nameOrUnknown(str, s, start, nameEnd || pos, nameEnd ? 1 : name);
  }
}
