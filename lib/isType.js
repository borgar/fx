import {
  REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, REF_STRUCT,
  FX_PREFIX, WHITESPACE, NEWLINE,
  FUNCTION, OPERATOR,
  ERROR, STRING, NUMBER, BOOLEAN
} from './constants.js';

export function isRange (token) {
  return !!token && (
    token.type === REF_RANGE ||
    token.type === REF_BEAM ||
    token.type === REF_TERNARY
  );
}

export function isReference (token) {
  return !!token && (
    token.type === REF_RANGE ||
    token.type === REF_BEAM ||
    token.type === REF_TERNARY ||
    token.type === REF_STRUCT ||
    token.type === REF_NAMED
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
