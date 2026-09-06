// regular: [A-Za-z0-9_\u00a1-\uffff]
export function canEndRange (str: string, pos: number): boolean {
  const c = str.charCodeAt(pos);
  return !(
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
    (c === 40) || // (
    (c === 33) || // !
    (c === 39) || // '
    (c === 46 && periodContinuesName(str, pos)) || // .
    (c > 0xA0) // \u00a1-\uffff
  );
}

// partial: [A-Za-z0-9_($.]
// Also rejects "!" — a ternary range must not end where a sheet prefix
// begins (e.g. "F2:B" in "B!F2:B!F20" is not a ternary range; the
// trailing "B" is the start of the second sheet prefix "B!").
export function canEndPartialRange (str: string, pos: number): boolean {
  const c = str.charCodeAt(pos);
  return !(
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
    (c === 40) || // (
    (c === 36) || // $
    (c === 46) || // .
    (c === 33) // !
  );
}

/**
 * Check whether the period at `pos` continues a name, overruling the lexing of a range before it.
 *
 * A period after what looks like a range (with no $ or [ or ] characters) may either:
 *
 * 1. open a trim operator (`.:`, `.:.`), so it still ends a range lexed before it
 * 2. or continue a token which, up until the period, could be either a range or a name
 *
 * This returns true in the latter case, after checking that the token is all A-Za-z0-9 up to pos.
 */
function periodContinuesName (str: string, pos: number): boolean {
  if (str.charCodeAt(pos + 1) === 58) { // :
    return false;
  }
  let p = pos;
  let c: number;
  do {
    c = str.charCodeAt(--p);
  }
  while (
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) // 0-9
  );
  if (c === 36 || c === 91 || c === 93) { // $ [ ]
    return false;
  }
  // p is the position right before the start of the name-or-range token.
  const s = str.charCodeAt(p + 1);
  return (p + 1 < pos) && (
    (s >= 65 && s <= 90) || // A-Z
    (s >= 97 && s <= 122) // a-z
  );
}
