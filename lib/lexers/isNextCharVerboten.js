//  partial: [A-Za-z0-9_($.]
//  regular: [A-Za-z0-9_\u00a1-\uffff]
export function isNextCharVerboten (str, pos, partial = false) {
  const c = str.charCodeAt(pos);
  if (partial) {
    return (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      (c === 95) || // _
      (c === 40) || // (
      (c === 36) || // $
      (c === 46) // .
    );
  }
  return (
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
    (c > 0xA0) // \u00a1-\uffff
  );
}
