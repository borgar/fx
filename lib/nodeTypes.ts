import {
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
 * A dictionary of the types used to identify AST node variants.
 *
 * @prop UNARY - A unary operation (`10%`)
 * @prop BINARY - A binary operation (`10+10`)
 * @prop REFERENCE - A range identifier (`A1`)
 * @prop LITERAL - A literal (number, string, or boolean) (`123`, `"foo"`, `false`)
 * @prop ERROR - An error literal (`#VALUE!`)
 * @prop CALL - A function call expression (`SUM(1,2)`)
 * @prop ARRAY - An array expression (`{1,2;3,4}`)
 * @prop IDENTIFIER - A function name identifier (`SUM`)
 * @prop LAMBDA - A LAMBDA expression (`LAMBDA(x,y,x*y)``)
 * @prop LET - A LET expression (`LET(a,A1*10,b,SUM(F:F),a*b)`)
 * @prop LET_DECL - A LET declaration (LET(`a,A1*10`...)
 */
export const nodeTypes = Object.freeze({
  /** A unary operation (`10%`) */
  UNARY,
  /** A binary operation (`10+10`) */
  BINARY,
  /** A range identifier (`A1`) */
  REFERENCE,
  /** A literal (number, string, or boolean) (`123`, `"foo"`, `false`) */
  LITERAL,
  /** An error literal (`#VALUE!`) */
  ERROR: ERROR_LITERAL,
  /** A function call expression (`SUM(1,2)`) */
  CALL,
  /** An array expression (`{1,2;3,4}`) */
  ARRAY,
  /** A function name identifier (`SUM`) */
  IDENTIFIER,
  /** A LAMBDA expression (`LAMBDA(x,y,x*y)``) */
  LAMBDA,
  /** A LET expression (`LET(a,A1*10,b,SUM(F:F),a*b)`) */
  LET,
  /** A LET declaration (LET(`a,A1*10`...)*/
  LET_DECL
});
