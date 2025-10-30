export { tokenize, type TokenizeOptions } from './tokenize.ts';
export { parse, type ParseOptions } from './parse.ts';
export { addTokenMeta } from './addTokenMeta.ts';
export { translateToR1C1, type TranslateToR1C1Options } from './translateToR1C1.ts';
export { translateToA1, type TranslateToA1Options } from './translateToA1.ts';
export { MAX_COLS, MAX_ROWS } from './constants.ts';
export { mergeRefTokens } from './mergeRefTokens.ts';
export { fixTokenRanges, fixFormulaRanges, type FixRangesOptions } from './fixRanges.ts';
export {
  isError,
  isFunction,
  isFxPrefix,
  isLiteral,
  isOperator,
  isRange,
  isReference,
  isWhitespace
} from './isType.ts';

export { fromCol } from './fromCol.ts';
export { toCol } from './toCol.ts';

export { parseA1Ref, parseA1RefXlsx, type ParseA1RefOptions } from './parseA1Ref.ts';
export { stringifyA1Ref } from './stringifyA1Ref.ts';

export { addA1RangeBounds } from './addA1RangeBounds.ts';

export { parseR1C1Ref } from './parseR1C1Ref.ts';
export { stringifyR1C1Ref } from './stringifyR1C1Ref.ts';

export { stringifyStructRef, stringifyStructRefXlsx } from './stringifyStructRef.ts';
export { parseStructRef } from './parseStructRef.ts';

export type {
  RangeA1,
  RangeR1C1,
  Token,
  TokenEnhanced,
  ReferenceA1,
  ReferenceA1Xlsx,
  ReferenceR1C1,
  ReferenceR1C1Xlsx,
  ReferenceStruct,
  ReferenceStructXlsx
} from './types.ts';

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
} from './constants.ts';

/**
 * A dictionary of the types used to identify token variants.
 *
 * @property {string} OPERATOR - Unary or binary operator (`+`, `%`)
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

