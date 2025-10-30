export const OPERATOR = 'operator';
export const OPERATOR_TRIM = 'operator-trim'; // internal only
export const BOOLEAN = 'bool';
export const ERROR = 'error';
export const NUMBER = 'number';
export const FUNCTION = 'func';
export const NEWLINE = 'newline';
export const WHITESPACE = 'whitespace';
export const STRING = 'string';
export const CONTEXT_QUOTE = 'context_quote';
export const CONTEXT = 'context';
export const REF_RANGE = 'range';
export const REF_BEAM = 'range_beam';
export const REF_TERNARY = 'range_ternary';
export const REF_NAMED = 'range_named';
export const REF_STRUCT = 'structured';
export const FX_PREFIX = 'fx_prefix';
export const UNKNOWN = 'unknown';

export const UNARY = 'UnaryExpression';
export const BINARY = 'BinaryExpression';
export const REFERENCE = 'ReferenceIdentifier';
export const LITERAL = 'Literal';
export const ERROR_LITERAL = 'ErrorLiteral';
export const CALL = 'CallExpression';
export const LAMBDA = 'LambdaExpression';
export const LET = 'LetExpression';
export const ARRAY = 'ArrayExpression';
export const IDENTIFIER = 'Identifier';
export const LET_DECL = 'LetDeclarator';

/** The maximum number of columns a spreadsheet reference may hold (16383). */
export const MAX_COLS = (2 ** 14) - 1;

/** The maximum number of rows a spreadsheet reference may hold (1048575). */
export const MAX_ROWS = (2 ** 20) - 1;
