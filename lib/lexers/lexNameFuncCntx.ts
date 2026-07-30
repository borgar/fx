import { CONTEXT, FUNCTION, REF_NAMED, UNKNOWN } from '../constants.ts';
import type { Token } from '../types.ts';
import { advSheetName } from './advSheetName.ts';
import { lexContextUnquoted } from './lexContext.ts';

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
  // ":" is a context character, but only past the first one, as the separator of a sheet range
  // (`Sheet1:Sheet2!A1`, a 3-D reference). See the COLON handling below.
  // (":" can also occur after a Windows drive letter prefix in a path context, but this table
  // lexes unquoted contexts alone, and a path cannot be one because "\" and "/" are not context
  // characters, so a colon arriving here is never a Windows drive letter.)
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
  opts: { xlsx: boolean }
): Token | undefined {
  const start = pos;

  const s = str.charCodeAt(pos);
  const a = s > 180 ? OK_HIGHCHAR : ALLOWED[s - OFFS];
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
  // none. Excel forbids ":" in sheet names, so at most one may occur here and it must have a
  // sheet name on either side of it.
  let colon = 0;
  // Where the name run ended, 0 while it is still running. Only a ":" can end it while the
  // context run carries on, so if the context turns out not to be one, this is where the name
  // to emit ends: the "foo" of "foo:B2".
  let nameEnd = 0;

  let c: number;
  do {
    c = str.charCodeAt(pos);
    const a = s > 180 ? OK_HIGHCHAR : ALLOWED[c - OFFS] ?? 0;
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
          // the far end of a sheet range may be quoted on its own: "foo:'bar'!A1"
          //
          // Returning from here also steps around the pre-existing bug in this loop's mask
          // (`s > 180` reads the token's first character where it means the current one), which
          // otherwise makes every character after a name starting above U+00B4 look like one
          // too, swallowing the rest of the string. So "Ærið:'Ärger'!A1" lexes while
          // "Ærið:Ärger!A1", and plain "Ærið!A1" before it, still do not. That asymmetry is a
          // side effect, not a design: the mask is fixed separately.
          const len = advSheetName(str, pos + 1);
          if (len && str.charCodeAt(pos + 1 + len) === EXCL) {
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
      // a trailing colon means the second sheet name is missing
      else if (c === EXCL && cntx && !(colon && colon === pos - 1)) {
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
