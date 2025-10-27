export { tokenize } from './lexer.js';
export { parse } from './parser.js';
export { addTokenMeta } from './addTokenMeta.js';
export { translateToR1C1, translateToA1 } from './translate.js';
export { MAX_COLS, MAX_ROWS } from './constants.js';
export { mergeRefTokens } from './mergeRefTokens.js';
export { fixRanges } from './fixRanges.js';
export {
  isError,
  isFunction,
  isFxPrefix,
  isLiteral,
  isOperator,
  isRange,
  isReference,
  isWhitespace
} from './isType.js';

export { fromCol } from './fromCol.js';
export { toCol } from './toCol.js';

export {
  parseA1Ref,
  stringifyA1Ref,
  addA1RangeBounds
} from './a1.js';

export {
  parseR1C1Ref,
  stringifyR1C1Ref
} from './rc.js';

export { stringifyStructRef } from './stringifyStructRef.js';
export { parseStructRef } from './parseStructRef.js';

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

/**
 * A dictionary of the types used to identify token variants.
 *
 * @readonly
 * @property {string} OPERATOR - Newline (`\n`)
 * @property {string} BOOLEAN - Boolean literal (`TRUE`)
 * @property {string} ERROR - Error literal (`#VALUE!`)
 * @property {string} NUMBER - Number literal (`123.4`, `-1.5e+2`)
 * @property {string} FUNCTION - Function name (`SUM`)
 * @property {string} NEWLINE - Newline character (`\n`)
 * @property {string} WHITESPACE - Whitespace character sequence (` `)
 * @property {string} STRING - String literal (`"Lorem ipsum"`)
 * @property {string} CONTEXT - Reference context ([Workbook.xlsx]Sheet1)
 * @property {string} CONTEXT_QUOTE - Quoted reference context (`'[My workbook.xlsx]Sheet1'`)
 * @property {string} REF_RANGE - A range identifier (`A1`)
 * @property {string} REF_BEAM - A range "beam" identifier (`A:A` or `1:1`)
 * @property {string} REF_TERNARY - A ternary range identifier (`B2:B`)
 * @property {string} REF_NAMED - A name / named range identifier (`income`)
 * @property {string} REF_STRUCT - A structured reference identifier (`table[[Column1]:[Column2]]`)
 * @property {string} FX_PREFIX - A leading equals sign at the start of a formula (`=`)
 * @property {string} UNKNOWN - Any unidentifiable range of characters.
 * @see tokenize
 */
export const tokenTypes = Object.freeze({
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
});

/**
 * A dictionary of the types used to identify AST node variants.
 *
 * @readonly
 * @property {string} UNARY - A unary operation (`10%`)
 * @property {string} BINARY - A binary operation (`10+10`)
 * @property {string} REFERENCE - A range identifier (`A1`)
 * @property {string} LITERAL - A literal (number, string, or boolean) (`123`, `"foo"`, `false`)
 * @property {string} ERROR - An error literal (`#VALUE!`)
 * @property {string} CALL - A function call expression (`SUM(1,2)`)
 * @property {string} ARRAY - An array expression (`{1,2;3,4}`)
 * @property {string} IDENTIFIER - A function name identifier (`SUM`)
 * @see parse
 */
export const nodeTypes = Object.freeze({
  UNARY,
  BINARY,
  REFERENCE,
  LITERAL,
  ERROR: ERROR_LITERAL,
  CALL,
  ARRAY,
  IDENTIFIER
});
