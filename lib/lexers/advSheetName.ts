const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]

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

// Advances over one end of a sheet range, quoted or not. A sheet range Excel resolves is quoted
// as a whole or not at all, but other producers quote the ends separately ("foo:'bar'!A1"), so
// each end is taken on its own.
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
