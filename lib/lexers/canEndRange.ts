// regular: [A-Za-z0-9_\u00a1-\uffff]
export function canEndRange (str: string, pos: number): boolean {
  const c = str.charCodeAt(pos);
  return !(
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
    (c === 40) || // (
    (c > 0xA0) // \u00a1-\uffff
  );
}

// A beam may not end where a sheet prefix begins: the "Jan:Dec" of "Jan:Dec!A1"
// is a sheet range (a 3-D reference), not a column beam. Excel forbids ":" in
// sheet names, so a colon ahead of the "!" can only separate two sheet names.
export function canEndBeam (str: string, pos: number): boolean {
  return canEndRange(str, pos) && str.charCodeAt(pos) !== 33; // 33 = "!"
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
