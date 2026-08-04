// regular: [A-Za-z0-9_\u00a1-\uffff]
// Also rejects "!" and "'", because a range must not end where a sheet prefix begins, quoted or
// not. lexRange defers to a whole sheet range before either notation's range lexer runs, so what
// is left to settle here is the pair whose first name is also a valid cell address and is
// therefore not a sheet range: "A1:B2" in "A1:B2!C3" ends at "A1", leaving "B2!" to prefix the
// right-hand side, and likewise "R1C1:R2C2" in "R1C1:R2C2!R3C3" in R1C1 notation. Excel reads
// them the same way, storing "=SUM(A1:B2!C3)" as "=SUM(A1:'B2'!C3)", which evaluates to #VALUE!.
//
// The "'" is refused whether or not a prefix follows, which is wider than the rule needs: it
// makes an unfinished "=A1'" one UNKNOWN token rather than a range and a stray quote. Narrowing
// it would buy a lookahead to the closing quote and nothing else, no valid formula putting a
// quote straight after a range, and the half-typed "=A1:'Sheet 2'!B2" ending its range at the
// colon anyway.
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
