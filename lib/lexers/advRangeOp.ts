const PERIOD = 46;
const COLON = 58;

export function advRangeOp (str: string, pos: number): number {
  const c0 = str.charCodeAt(pos);
  if (c0 === PERIOD) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === COLON) {
      return str.charCodeAt(pos + 2) === PERIOD ? 3 : 2;
    }
  }
  else if (c0 === COLON) {
    const c1 = str.charCodeAt(pos + 1);
    return c1 === PERIOD ? 2 : 1;
  }
  return 0;
}

