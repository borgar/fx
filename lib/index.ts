/**
 * A tokenizer, parser, and other utilities to work with Excel formula code.
 *
 * The base entry-point methods expect and return the variant of references that uses contexts.
 * If you are using xlsx files or otherwise want to work with the xlsx-file variant of references
 * you should use the {@link fx/xlsx} variant methods.
 *
 * See [Prefixes.md](./Prefixes.md) for documentation on how scopes work in Fx.
 *
 * @packageDocumentation
 * @module fx
 */

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
export { addA1RangeBounds } from './addA1RangeBounds.ts';
export { toCol } from './toCol.ts';
export { fromCol } from './fromCol.ts';
export { parseA1Range } from './parseA1Range.ts';
export { parseA1Ref, type OptsParseA1Ref } from './parseA1Ref.ts';
export { parseR1C1Range } from './parseR1C1Range.ts';
export { parseR1C1Ref, type OptsParseR1C1Ref } from './parseR1C1Ref.ts';
export { parseStructRef } from './parseStructRef.ts';
export { stringifyA1Ref } from './stringifyA1Ref.ts';
export { stringifyR1C1Ref } from './stringifyR1C1Ref.ts';
export { stringifyStructRef, type OptsStringifyStructRef } from './stringifyStructRef.ts';
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
export { tokenTypes } from './tokenTypes.ts';
export { nodeTypes } from './nodeTypes.ts';
