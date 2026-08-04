import type {
  ReferenceA1,
  ReferenceStruct,
  ReferenceR1C1,
  ReferenceA1Xlsx,
  ReferenceStructXlsx,
  ReferenceR1C1Xlsx,
  ReferenceName,
  ReferenceNameXlsx
} from './types.ts';
import { splitSheetRange } from './splitSheetRange.ts';
import { isCellShape } from './lexers/advSheetName.ts';

const reBannedChars = /[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;
// A1-XFD1048575 | R | C | RC
const reIsRangelike = /^(R|C|RC|[A-Z]{1,3}\d{1,7})$/i;
const reIsBoolean = /^(TRUE|FALSE)$/i;

// Must this sheet scope be quoted for the notation to read the sheet range it contains? Only a
// near end that is also a valid cell address forces it, by giving the colon to the range operator
// when left bare: "A1:Dec!C3" is cell A1 joined to 'Dec'!C3, and "RC:Dec!R1C1" is cell RC joined
// to 'Dec'!R1C1. Each notation reads the other's cell addresses as ordinary names, so a prefix
// that crosses between them may arrive needing quotes it did not need where it came from. The
// test is the lexers' own, so a scope left bare here is one they read back as a sheet range.
function sheetRangeNeedsQuotes (scope: string, r1c1: boolean): boolean {
  const sheetRange = splitSheetRange(scope);
  return !!sheetRange && isCellShape(sheetRange[0], r1c1);
}

// The same question of a whole prefix, for the translators, which move one across notations
// without taking it apart. The sheet is its last scope, so it is what follows the workbook
// brackets when there are any, and the only scope that may contain a sheet range.
export function prefixNeedsQuotes (prefix: string, r1c1: boolean): boolean {
  return sheetRangeNeedsQuotes(prefix.slice(prefix.lastIndexOf(']') + 1), r1c1);
}

export function needQuotes (scope: string, yesItDoes = 0): number {
  if (yesItDoes) {
    return 1;
  }
  if (scope) {
    if (reBannedChars.test(scope)) {
      return 1;
    }
    if (reIsRangelike.test(scope)) {
      return 1;
    }
    // Sheet/workbook names starting with a digit must be quoted in Excel to
    // avoid ambiguity with numeric literals.
    if (/^\d/.test(scope)) {
      return 1;
    }
    // A boolean literal is likewise read ahead of a name: bare "TRUE!A1" lexes as TRUE joined to
    // a reference, so a sheet named TRUE or FALSE has to be quoted to read back as a prefix.
    if (reIsBoolean.test(scope)) {
      return 1;
    }
  }
  return 0;
}

// Each end of a sheet range is tested on its own, and the whole prefix is quoted as one unit if
// either end calls for it: "Jan:Dec!A1" stays bare, "'Sheet1:Sheet 2'!A1" does not. Excel decides
// it per name and not per range, so "A:B!A1" and "A:AB!A1" stay bare while "B:C!A1" is quoted,
// "C" alone being a name it quotes anywhere. A malformed sheet range is left to needQuotes, which
// quotes it, ":" being a banned character in a name.
//
// The R1C1 cell addresses are checked on top of that: needQuotes quotes what looks like an A1
// cell wherever it appears, but "R1C1" is only a cell in R1C1 notation, and a near end that is
// one there has to be quoted all the same.
export function needQuotesSheet (scope: string, yesItDoes = 0, r1c1 = false): number {
  if (yesItDoes) {
    return 1;
  }
  const sheetRange = splitSheetRange(scope);
  if (!sheetRange) {
    return needQuotes(scope);
  }
  if (r1c1 && sheetRangeNeedsQuotes(scope, true)) {
    return 1;
  }
  return needQuotes(sheetRange[0]) || needQuotes(sheetRange[1]);
}

export function quotePrefix (prefix) {
  return "'" + prefix.replace(/'/g, "''") + "'";
}

export function stringifyPrefix (
  ref: ReferenceA1 | ReferenceName | ReferenceStruct | ReferenceR1C1,
  r1c1 = false
): string {
  let pre = '';
  let quote = 0;
  let nth = 0;
  let sheetRange = false;
  // Only a reference to a cell may write a sheet range bare, the lexers reading one back only in
  // front of a cell reference (see operandAllowsSheetRange). A name or a table takes the colon as an
  // ordinary character, which needQuotes quotes as one, so "a:b" in front of a name comes back
  // out as "'a:b'!Name" and reads back as the single scope it was written from.
  const takesSheetRange = 'range' in ref && !!ref.range;
  const context = ref.context || [];
  for (let i = context.length; i > -1; i--) {
    const scope = context[i];
    if (scope) {
      const part = (nth % 2) ? '[' + scope + ']' : scope;
      pre = part + pre;
      // the last scope is the sheet, and only it may contain a sheet range
      if (nth) {
        quote += needQuotes(scope, quote);
      }
      else if (takesSheetRange) {
        sheetRange = !!splitSheetRange(scope);
        quote += needQuotesSheet(scope, quote, r1c1);
      }
      else {
        quote += needQuotes(scope, quote);
      }
      nth++;
    }
  }
  if (sheetRange && nth > 1) {
    // Excel quotes a sheet range that a workbook or path qualifies as a whole on entry, even when
    // neither end needs it: "[Book.xlsx]S1:S3!A1" comes back as "'[Book.xlsx]S1:S3'!A1". Note the
    // asymmetry with a single sheet, where such quotes are instead removed. This binds the writer
    // only: a stored formula Excel never took from the formula bar may contain the bare spelling,
    // "[1]One:Three!A1", which is read here as the same sheet range.
    quote = 1;
  }
  if (quote) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}

export function stringifyPrefixXlsx (
  ref: ReferenceA1Xlsx | ReferenceNameXlsx | ReferenceStructXlsx | ReferenceR1C1Xlsx,
  r1c1 = false
): string {
  let pre = '';
  let quote = 0;
  const { workbookName, sheetName } = ref;
  // see stringifyPrefix: only a reference to a cell may write a sheet range bare
  const takesSheetRange = 'range' in ref && !!ref.range;
  if (workbookName) {
    pre += '[' + workbookName + ']';
    quote += needQuotes(workbookName);
  }
  if (sheetName) {
    pre += sheetName;
    quote += takesSheetRange ? needQuotesSheet(sheetName, 0, r1c1) : needQuotes(sheetName);
    if (takesSheetRange && workbookName && splitSheetRange(sheetName)) {
      // see stringifyPrefix: a workbook-qualified sheet range is written quoted as a whole
      quote = 1;
    }
  }
  if (quote) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}
