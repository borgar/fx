import { CONTEXT, FUNCTION, REF_NAMED, UNKNOWN } from '../constants.ts';
import type { Token } from '../types.ts';
import { lexContextUnquoted } from './lexContext.ts';
import {
  ALLOWED, OK_0, OK_N,
  OK_NAME_0, OK_FUNC_0, OK_CNTX_0, OK_NAME_N, OK_FUNC_N, OK_CNTX_N
} from './charTables.ts';

const BR_OPEN = 91; // [
const PAREN_OPEN = 40;
const EXCL = 33; // !
const COLON = 58;

function isValidName (str: string, s: number, start: number, pos: number, name: number) {
  const len = pos - start;
  if (name && len && len < 255) {
    // names starting with \ must be at least 3 char long
    if (s === 92 && len < 3) {
      return false;
    }
    // single characters R and C are forbidden as names
    if (len === 1 && (s === 114 || s === 82 || s === 99 || s === 67)) {
      return false;
    }
    return true;
  }
  return false;
}

export function lexNameFuncCntx (
  str: string,
  pos: number,
  opts: { xlsx: boolean }
): Token | undefined {
  const start = pos;

  const s = str.charCodeAt(pos);

  // allow `[Book1.xlsx]` prefix + Unquoted
  if (s === BR_OPEN) {
    return lexContextUnquoted(str, pos, opts);
  }

  const a = ALLOWED[s];
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

  let c: number;
  do {
    c = str.charCodeAt(pos);
    const a = ALLOWED[c] ?? 0;
    if (a & OK_N) {
      // name: [a-zA-Z_0-9.\\?\u00a1-\uffff]
      // func: [a-zA-Z_0-9.]
      // cntx: [a-zA-Z_0-9.¡¤§¨ª\u00ad¯-\uffff]
      if (name && !(a & OK_NAME_N)) {
        name = 0;
      }
      if (func && !(a & OK_FUNC_N)) {
        func = 0;
      }
      if (cntx && !(a & OK_CNTX_N)) {
        cntx = 0;
      }
    }
    else {
      if (c === PAREN_OPEN && func) {
        return { type: FUNCTION, value: str.slice(start, pos) };
      }
      // `foo:bar` is a valid expression of [ name RANGE name ]
      else if (cntx && c === EXCL) {
        return { type: CONTEXT, value: str.slice(start, pos) };
      }
      return isValidName(str, s, start, pos, name)
        ? { type: REF_NAMED, value: str.slice(start, pos) }
        : { type: (cntx && c === COLON) ? CONTEXT : UNKNOWN, value: str.slice(start, pos) };
    }
    pos++;
  }
  while ((name || func || cntx) && pos < str.length);

  if (start !== pos) {
    return isValidName(str, s, start, pos, name)
      ? { type: REF_NAMED, value: str.slice(start, pos) }
      : { type: UNKNOWN, value: str.slice(start, pos) };
  }
}
