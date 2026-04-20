// regular: [A-Za-z0-9_\u00a1-\uffff]
export function canEndRange (str: string, pos: number): boolean {
  const c = str.charCodeAt(pos);
  return !(
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
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
