import { MAX_COLS, MAX_ROWS } from './constants.ts';

const CHAR_A_LC = 97;
const CHAR_A_UC = 65;
const CHAR_Z_LC = 122;
const CHAR_Z_UC = 90;
const CHAR_0 = 48;
const CHAR_9 = 57;

export function isA1 (source: string): boolean {
  let top = 0;
  let left = 0;

  const len = source.length;
  let pos = 0;
  let check: number;

  // get A-Z
  check = pos;
  do {
    const c = source.charCodeAt(pos);
    if (c >= CHAR_A_UC && c <= CHAR_Z_UC) {
      left = (left * 26) + (c - CHAR_A_UC + 1);
    }
    else if (c >= CHAR_A_LC && c <= CHAR_Z_LC) {
      left = (left * 26) + (c - CHAR_A_LC + 1);
    }
    else {
      break;
    }
    pos++;
  }
  while (pos < len);
  // ref is invalid if no char was read
  if (check === pos || left <= 0 || left > MAX_COLS + 1) {
    return false;
  }

  // get 0-9
  check = pos;
  do {
    const c = source.charCodeAt(pos);
    if (c >= CHAR_0 && c <= CHAR_9) {
      top = (top * 10) + (c - CHAR_0);
    }
    else {
      break;
    }
    pos++;
  }
  while (pos < len);
  // ref is invalid if no char was read
  if (check === pos || top <= 0 || top > MAX_ROWS + 1) {
    return false;
  }

  // if we're not at the end, this has gone wrong
  return pos === len;
}
