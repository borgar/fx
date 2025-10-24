import { OPERATOR } from '../constants.js';

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
  if (
    // { } ! # % &
    c0 === 123 || c0 === 125 || c0 === 33 || c0 === 35 || c0 === 37 || c0 === 38 ||
    // ( ) * + , -
    c0 === 40 || c0 === 41 || c0 === 42 || c0 === 43 || c0 === 44 || c0 === 45 ||
    // / : ; < = >
    c0 === 47 || c0 === 58 || c0 === 59 || c0 === 60 || c0 === 61 || c0 === 62 ||
    // @ ^
    c0 === 64 || c0 === 94
  ) {
    return { type: OPERATOR, value: str[pos] };
  }
}
