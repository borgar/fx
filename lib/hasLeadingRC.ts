import { MAX_COLS, MAX_ROWS } from './constants.ts';

const isR = (c: number) => c === 114 || c === 82;
const isC = (c: number) => c === 99 || c === 67;
const isNum = (c: number) => c >= 48 && c <= 57;

// Returns true if the digits starting at `start` form a number from 1 to `max`, and
// are not immediately followed by a ".".
function isRCDigits (name: string, start: number, max: number): boolean {
  let value = 0;
  let i = start;
  while (i < name.length) {
    const c = name.charCodeAt(i);
    if (!isNum(c)) {
      break;
    }
    // stop accumulating once past the limit so long digit runs can't overflow
    if (value <= max) {
      value = value * 10 + c - 48;
    }
    i++;
  }
  if (name.charCodeAt(i) === 46) {
    // a "." right after the digits lifts the prefix restriction
    return false;
  }
  return value >= 1 && value <= max;
}

/**
 * Determines if a string starts with R1C1 notation that Excel doesn't allow at the start of a
 * name or an unquoted sheet name:
 *
 * - It is "R", "r", "C", "c", "RC", or "rc".
 * - It starts with "r" or "R" followed by digits that form a row number (1-1048576),
 *   unless a "." immediately follows the digits.
 * - It starts with "c", "C", "rc" or "RC" followed by digits that form a column number
 *   (1-16384), unless a "." immediately follows the digits.
 *
 * @param name A string to check
 * @returns True if the string starts with disallowed R1C1 notation.
 */
export function hasLeadingRC (name: string): boolean {
  const len = name.length;
  const s = name.charCodeAt(0);
  const leadR = isR(s);
  const leadC = isC(s);
  if (leadR || leadC) {
    // single characters R and C are forbidden
    if (len === 1) {
      return true;
    }
    const leadRC = leadR && isC(name.charCodeAt(1));
    // so is the string "RC"
    if (len === 2 && leadRC) {
      return true;
    }
    // check if r# or c# or rc#
    if (leadRC && isNum(name.charCodeAt(2)) && isRCDigits(name, 2, MAX_COLS + 1)) {
      return true;
    }
    return isRCDigits(name, 1, leadR ? MAX_ROWS + 1 : MAX_COLS + 1);
  }
  return false;
}
