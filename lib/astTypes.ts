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
  /** The type of this AST node. */
  type: string;
  /** The original source position of the node. */
  loc?: SourceLocation;
};

/**
 * An identifier. These appear on `CallExpression`, `LambdaExpression`, and `LetExpression`
 * and will always be a static string representing the name of a function call or parameter.
 */
export type Identifier = {
  /** The type of this AST node. */
  type: 'Identifier';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The identifying name. */
  name: string;
} & Node;

/**
 * An identifier for a range or a name.
 */
export type ReferenceIdentifier = {
  /** The type of this AST node. */
  type: 'ReferenceIdentifier';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The untouched reference value. */
  value: string;
  /** The kind of reference the value holds. */
  kind: 'name' | 'range' | 'beam' | 'table';
} & Node;

/**
 * A literal token. Captures numbers, strings, and booleans.
 * Literal errors have their own variant type.
 */
export type Literal = {
  /** The type of this AST node. */
  type: 'Literal';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The untouched literal source. */
  raw: string;
  /** The value of the literal. */
  value: string | number | boolean;
} & Node;

/**
 * An Error expression.
 */
export type ErrorLiteral = {
  /** The type of this AST node. */
  type: 'ErrorLiteral';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The untouched literal source. */
  raw: string;
  /** The value of the error. */
  value: string;
} & Node;

/**
 * A unary operator expression.
 */
export type UnaryExpression = {
  /** The type of this AST node. */
  type: 'UnaryExpression';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The expression's operator. */
  operator: UnaryOperator;
  /** The arguments for the operator. */
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
  /** The type of this AST node. */
  type: 'BinaryExpression';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The expression's operator. */
  operator: BinaryOperator;
  /** The arguments for the operator. */
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
  /** The type of this AST node. */
  type: 'CallExpression';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The function being called. */
  callee: Identifier;
  /** The arguments for the function. */
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
  /** The type of this AST node. */
  type: 'LambdaExpression';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The LAMBDA's parameters. */
  params: Identifier[];
  /** The LAMBDA's expression. */
  body: AstExpression | null;
} & Node;

/**
 * A LET expression.
 */
export type LetExpression = {
  /** The type of this AST node. */
  type: 'LetExpression';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The LET's variable declarations. */
  declarations: LetDeclarator[];
  /** The LET's scoped expression. */
  body: AstExpression | null;
} & Node;

/**
 * A LET parameter declaration.
 */
export type LetDeclarator = {
  /** The type of this AST node. */
  type: 'LetDeclarator';
  /** The original source position of the node. */
  loc?: SourceLocation;
  /** The name of the variable. */
  id: Identifier;
  /** The variable's initializing expression. */
  init: AstExpression | null;
} & Node;

/**
 * Represents an evaluate-able expression.
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
