import { isOkayNameChar } from './lexers/lexNameFuncCntx.ts';

/**
 * Determines if a string is a valid name according to Excel's rules:
 *
 * - Must be between 1 and 255 characters long, except if it starts with "\", where the minimum is 3 characters.
 * - Must not start with a number, period, or question mark.
 * - Must not include punctuation other than "\", ".", "?", "_"
 *
 * @param name A string to check for validity
 * @returns True if the string is a valid Excel name.
 */
export function isValidName (name: string): boolean {
  const len = name.length;
  const s = name.charCodeAt(0);

  if (len && len < 255) {
    // names starting with \ must be at least 3 char long
    if (s === 92 && len < 3) {
      return false;
    }

    // single characters R and C are forbidden as names
    if (len === 1 && (s === 114 || s === 82 || s === 99 || s === 67)) {
      return false;
    }

    // first char: /^[a-zA-Z_\\\u00a1-\uffff]$/
    if (!isOkayNameChar(s, 0)) {
      return false;
    }
    // other chars:/^[a-zA-Z0-9_.\\?\u00a1-\uffff]$/;
    for (let i = 1; i < len; i++) {
      if (!isOkayNameChar(s, 0)) {
        return false;
      }
    }
    return true;
  }

  return false;
}
