import { FUNCTION } from '../constants.js';

// [A-Za-z_]+[A-Za-z\d_.]*(?=\()
export function lexFunction (str, pos) {
  const start = pos;
  // starts with: a-zA-Z_
  let c = str.charCodeAt(pos);
  if (
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c === 95) // _
  ) {
    pos++;
  }
  else {
    return;
  }
  // has any number of: a-zA-Z0-9_.
  do {
    c = str.charCodeAt(pos);
    if (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      (c === 95) || // _
      (c === 46) // .
    ) {
      pos++;
    }
    else {
      break;
    }
  } while (isFinite(c));
  // followed by a (
  if (str[pos] === '(') {
    return { type: FUNCTION, value: str.slice(start, pos) };
  }
}
