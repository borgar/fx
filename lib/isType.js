import { RANGE, RANGE_BEAM, RANGE_NAMED, RANGE_PART } from './constants.js';

export function isRange (token) {
  return !!token && (
    token.type === RANGE ||
    token.type === RANGE_BEAM ||
    token.type === RANGE_PART
  );
}

export function isReference (token) {
  return !!token && (
    token.type === RANGE ||
    token.type === RANGE_BEAM ||
    token.type === RANGE_PART ||
    token.type === RANGE_NAMED
  );
}
