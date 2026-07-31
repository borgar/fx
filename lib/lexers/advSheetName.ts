const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const COLON = 58; // :
const EXCL = 33; // !

// The cell addresses of each notation: "A1", "B2", "XFD1048576" in A1 notation, "R1C1", "RC1",
// "R1C" and "RC" in R1C1. The bracketed R1C1 forms ("R[1]C[1]") need no test of their own, a
// bracket being neither a sheet-name character nor one that can occur in either end of a sheet
// range.
const reIsCellA1 = /^[A-Z]{1,3}\d{1,7}$/i;
const reIsCellR1C1 = /^R(?:[1-9]\d{0,6})?C(?:[1-9]\d{0,4})?$/i;

// [0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]
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
    (c === 173) || // \u00ad
    (c >= 175)    // ¯-\uffff
  );
}

// Advances over a quoted sheet name, "''" standing for a quote within it. Returns the number of
// characters consumed, or 0 if the quote is never closed. Brackets are refused: a workbook is
// named here only ahead of the whole prefix, never inside one end of a sheet range. Excel does
// write the latter, but only to bind an end that has stopped naming a sheet to a manufactured
// external link, "Jan:'[1]Nope'!A1" (see docs/Prefixes.md). A colon is refused too, Excel
// forbidding it in a sheet name: a name measured here is one end of a sheet range, and the colon
// that divides the two ends has been passed already. A colon inside a prefix quoted as a whole is
// a different matter, and this function sees one only while testing whether the quoted run begins
// a sheet range, which it does not.
function advQuotedSheetName (str: string, pos: number): number {
  const start = pos;
  pos++;
  while (pos < str.length) {
    const c = str.charCodeAt(pos);
    if (c === BR_OPEN || c === BR_CLOSE || c === COLON) {
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

// Is this sheet name also a valid cell address in the given notation? The range operator takes the
// colon of a sheet range whose near end is one, which both the lexers and the serializer have to
// know: the lexers to read "A1:B2!C3" as cell A1 joined to 'B2'!C3, the serializer to know that
// writing the sheet range A1:B2 unquoted would read back as that instead.
export function isCellShape (name: string, r1c1: boolean): boolean {
  return (r1c1 ? reIsCellR1C1 : reIsCellA1).test(name);
}

// Does a sheet prefix start here — a sheet name, or the two of a sheet range joined by a ":", and
// then the "!" that closes every prefix? Each name is measured as a name, so it does not have to
// be a reference part ("C1:Dec!R1C1") and either end may be quoted on its own ("C1:'Dec'!R1C1").
//
// Each name has to be one in full. A range lexer, or a range operator, stops wherever its own
// grammar runs out, which can be part-way through a sheet name: the "a1" of "a1.b!A1" is no more
// a cell address than the whole "a1.b" is, and "." is the one character a sheet name may contain
// that a range is also allowed to end on. Measuring the name to the "!" or the ":" tells the two
// apart, and is why a lone name counts here and not only a range of two.
//
// A near end that is a whole name and also a valid cell address gives the colon to the range
// operator, and the notation being read decides which names those are: "A1:B2!C3" is cell A1
// joined to 'B2'!C3 in A1 notation, while "A1:B2!R3C3" is a sheet range in R1C1, where "A1"
// addresses nothing. A lone name needs no such test — a range lexer can never take one whole,
// "!" being no range character.
export function startsSheetPrefix (str: string, pos: number, r1c1: boolean): boolean {
  const near = advSheetName(str, pos);
  if (!near) {
    return false;
  }
  if (str.charCodeAt(pos + near) === EXCL) {
    return true;
  }
  if (str.charCodeAt(pos + near) !== COLON) {
    return false;
  }
  const far = advSheetName(str, pos + near + 1);
  if (!far || str.charCodeAt(pos + near + 1 + far) !== EXCL) {
    return false;
  }
  return !isCellShape(str.slice(pos, pos + near), r1c1);
}
