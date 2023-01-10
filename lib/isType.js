import { RANGE, RANGE_BEAM, RANGE_NAMED } from './constants.js';

export function isRange (token) {
  return !!token && (
    token.type === RANGE ||
    token.type === RANGE_BEAM
  );
}

export function isReference (token) {
  return !!token && (
    token.type === RANGE ||
    token.type === RANGE_BEAM ||
    token.type === RANGE_NAMED
  );
}
