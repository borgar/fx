import { OPERATOR } from '../constants.js';

const OPS = new Set([ 123, 125, 33, 35, 37, 38, 40, 41, 42, 43, 44, 45, 47, 58, 59, 60, 61, 62, 64, 94 ]);

export function lexOperator (str, pos) {
  const c0 = str.charCodeAt(pos);
  const c1 = str.charCodeAt(pos + 1);
  if (
    (c0 === 60 && c1 === 61) || // <=
    (c0 === 62 && c1 === 61) || // >=
    (c0 === 60 && c1 === 62)    // <>
  ) {
    return { type: OPERATOR, value: str.slice(pos, pos + 2) };
  }
  if (OPS.has(c0)) {
    return { type: OPERATOR, value: str[pos] };
  }
}
