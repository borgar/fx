import type {
  ReferenceA1,
  ReferenceStruct,
  ReferenceR1C1,
  ReferenceA1Xlsx,
  ReferenceStructXlsx,
  ReferenceR1C1Xlsx,
  ReferenceName,
  ReferenceNameXlsx,
  Token
} from './types.ts';
import { OPERATOR, WHITESPACE, NEWLINE } from './constants.ts';

const CHAR_PERIOD = 46;
const CHAR_0 = 48;
const CHAR_9 = 57;

const reBannedChars = /[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;
// A1-XFD1048575 | R | R0-R1048577 | C | C0-C16385 | RC
const reIsRangelike = /^(R\d{0,7}|C\d{0,5}|R\d{0,7}C\d{0,5}|[A-Z]{1,3}\d{1,7})$/i;
const reIsBoolean = /^(TRUE|FALSE)$/i;
const reIsLinkIndex = /^\d+$/;

const rangeOperators = new Set([ ':', '.:', ':.', '.:.' ]);

// Is the token at `index` the right operand of a range operator? Looks back past any
// whitespace/newline, since Excel allows spacing around the range colon
// (`A1 : Jan:Mar!B2`).
export function followsRangeOperator (tokens: Token[], index: number): boolean {
  for (let i = index - 1; i >= 0; i--) {
    const t = tokens[i];
    if (t.type === WHITESPACE || t.type === NEWLINE) { continue; }
    return t.type === OPERATOR && rangeOperators.has(t.value);
  }
  return false;
}

export function needQuotes (scope: string, blockSheetRanges: boolean, bracketed: boolean, checkColon = false): number {
  if (scope) {
    if (checkColon && scope.includes(':')) {
      const bits = scope.split(':');
      if (blockSheetRanges || bits.length > 2) {
        // Because we can't really know what this is, and it's "sometimes" valid, the only option is to quote it:
        //  - c:\path[book.xlx]sheet!*
        //  - [book.xlx]sheet!*
        //  - sheet!*
        //  - book.xlx!*
        //  - c:\path\book.xlx!foo
        return 1;
      }
      return bits.some(bit => needQuotes(bit, blockSheetRanges, bracketed)) ? 1 : 0;
    }
    if (reBannedChars.test(scope)) {
      return 1;
    }
    if (reIsRangelike.test(scope)) {
      return 1;
    }
    if (reIsBoolean.test(scope)) {
      return 1;
    }
    const char0 = scope.charCodeAt(0);
    if (char0 === CHAR_PERIOD) {
      return 1;
    }
    if ((char0 >= CHAR_0 && char0 <= CHAR_9) && !(bracketed && reIsLinkIndex.test(scope))) {
      return 1;
    }
  }
  return 0;
}

export function quotePrefix (prefix: string) {
  return "'" + prefix.replace(/'/g, "''") + "'";
}

export function stringifyPrefix (
  ref: ReferenceA1 | ReferenceName | ReferenceStruct | ReferenceR1C1
): string {
  let pre = '';
  let quote = 0;
  const isName = !('range' in ref);
  const context = ref.context || [];
  const len = context.length;
  if (len > 3) {
    throw new Error('Invalid reference prefix: ' + JSON.stringify(context));
  }
  if (len > 2) {
    pre += context[len - 3];
    quote += needQuotes(context[len - 3], isName, false);
  }
  if (len > 1) {
    pre += '[' + context[len - 2] + ']';
    quote += quote ? 1 : needQuotes(context[len - 2], isName, true);
  }
  if (len) {
    pre += context[len - 1];
    quote += quote ? 1 : needQuotes(context[len - 1], isName, false, true);
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
  const isName = !('range' in ref);
  const { workbookName, sheetName } = ref;
  // if (path) {
  //   pre += sheetName;
  //   quote += needQuotes(workbookName, isName);
  // }
  if (workbookName) {
    pre += '[' + workbookName + ']';
    quote += quote ? 1 : needQuotes(workbookName, isName, true);
  }
  if (sheetName) {
    pre += sheetName;
    quote += quote ? 1 : needQuotes(sheetName, isName, false, true);
  }
  if (quote) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}
