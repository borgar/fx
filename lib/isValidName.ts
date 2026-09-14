import { isA1 } from './isA1.ts';
import { isOkayNameChar } from './lexers/lexNameFuncCntx.ts';

const isR = (c: number) => c === 114 || c === 82;
const isC = (c: number) => c === 99 || c === 67;
const isNum = (c: number) => c >= 48 && c <= 57;

function hasLeadingRC (name: string, start = 0): boolean {
  let zeros = 0;
  let digits = 0;
  for (let i = start; i < start + 7; i++) {
    const c = name.charCodeAt(i);
    if (isNum(c)) {
      digits++;
      if (c === 48) { // zero
        zeros++;
      }
    }
    else if (c === 46) {
      // if we hit a ".", we abort because it invalidates the prefix restriction
      return false;
    }
    else {
      break;
    }
  }
  return (digits > 0 && digits <= 6 && zeros !== digits);
}

/**
 * Determines if a string is a valid name according to Excel's rules:
 *
 * - Must be between 1 and 255 characters long, except if it starts with "\", where the minimum is 3 characters.
 * - Must not start with a number, period, or question mark.
 * - Must not include punctuation other than "\", ".", "?", "_"
 * - Must not be "R", "r", "C", "c", "rc", or "RC".
 * - Must not start with "r" or "R" followed by 1-6 number characters
 *   (unless they are all "0" or immediately followed by a ".")
 * - Must not start with "c", "C", "rc" or "RC" followed by 1-6 number characters
 *   (unless they are all "0" or immediately followed by a ".")
 * - Must not be a valid A1 range.
 *
 * @param name A string to check for validity
 * @returns True if the string is a valid Excel name.
 */
export function isValidName (name: string): boolean {
  const len = name.length;
  const s = name.charCodeAt(0);

  if (len && len <= 255) {
    // names starting with \ must be at least 3 char long
    if (s === 92 && len < 3) {
      return false;
    }

    // leading RC notation
    const leadR = isR(s);
    const leadC = isC(s);
    if (leadR || leadC) {
      // single characters R and C are forbidden as names
      if (len === 1) {
        return false;
      }
      const next = name.charCodeAt(1);
      const leadRC = leadR && isC(next);
      // so is the string "RC"
      if (len === 2 && leadRC) {
        return false;
      }
      // check if r# or c# or rc#
      if (leadRC && isNum(name.charCodeAt(2)) && hasLeadingRC(name, 2)) {
        return false;
      }
      else if ((leadC || leadR) && hasLeadingRC(name, 1)) {
        return false;
      }
    }

    // first char: /^[a-zA-Z_\\\u00a1-\uffff]$/
    if (!isOkayNameChar(s, 0)) {
      return false;
    }
    // other chars:/^[a-zA-Z0-9_.\\?\u00a1-\uffff]$/;
    for (let i = 1; i < len; i++) {
      if (!isOkayNameChar(name.charCodeAt(i), i)) {
        return false;
      }
    }

    if (isA1(name)) {
      return false;
    }

    return true;
  }

  return false;
}
