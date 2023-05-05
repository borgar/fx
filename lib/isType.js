import {
  RANGE, RANGE_BEAM, RANGE_NAMED, RANGE_TERNARY, RANGE_STRUCT,
  FX_PREFIX, WHITESPACE, NEWLINE,
  FUNCTION, OPERATOR,
  ERROR, STRING, NUMBER, BOOLEAN
} from './constants.js';

export function isRange (token) {
  return !!token && (
    token.type === RANGE ||
    token.type === RANGE_BEAM ||
    token.type === RANGE_TERNARY
  );
}

export function isReference (token) {
  return !!token && (
    token.type === RANGE ||
    token.type === RANGE_BEAM ||
    token.type === RANGE_TERNARY ||
    token.type === RANGE_STRUCT ||
    token.type === RANGE_NAMED
  );
}

export function isLiteral (token) {
  return !!token && (
    token.type === BOOLEAN ||
    token.type === ERROR ||
    token.type === NUMBER ||
    token.type === STRING
  );
}

export function isError (token) {
  return !!token && token.type === ERROR;
}

export function isWhitespace (token) {
  return !!token && (
    token.type === WHITESPACE ||
    token.type === NEWLINE
  );
}

export function isFunction (token) {
  return !!token && token.type === FUNCTION;
}

export function isFxPrefix (token) {
  return !!token && token.type === FX_PREFIX;
}

export function isOperator (token) {
  return !!token && token.type === OPERATOR;
}
