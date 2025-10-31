export { tokenize, type OptsTokenize } from './tokenize.ts';
export { parse, type OptsParse } from './parse.ts';
export { translateFormulaToR1C1, translateTokensToR1C1, type OptsTranslateToR1C1 } from './translateToR1C1.ts';
export {
  translateFormulaToA1, type OptsTranslateFormulaToA1,
  translateTokensToA1, type OptsTranslateTokensToA1
} from './translateToA1.ts';
export { MAX_COLS, MAX_ROWS } from './constants.ts';
export { mergeRefTokens } from './mergeRefTokens.ts';
export { fixTokenRanges, fixFormulaRanges, type OptsFixRanges } from './fixRanges.ts';
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
export {
  isArrayNode,
  isBinaryNode,
  isCallNode,
  isErrorNode,
  isExpressionNode,
  isIdentifierNode,
  isLambdaNode,
  isLetDeclaratorNode,
  isLetNode,
  isLiteralNode,
  isReferenceNode,
  isUnaryNode
} from './isNodeType.ts';
export { fromCol } from './fromCol.ts';
export { toCol } from './toCol.ts';
export { parseA1Ref, type OptsParseA1Ref } from './parseA1Ref.ts';
export { stringifyA1Ref } from './stringifyA1Ref.ts';
export { addA1RangeBounds } from './addA1RangeBounds.ts';
export { parseR1C1Ref, type OptsParseR1C1Ref } from './parseR1C1Ref.ts';
export { stringifyR1C1Ref } from './stringifyR1C1Ref.ts';
export { stringifyStructRef, type OptsStringifyStructRef } from './stringifyStructRef.ts';
export { parseStructRef } from './parseStructRef.ts';
export { stringifyTokens } from './stringifyTokens.ts';

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
  ReferenceStructXlsx,
  ReferenceName,
  ReferenceNameXlsx
} from './types.ts';
export type * from './astTypes.ts';

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
  IDENTIFIER,
  LAMBDA,
  LET,
  LET_DECL
} from './constants.ts';

/**
 * A dictionary of the types used to identify token variants.
 *
 * @prop OPERATOR - Unary or binary operator (`+`, `%`)
 * @prop BOOLEAN - Boolean literal (`TRUE`)
 * @prop ERROR - Error literal (`#VALUE!`)
 * @prop NUMBER - Number literal (`123.4`, `-1.5e+2`)
 * @prop FUNCTION - Function name (`SUM`)
 * @prop NEWLINE - Newline character (`\n`)
 * @prop WHITESPACE - Whitespace character sequence (` `)
 * @prop STRING - String literal (`"Lorem ipsum"`)
 * @prop CONTEXT - Reference context ([Workbook.xlsx]Sheet1)
 * @prop CONTEXT_QUOTE - Quoted reference context (`'[My workbook.xlsx]Sheet1'`)
 * @prop REF_RANGE - A range identifier (`A1`)
 * @prop REF_BEAM - A range "beam" identifier (`A:A` or `1:1`)
 * @prop REF_TERNARY - A ternary range identifier (`B2:B`)
 * @prop REF_NAMED - A name / named range identifier (`income`)
 * @prop REF_STRUCT - A structured reference identifier (`table[[Column1]:[Column2]]`)
 * @prop FX_PREFIX - A leading equals sign at the start of a formula (`=`)
 * @prop UNKNOWN - Any unidentifiable range of characters.
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
  IDENTIFIER,
  LAMBDA,
  LET,
  LET_DECL
});
