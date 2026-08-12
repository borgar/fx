import { lexRangeA1 } from './lexRangeA1.ts';
import { lexRangeR1C1 } from './lexRangeR1C1.ts';

const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const COLON = 58; // :
const EXCL = 33; // !

// The cell addresses of each notation: "A1", "XFD1048576" in A1, "R1C1", "RC1", "R1C" and "RC" in
// R1C1. The bracketed R1C1 forms ("R[1]C[1]") need no test of their own: "[" is not a sheet-name
// character, so it cannot occur in either end of a sheet range.
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
// characters consumed, or 0 if the quote is never closed.
//
// Brackets and colons are refused, so neither "Jan:'[1]Nope'!A1" nor "Jan:'a:b'!A1" is a sheet
// range. A workbook may only be named ahead of the whole prefix, and Excel forbids ":" in a sheet
// name, so the only colon a sheet range can hold is the one dividing its two ends, which is
// behind us by the time this runs. See docs/Prefixes.md.
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

// Advances over a sheet name, quoted or not: a lone one, or the first end of a sheet range. Excel
// quotes a prefix as a whole rather than end by end, but a quote around the first end alone is
// redundant rather than wrong, and Excel reads one back as the sheet range it looks like:
// "'R':Gamma!A1" hand-written into a file comes back as "'R:Gamma'!A1". The second end is
// advSecondSheetName's business, and a quote there is not redundant at all.
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

// Advances over the second end of a sheet range at `pos`. Returns the number of characters
// consumed, or 0 where Excel reads the colon as the range operator instead, which any quote
// around that end makes it do: "Alpha:'Gamma'!A1" is the name "Alpha" joined to 'Gamma'!A1, and
// so is "Alpha:'My Sheet'!A1", where the name's own characters are what called for the quotes. It
// makes no difference which of the two put the quote there, and Excel never corrects either: the
// whole prefix is the one place a sheet range's quotes may go.
export function advSecondSheetName (str: string, pos: number): number {
  if (str.charCodeAt(pos) === QUOT_SINGLE) {
    return 0;
  }
  return advSheetName(str, pos);
}

// Is this sheet name also a valid cell address in the given notation? Where the first sheet name
// is one, the colon goes to the range operator instead: the lexers read "A1:B2!C3" as cell A1
// joined to 'B2'!C3, and the serializer has to quote the sheet range A1:B2 so that it does not
// read back as that.
export function isCellAddress (name: string, r1c1: boolean): boolean {
  return (r1c1 ? reIsCellR1C1 : reIsCellA1).test(name);
}

// Does a cell reference begin at `pos`, just past the "!" that closes a sheet prefix? A bare sheet
// range stands in front of one and nowhere else, so this decides whether the colon ahead of the
// "!" divides two sheet names or is the range operator. In Excel, `Alpha:Gamma!A1` is a sheet
// range, while `Alpha:Gamma!SomeName` and `Alpha:Gamma!Table1[Col]` are the range operator
// joining a name to a prefixed operand. See docs/Prefixes.md.
//
// The question is put to the range lexers themselves, so the answer agrees with what the operand
// will actually lex as, and it is put permissively: any cell reference at all keeps the
// sheet-range reading. Only an operand no range lexer can begin on, which is what a name or a
// table is, gives the colon away.
//
// This settles the bare form alone. A quoted prefix is one lexical unit whatever it holds, so
// `'Alpha:Gamma'!SomeName` is one reference here, as it is for Excel, which reads that scope as
// a workbook file name with no sheet at all. Refusing the sheet-range reading of it is
// splitSheetRange's job, since it sees the operand behind the prefix.
export function operandAllowsSheetRange (str: string, pos: number, r1c1: boolean): boolean {
  return !!(r1c1
    ? lexRangeR1C1(str, pos, { allowTernary: true })
    : lexRangeA1(str, pos, { allowTernary: true, mergeRefs: true }));
}

// Does a sheet prefix start here: one sheet name, or two joined by a ":", followed by the "!"
// that closes every prefix? Each name is measured as a name, so it need not be a reference part
// ("C1:Dec!R1C1"), and the first may be quoted on its own ("'C1':Dec!R1C1").
//
// Each name has to be measured in full, because "." is the one character a sheet name may contain
// that a range is also allowed to end on, so a range lexer can stop part-way through a name: the
// "a1" of "a1.b!A1" is not a cell address. That is also why a lone name counts here and not only
// a pair.
//
// Three further tests apply to a pair only. Which names may stand as the second end is
// advSecondSheetName's question. A first name that is also a valid cell address gives the colon
// to the range operator, and the notation decides which names those are: "A1:B2!C3" is cell A1
// joined to 'B2'!C3, while "A1:B2!R3C3" in R1C1 is a sheet range, "A1" addressing nothing there.
// And the operand has to admit a sheet range at all. A lone name is exempt from all three: no
// range lexer can take one whole ("!" being no range character), and "Jan!SomeName" is an
// ordinary prefix on an ordinary name.
export function startsSheetPrefix (str: string, pos: number, r1c1: boolean): boolean {
  const first = advSheetName(str, pos);
  if (!first) {
    return false;
  }
  if (str.charCodeAt(pos + first) === EXCL) {
    return true;
  }
  if (str.charCodeAt(pos + first) !== COLON) {
    return false;
  }
  const second = advSecondSheetName(str, pos + first + 1);
  if (!second || str.charCodeAt(pos + first + 1 + second) !== EXCL) {
    return false;
  }
  if (isCellAddress(str.slice(pos, pos + first), r1c1)) {
    return false;
  }
  // left until last, being the only test that runs a range lexer
  return operandAllowsSheetRange(str, pos + first + 1 + second + 1, r1c1);
}
