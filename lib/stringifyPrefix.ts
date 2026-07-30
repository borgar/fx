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
// sheet names, so a colon here can only be separating two of them, and each is tested on its own:
// "Jan:Dec!A1" stays bare, "Sheet1:Sheet 2" is quoted as a whole because one endpoint needs it.
// Only the sheet slot may be split this way — a path scope can hold a colon of its own (a Windows
// drive letter) which does not divide it into two names.
export function needQuotesSheet (scope: string, yesItDoes = 0): number {
  if (yesItDoes) {
    return 1;
  }
  const colon = scope ? scope.indexOf(':') : -1;
  if (colon < 0) {
    return needQuotes(scope);
  }
  const from = scope.slice(0, colon);
  const to = scope.slice(colon + 1);
  if (!from || !to || to.includes(':')) {
    // not a sheet range at all; quote it so that it survives a round trip
    return 1;
  }
  return needQuotes(from) || needQuotes(to);
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
  const context = ref.context || [];
  for (let i = context.length; i > -1; i--) {
    const scope = context[i];
    if (scope) {
      const part = (nth % 2) ? '[' + scope + ']' : scope;
      pre = part + pre;
      // the last scope is the sheet, and only it may hold a sheet range
      quote += nth ? needQuotes(scope, quote) : needQuotesSheet(scope, quote);
      nth++;
    }
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
  }
  if (quote) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}
