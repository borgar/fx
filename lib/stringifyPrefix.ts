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
import { isA1 } from './isA1.ts';
import { hasLeadingRC } from './hasLeadingRC.ts';
import { charNeedsEscape } from './lexers/charTables.ts';

const CHAR_PERIOD = 46;
const CHAR_0 = 48;
const CHAR_9 = 57;

const reIsBoolean = /^(TRUE|FALSE)$/i;
const reIsLinkIndex = /^\d+$/;

function hasBannedChar (str: string): boolean {
  for (const s of str) {
    const cp = s.codePointAt(0);
    if (charNeedsEscape(cp)) {
      return true;
    }
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
    if (hasBannedChar(scope)) {
      return 1;
    }
    if (hasLeadingRC(scope) || isA1(scope)) {
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
  ref: ReferenceA1 | ReferenceName | ReferenceStruct | ReferenceR1C1,
  forceQuotes = false
): string {
  let pre = '';
  let quote = forceQuotes ? 1 : 0;
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
  if (quote && pre) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}

export function stringifyPrefixXlsx (
  ref: ReferenceA1Xlsx | ReferenceNameXlsx | ReferenceStructXlsx | ReferenceR1C1Xlsx,
  forceQuotes = false
): string {
  let pre = '';
  let quote = forceQuotes ? 1 : 0;
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
  if (quote && pre) {
    pre = quotePrefix(pre);
  }
  return pre ? pre + '!' : pre;
}
