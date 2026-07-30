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

const reBannedChars = /[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;
// A1-XFD1048575 | R | C | RC
const reIsRangelike = /^(R|C|RC|[A-Z]{1,3}\d{1,7})$/i;

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
  }
  return 0;
}

// A sheet scope may hold a sheet range ("Sheet1:Sheet2", a 3-D reference). Excel forbids ":" in
// sheet names, so a colon here can only be separating two of them. Returns the two sheet names,
// or null if the scope is a plain sheet name — or a malformed range, which is left to be handled
// as a name (needQuotes then quotes it, ":" being a banned character).
// Only the sheet slot may be split this way. A path scope can hold a colon of its own (a Windows
// drive letter) without it dividing the path into two names, and a workbook is not a sheet.
export function splitSheetRange (scope: string): [ string, string ] | null {
  const colon = scope ? scope.indexOf(':') : -1;
  if (colon < 0) {
    return null;
  }
  const from = scope.slice(0, colon);
  const to = scope.slice(colon + 1);
  return (from && to && !to.includes(':')) ? [ from, to ] : null;
}

// Each end of a sheet range is tested on its own, and the whole prefix is quoted as one unit if
// either end calls for it: "Jan:Dec!A1" stays bare, "'Sheet1:Sheet 2'!A1" does not.
export function needQuotesSheet (scope: string, yesItDoes = 0): number {
  if (yesItDoes) {
    return 1;
  }
  const sheetRange = splitSheetRange(scope);
  if (!sheetRange) {
    return needQuotes(scope);
  }
  return needQuotes(sheetRange[0]) || needQuotes(sheetRange[1]);
}

export function quotePrefix (prefix) {
  return "'" + prefix.replace(/'/g, "''") + "'";
}

export function stringifyPrefix (
  ref: ReferenceA1 | ReferenceName | ReferenceStruct | ReferenceR1C1
): string {
  let pre = '';
  let quote = 0;
  let nth = 0;
  let sheetRange = false;
  const context = ref.context || [];
  for (let i = context.length; i > -1; i--) {
    const scope = context[i];
    if (scope) {
      const part = (nth % 2) ? '[' + scope + ']' : scope;
      pre = part + pre;
      // the last scope is the sheet, and only it may hold a sheet range
      if (nth) {
        quote += needQuotes(scope, quote);
      }
      else {
        sheetRange = !!splitSheetRange(scope);
        quote += needQuotesSheet(scope, quote);
      }
      nth++;
    }
  }
  if (sheetRange && nth > 1) {
    // Excel always quotes a sheet range that a workbook or path qualifies, even when neither end
    // needs it: "[Book.xlsx]S1:S3!A1" is stored as "'[Book.xlsx]S1:S3'!A1". Note the asymmetry
    // with a single sheet, where such quotes are instead removed.
    quote = 1;
  }
  if (quote) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}

export function stringifyPrefixXlsx (
  ref: ReferenceA1Xlsx | ReferenceNameXlsx | ReferenceStructXlsx | ReferenceR1C1Xlsx
): string {
  let pre = '';
  let quote = 0;
  const { workbookName, sheetName } = ref;
  if (workbookName) {
    pre += '[' + workbookName + ']';
    quote += needQuotes(workbookName);
  }
  if (sheetName) {
    pre += sheetName;
    quote += needQuotesSheet(sheetName);
    if (workbookName && splitSheetRange(sheetName)) {
      // see stringifyPrefix: a workbook-qualified sheet range is always quoted
      quote = 1;
    }
  }
  if (quote) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}
