// regular: [A-Za-z0-9_\u00a1-\uffff]
// Also rejects "!" and "'", because a range must not end where a sheet prefix begins, whether
// that prefix is quoted or not. A whole sheet range never reaches here — lexRange stands aside
// for one before either notation's range lexer runs — so what this settles is the pair whose near
// end is shaped like a cell, and which is therefore not a sheet range: "A1:B2" in "A1:B2!C3" ends
// at "A1", so that "B2!" can prefix the right-hand side, and "R1C1:R2C2" in "R1C1:R2C2!R3C3"
// likewise in R1C1 notation. Excel resolves those spellings the same way: a colon ahead of the
// sheet prefix separates two sheet names, unless what precedes it is shaped like a cell address,
// in which case the reference on the right keeps the sheet prefix ("=SUM(A1:B2!C3)" is stored as
// "=SUM(A1:'B2'!C3)" and evaluates to #VALUE!).
//
// The "'" is refused whether or not a prefix does follow it, which is wider than the rule needs
// and is meant to stay that way: an unfinished "=A1'" degrades to a single UNKNOWN token rather
// than a range and a stray quote. Narrowing it would buy a lookahead to the closing quote and
// nothing else, since no valid formula puts a quote straight after a range, and the half-typed
// spelling that does matter, "=A1:'Sheet 2'!B2", reaches its range through the colon instead.
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
