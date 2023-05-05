export { tokenize } from './lexer.js';
export { addMeta } from './addMeta.js';
export { translateToRC, translateToA1 } from './translate.js';
export { default as a1 } from './a1.js';
export { default as rc } from './rc.js';
export { MAX_COLS, MAX_ROWS } from './constants.js';
export { isReference, isRange } from './isType.js';
export { mergeRefTokens as mergeRanges } from './mergeRefTokens.js';
export { fixRanges } from './fixRanges.js';

import {
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
  RANGE: REF_RANGE,
  RANGE_BEAM: REF_BEAM,
  RANGE_TERNARY: REF_TERNARY,
  RANGE_NAMED: REF_NAMED,
  FX_PREFIX,
  UNKNOWN
};
