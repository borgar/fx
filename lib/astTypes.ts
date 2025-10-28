export type SourceLocation = number[];

export type Node = {
  type: string;
  loc?: SourceLocation;
};

export type Identifier = {
  type: 'Identifier';
  loc?: SourceLocation;
  name: string;
} & Node;

export type ReferenceIdentifier = {
  type: 'ReferenceIdentifier';
  loc?: SourceLocation;
  value: string;
  kind: 'name' | 'range' | 'beam' | 'table';
} & Node;

export type Literal = {
  type: 'Literal';
  loc?: SourceLocation;
  raw: string;
  value: string | number | boolean;
} & Node;

export type ErrorLiteral = {
  type: 'ErrorLiteral';
  loc?: SourceLocation;
  raw: string;
  value: string;
} & Node;

export type UnaryExpression = {
  type: 'UnaryExpression';
  loc?: SourceLocation;
  operator: '+' | '-' | '%' | '#' | '@';
  arguments: AstExpression[];
} & Node;

export type BinaryExpression = {
  type: 'BinaryExpression';
  loc?: SourceLocation;
  operator: '=' | '<' | '>' | '<=' | '>=' | '<>' | '-' | '+' | '*' | '/' | '^' | ':' | ' ' | ',' | '&';
  arguments: AstExpression[];
} & Node;

export type CallExpression = {
  type: 'CallExpression';
  loc?: SourceLocation;
  callee: Identifier;
  arguments: AstExpression[];
} & Node;

export type ArrayExpression = {
  type: 'ArrayExpression';
  loc?: SourceLocation;
  elements: (ReferenceIdentifier | Literal | ErrorLiteral | CallExpression)[][];
} & Node;

export type LambdaExpression = {
  type: 'LambdaExpression';
  loc?: SourceLocation;
  params: Identifier[];
  body: AstExpression | null;
} & Node;

export type LetExpression = {
  type: 'LetExpression';
  loc?: SourceLocation;
  declarations: LetDeclarator[];
  body: AstExpression | null;
} & Node;

export type LetDeclarator = {
  type: 'LetDeclarator';
  loc?: SourceLocation;
  id: Identifier;
  init: AstExpression | null;
} & Node;

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
