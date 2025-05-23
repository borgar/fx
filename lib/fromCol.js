/**
 * Convert a column string representation to a 0 based
 * offset number (`"C"` = `2`).
 *
 * The method expects a valid column identifier made up of _only_
 * A-Z letters, which may be either upper or lower case. Other input will
 * return garbage.
 *
 * @param {string} columnString  The column string identifier
 * @returns {number}  Zero based column index number
 */
export function fromCol (columnString) {
  const x = (columnString || '');
  const l = x.length;
  let n = 0;
  if (l > 2) {
    const c = x.charCodeAt(l - 3);
    const a = c > 95 ? 32 : 0;
    n += (1 + c - a - 65) * 676;
  }
  if (l > 1) {
    const c = x.charCodeAt(l - 2);
    const a = c > 95 ? 32 : 0;
    n += (1 + c - a - 65) * 26;
  }
  if (l) {
    const c = x.charCodeAt(l - 1);
    const a = c > 95 ? 32 : 0;
    n += (c - a) - 65;
  }
  return n;
}
