export { tokenize } from './lexer.js';
export { addMeta } from './addMeta.js';
export { translateToRC, translateToA1 } from './translate.js';
export { default as a1 } from './a1.js';
export { default as rc } from './rc.js';
export { MAX_COLS, MAX_ROWS } from './constants.js';

import {
  OPERATOR,
  BOOLEAN,
  ERROR,
  NUMBER,
  FUNCTION,
  NEWLINE,
  WHITESPACE,
  STRING,
  PATH_QUOTE,
  PATH_BRACE,
  PATH_PREFIX,
  RANGE,
  RANGE_BEAM,
  RANGE_NAMED,
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
  PATH_QUOTE,
  PATH_BRACE,
  PATH_PREFIX,
  RANGE,
  RANGE_BEAM,
  RANGE_NAMED,
  FX_PREFIX,
  UNKNOWN
};
