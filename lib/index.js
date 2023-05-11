export { tokenize } from './lexer.js';
export { parse } from './parser.js';
export { addMeta } from './addMeta.js';
export { translateToRC, translateToA1 } from './translate.js';
export { default as a1 } from './a1.js';
export { default as rc } from './rc.js';
export { default as sr } from './sr.js';
export { MAX_COLS, MAX_ROWS } from './constants.js';
export { isReference, isRange } from './isType.js';
export { mergeRefTokens as mergeRanges } from './mergeRefTokens.js';
export { fixRanges } from './fixRanges.js';

import {
  // token types
  OPERATOR,
  BOOLEAN,
  ERROR,
  NUMBER,
  FUNCTION,
  NEWLINE,
  WHITESPACE,
  STRING,
  CONTEXT,
  CONTEXT_QUOTE,
  REF_RANGE,
  REF_BEAM,
  REF_TERNARY,
  REF_NAMED,
  REF_STRUCT,
  FX_PREFIX,
  UNKNOWN,
  // AST types
  UNARY,
  BINARY,
  REFERENCE,
  LITERAL,
  ERROR_LITERAL,
  CALL,
  ARRAY,
  IDENTIFIER
} from './constants.js';

export const tokenTypes = {
  OPERATOR,
  BOOLEAN,
  ERROR,
  NUMBER,
  FUNCTION,
  NEWLINE,
  WHITESPACE,
  STRING,
  CONTEXT,
  CONTEXT_QUOTE,
  REF_RANGE,
  REF_BEAM,
  REF_TERNARY,
  REF_NAMED,
  REF_STRUCT,
  FX_PREFIX,
  UNKNOWN
};

export const nodeTypes = {
  UNARY,
  BINARY,
  REFERENCE,
  LITERAL,
  ERROR: ERROR_LITERAL,
  CALL,
  ARRAY,
  IDENTIFIER
};
