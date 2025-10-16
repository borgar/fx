const PERIOD = 46;
const COLON = 58;

export function advRangeOp (str, pos) {
  const c0 = str.charCodeAt(pos);
  const c1 = str.charCodeAt(pos + 1);
  if (c0 === PERIOD && c1 === COLON) {
    return str.charCodeAt(pos + 2) === PERIOD ? 3 : 2;
  }
  if (c0 === COLON) {
    return c1 === PERIOD ? 2 : 1;
  }
  return 0;
}
