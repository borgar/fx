import { NUMBER } from '../constants.js';

const re_NUMBER = /(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/y;

export function lexNumber (str, pos) {
  re_NUMBER.lastIndex = pos;
  const m = re_NUMBER.exec(str);
  if (m) {
    return { type: NUMBER, value: m[0] };
  }
}
