// regular: [A-Za-z0-9_\u00a1-\uffff]
// Also rejects "!" and "'", because a range must not end where a sheet prefix begins, whether
// that prefix is quoted or not:
//   "Jan:Dec" in "Jan:Dec!A1" is a sheet range (a 3-D reference), not a column beam
//   "foo:" in "foo:'bar'!A1" is likewise a sheet range, not a beam with no far end
//   "A1:B2" in "A1:B2!C3" ends at "A1", so that "B2!" can prefix the right-hand side
// Excel resolves the same spellings the same way: a colon ahead of the sheet prefix separates
// two sheet names, unless what precedes it is shaped like a cell address, in which case the
// reference on the right keeps the sheet prefix ("=SUM(A1:B2!C3)" is stored as
// "=SUM(A1:'B2'!C3)" and evaluates to #VALUE!).
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
