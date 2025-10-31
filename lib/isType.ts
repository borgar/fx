import {
  REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, REF_STRUCT,
  FX_PREFIX, WHITESPACE, NEWLINE,
  FUNCTION, OPERATOR,
  ERROR, STRING, NUMBER, BOOLEAN
} from './constants.ts';
import type { Token } from './types.ts';

/**
 * Determines whether the specified token is a range.
 *
 * Returns `true` if the input is a token that has a type of either REF_RANGE
 * (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or
 * REF_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.
 *
 * @param token A token
 * @returns True if the specified token is range, False otherwise.
 */
export function isRange (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && (
    token.type === REF_RANGE ||
    token.type === REF_BEAM ||
    token.type === REF_TERNARY
  );
}

/**
 * Determines whether the specified token is a reference.
 *
 * Returns `true` if the input is a token of type REF_RANGE (`A1` or `A1:B2`),
 * REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), REF_BEAM (`A:A` or `1:1`),
 * or REF_NAMED (`myrange`). In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is reference, False otherwise.
 */
export function isReference (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && (
    token.type === REF_RANGE ||
    token.type === REF_BEAM ||
    token.type === REF_TERNARY ||
    token.type === REF_STRUCT ||
    token.type === REF_NAMED
  );
}

/**
 * Determines whether the specified token is a literal.
 *
 * Returns `true` if the input is a token of type BOOLEAN (`TRUE` or `FALSE`),
 * ERROR (`#VALUE!`), NUMBER (123.4), or STRING (`"lorem ipsum"`). In all other
 * cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is literal, False otherwise.
 */
export function isLiteral (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && (
    token.type === BOOLEAN ||
    token.type === ERROR ||
    token.type === NUMBER ||
    token.type === STRING
  );
}

/**
 * Determines whether the specified token is an error.
 *
 * Returns `true` if the input is a token of type ERROR (`#VALUE!`). In all
 * other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is error, False otherwise.
 */
export function isError (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && token.type === ERROR;
}

/**
 * Determines whether the specified token is whitespace.
 *
 * Returns `true` if the input is a token of type WHITESPACE (` `) or
 * NEWLINE (`\n`). In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is whitespace, False otherwise.
 */
export function isWhitespace (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && (
    token.type === WHITESPACE ||
    token.type === NEWLINE
  );
}

/**
 * Determines whether the specified token is a function.
 *
 * Returns `true` if the input is a token of type FUNCTION.
 * In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is function, False otherwise.
 */
export function isFunction (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && token.type === FUNCTION;
}

/**
 * Returns `true` if the input is a token of type FX_PREFIX (leading `=` in
 * formula). In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is effects prefix, False otherwise.
 */
export function isFxPrefix (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && token.type === FX_PREFIX;
}

/**
 * Determines whether the specified token is an operator.
 *
 * Returns `true` if the input is a token of type OPERATOR (`+` or `:`). In all
 * other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is operator, False otherwise.
 */
export function isOperator (token?: Pick<Token, 'type'> | null): boolean {
  return !!token && token.type === OPERATOR;
}
