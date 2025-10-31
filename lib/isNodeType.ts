import type {
  Node,
  Identifier,
  ReferenceIdentifier,
  Literal,
  ErrorLiteral,
  UnaryExpression,
  BinaryExpression,
  CallExpression,
  ArrayExpression,
  LambdaExpression,
  LetExpression,
  LetDeclarator,
  AstExpression
} from './astTypes.ts';
import {
  ARRAY,
  BINARY,
  CALL,
  ERROR,
  ERROR_LITERAL,
  IDENTIFIER,
  LAMBDA,
  LET,
  LET_DECL,
  LITERAL,
  REFERENCE,
  UNARY
} from './constants.ts';

/**
 * Determines whether the specified node is an Identifier.
 * @param node An AST node.
 * @returns True if the specified token is an Identifier, False otherwise.
 */
export function isIdentifierNode (node?: Node | null): node is Identifier {
  return node?.type === IDENTIFIER;
}

/**
 * Determines whether the specified node is a ReferenceIdentifier.
 * @param node An AST node.
 * @returns True if the specified token is a ReferenceIdentifier, False otherwise.
 */
export function isReferenceNode (node?: Node | null): node is ReferenceIdentifier {
  return node?.type === REFERENCE;
}

/**
 * Determines whether the specified node is a Literal.
 * @param node An AST node.
 * @returns True if the specified token is a Literal, False otherwise.
 */
export function isLiteralNode (node?: Node | null): node is Literal {
  return node?.type === LITERAL;
}

/**
 * Determines whether the specified node is an ErrorLiteral.
 * @param node An AST node.
 * @returns True if the specified token is an ErrorLiteral, False otherwise.
 */
export function isErrorNode (node?: Node | null): node is ErrorLiteral {
  return node?.type === ERROR_LITERAL;
}

/**
 * Determines whether the specified node is a UnaryExpression.
 * @param node An AST node.
 * @returns True if the specified token is a UnaryExpression, False otherwise.
 */
export function isUnaryNode (node?: Node | null): node is UnaryExpression {
  return node?.type === UNARY;
}

/**
 * Determines whether the specified node is a BinaryExpression.
 * @param node An AST node.
 * @returns True if the specified token is a BinaryExpression, False otherwise.
 */
export function isBinaryNode (node?: Node | null): node is BinaryExpression {
  return node?.type === BINARY;
}

/**
 * Determines whether the specified node is a CallExpression.
 * @param node An AST node.
 * @returns True if the specified token is a CallExpression, False otherwise.
 */
export function isCallNode (node?: Node | null): node is CallExpression {
  return node?.type === CALL;
}

/**
 * Determines whether the specified node is a ArrayExpression.
 * @param node An AST node.
 * @returns True if the specified token is a ArrayExpression, False otherwise.
 */
export function isArrayNode (node?: Node | null): node is ArrayExpression {
  return node?.type === ARRAY;
}

/**
 * Determines whether the specified node is a LambdaExpression.
 * @param node An AST node.
 * @returns True if the specified token is a LambdaExpression, False otherwise.
 */
export function isLambdaNode (node?: Node | null): node is LambdaExpression {
  return node?.type === ARRAY;
}

/**
 * Determines whether the specified node is a LetExpression.
 * @param node An AST node.
 * @returns True if the specified token is a LetExpression, False otherwise.
 */
export function isLetNode (node?: Node | null): node is LetExpression {
  return node?.type === LET;
}

/**
 * Determines whether the specified node is a LetDeclarator.
 * @param node An AST node.
 * @returns True if the specified token is a LetDeclarator, False otherwise.
 */
export function isLetDeclaratorNode (node?: Node | null): node is LetDeclarator {
  return node?.type === LET_DECL;
}

/**
 * Determines whether the specified node is a AstExpression.
 * @param node An AST node.
 * @returns True if the specified token is a AstExpression, False otherwise.
 */
export function isExpressionNode (node?: Node | null): node is AstExpression {
  const type = node?.type;
  if (type) {
    return (
      type === REFERENCE ||
      type === LITERAL ||
      type === ERROR ||
      type === UNARY ||
      type === BINARY ||
      type === CALL ||
      type === ARRAY ||
      type === LAMBDA ||
      type === LET
    );
  }
  return false;
}
