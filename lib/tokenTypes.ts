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
} from './constants.ts';

/**
 * A dictionary of the types used to identify token variants.
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
  /** Unary or binary operator (`+`, `%`) */
  OPERATOR: OPERATOR,
  /** Boolean literal (`TRUE`) */
  BOOLEAN: BOOLEAN,
  /** Error literal (`#VALUE!`) */
  ERROR: ERROR,
  /** Number literal (`123.4`, `-1.5e+2`) */
  NUMBER: NUMBER,
  /** Function name (`SUM`) */
  FUNCTION: FUNCTION,
  /** Newline character (`\n`) */
  NEWLINE: NEWLINE,
  /** Whitespace character sequence (` `) */
  WHITESPACE: WHITESPACE,
  /** String literal (`"Lorem ipsum"`) */
  STRING: STRING,
  /** Reference context ([Workbook.xlsx]Sheet1) */
  CONTEXT: CONTEXT,
  /** Quoted reference context (`'[My workbook.xlsx]Sheet1'`) */
  CONTEXT_QUOTE: CONTEXT_QUOTE,
  /** A range identifier (`A1`) */
  REF_RANGE: REF_RANGE,
  /** A range "beam" identifier (`A:A` or `1:1`) */
  REF_BEAM: REF_BEAM,
  /** A ternary range identifier (`B2:B`) */
  REF_TERNARY: REF_TERNARY,
  /** A name / named range identifier (`income`) */
  REF_NAMED: REF_NAMED,
  /** A structured reference identifier (`table[[Column1]:[Column2]]`) */
  REF_STRUCT: REF_STRUCT,
  /** A leading equals sign at the start of a formula (`=`) */
  FX_PREFIX: FX_PREFIX,
  /** Any unidentifiable range of characters. */
  UNKNOWN: UNKNOWN
});
