import { isA1 } from './isA1.ts';
import { isOkayNameChar } from './lexers/charTables.ts';
import { hasLeadingRC } from './hasLeadingRC.ts';

/**
 * Determines if a string is a valid name according to Excel's rules:
 *
 * - Must be between 1 and 255 characters long, except if it starts with "\", where the minimum is 3 characters.
 * - Must not start with a number, period, or question mark.
 * - Must not include punctuation other than "\", ".", "?", "_"
 * - Must not be "R", "r", "C", "c", "rc", or "RC".
 * - Must not start with "r" or "R" followed by digits that form a row number (1-1048576),
 *   unless a "." immediately follows the digits.
 * - Must not start with "c", "C", "rc" or "RC" followed by digits that form a column number
 *   (1-16384), unless a "." immediately follows the digits.
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
    if (hasLeadingRC(name)) {
      return false;
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
