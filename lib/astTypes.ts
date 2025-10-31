/**
 * Represents the source location information of the node.
 * If the node contains no information about the source location, the field is `null`;
 * otherwise it is an array consisting of a two numbers: A start offset (the position of
 * the first character of the parsed source region) and an end offset (the position of
 * the first character after the parsed source region).
 */
export type SourceLocation = number[];

/**
 * All AST nodes are represented by `Node` objects.
 * They may have any prototype inheritance but implement the same basic interface.
 *
 * The `type` field is a string representing the AST variant type.
 * Each subtype of Node is documented below with the specific string of its `type` field.
 * You can use this field to determine which interface a node implements.
 */
export type Node = {
  type: string;
  loc?: SourceLocation;
};

/**
 * An identifier. These appear on `CallExpression`, `LambdaExpression`, and `LetExpression`
 * and will always be a static string representing the name of a function call or parameter.
 */
export type Identifier = {
  type: 'Identifier';
  loc?: SourceLocation;
  name: string;
} & Node;

/**
 * An identifier for a range or a name.
 */
export type ReferenceIdentifier = {
  type: 'ReferenceIdentifier';
  loc?: SourceLocation;
  value: string;
  kind: 'name' | 'range' | 'beam' | 'table';
} & Node;

/**
 * A literal token. Captures numbers, strings, and booleans.
 * Literal errors have their own variant type.
 */
export type Literal = {
  type: 'Literal';
  loc?: SourceLocation;
  raw: string;
  value: string | number | boolean;
} & Node;

/**
 * An Error expression.
 */
export type ErrorLiteral = {
  type: 'ErrorLiteral';
  loc?: SourceLocation;
  raw: string;
  value: string;
} & Node;

/**
 * A unary operator expression.
 */
export type UnaryExpression = {
  type: 'UnaryExpression';
  loc?: SourceLocation;
  operator: UnaryOperator;
  arguments: AstExpression[];
} & Node;

/**
 * A unary operator token.
 */
export type UnaryOperator = (
  '+' | '-' | '%' | '#' | '@'
);

/**
 * A binary operator expression.
 */
export type BinaryExpression = {
  type: 'BinaryExpression';
  loc?: SourceLocation;
  operator: BinaryOperator;
  arguments: AstExpression[];
} & Node;

/**
 * A binary operator token.
 *
 * Note that Excels union operator is whitespace so a parser must take care to normalize this to
 * a single space.
 */
export type BinaryOperator = (
  '=' | '<' | '>' | '<=' | '>=' | '<>' |
  '-' | '+' | '*' | '/' | '^' |
  ':' | ' ' | ',' |
  '&'
);

/**
 * A function call expression.
 */
export type CallExpression = {
  type: 'CallExpression';
  loc?: SourceLocation;
  callee: Identifier;
  arguments: AstExpression[];
} & Node;

/**
 * An array expression. Excel does not have empty or sparse arrays and restricts array elements to
 * literals. Google Sheets allows `ReferenceIdentifier`s and `CallExpression`s as elements of
 * arrays, the fx parser has options for this but they are off by default.
 */
export type ArrayExpression = {
  /** The type of this AST node. */
  type: 'ArrayExpression';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The elements of the array. */
  elements: (ReferenceIdentifier | Literal | ErrorLiteral | CallExpression)[][];
} & Node;

/**
 * A LAMBDA expression.
 */
export type LambdaExpression = {
  type: 'LambdaExpression';
  loc?: SourceLocation;
  params: Identifier[];
  body: AstExpression | null;
} & Node;

/**
 * A LET expression.
 */
export type LetExpression = {
  type: 'LetExpression';
  loc?: SourceLocation;
  declarations: LetDeclarator[];
  body: AstExpression | null;
} & Node;

/**
 * A LET parameter declaration.
 */
export type LetDeclarator = {
  type: 'LetDeclarator';
  loc?: SourceLocation;
  id: Identifier;
  init: AstExpression | null;
} & Node;

/**
 * Represent an evaluatable expression.
 */
export type AstExpression =
  ReferenceIdentifier |
  Literal |
  ErrorLiteral |
  UnaryExpression |
  BinaryExpression |
  CallExpression |
  ArrayExpression |
  LambdaExpression |
  LetExpression;
