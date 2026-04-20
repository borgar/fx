import { describe, test, expect } from 'vitest';
import {
  ARRAY,
  BINARY,
  CALL,
  ERROR_LITERAL,
  IDENTIFIER,
  LAMBDA,
  LET,
  LET_DECL,
  LITERAL,
  REFERENCE,
  UNARY
} from './constants.ts';
import type { Node } from './astTypes.ts';
import {
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

const ALL_NODE_TYPES = [
  ARRAY,
  BINARY,
  CALL,
  ERROR_LITERAL,
  IDENTIFIER,
  LAMBDA,
  LET,
  LET_DECL,
  LITERAL,
  REFERENCE,
  UNARY
] as const;

/**
 * Inputs that a `is*Node` guard must reject: `null`, `undefined`, `{}`, and
 * nodes of every type except the one the guard under test accepts.
 */
function allExcept (nodeType: string): readonly (Node | null | undefined)[] {
  return [
    null,
    undefined,
    // @ts-expect-error -- testing invalid input
    {},
    ...ALL_NODE_TYPES.filter(t => t !== nodeType).map(type => ({ type }))
  ];
}

describe('isIdentifierNode', () => {
  test('returns true only for Identifier nodes', () => {
    expect(isIdentifierNode({ type: IDENTIFIER })).toBe(true);
  });

  test('returns false for non-Identifier inputs', () => {
    for (const input of allExcept(IDENTIFIER)) {
      expect(isIdentifierNode(input)).toBe(false);
    }
  });
});

describe('isReferenceNode', () => {
  test('returns true only for ReferenceIdentifier nodes', () => {
    expect(isReferenceNode({ type: REFERENCE })).toBe(true);
  });

  test('returns false for non-ReferenceIdentifier inputs', () => {
    for (const input of allExcept(REFERENCE)) {
      expect(isReferenceNode(input)).toBe(false);
    }
  });
});

describe('isLiteralNode', () => {
  test('returns true only for Literal nodes', () => {
    expect(isLiteralNode({ type: LITERAL })).toBe(true);
  });

  test('returns false for non-Literal inputs', () => {
    for (const input of allExcept(LITERAL)) {
      expect(isLiteralNode(input)).toBe(false);
    }
  });
});

describe('isErrorNode', () => {
  test('returns true only for ErrorLiteral nodes', () => {
    expect(isErrorNode({ type: ERROR_LITERAL })).toBe(true);
  });

  test('returns false for non-ErrorLiteral inputs', () => {
    for (const input of allExcept(ERROR_LITERAL)) {
      expect(isErrorNode(input)).toBe(false);
    }
  });
});

describe('isUnaryNode', () => {
  test('returns true only for UnaryExpression nodes', () => {
    expect(isUnaryNode({ type: UNARY })).toBe(true);
  });

  test('returns false for non-UnaryExpression inputs', () => {
    for (const input of allExcept(UNARY)) {
      expect(isUnaryNode(input)).toBe(false);
    }
  });
});

describe('isBinaryNode', () => {
  test('returns true only for BinaryExpression nodes', () => {
    expect(isBinaryNode({ type: BINARY })).toBe(true);
  });

  test('returns false for non-BinaryExpression inputs', () => {
    for (const input of allExcept(BINARY)) {
      expect(isBinaryNode(input)).toBe(false);
    }
  });
});

describe('isCallNode', () => {
  test('returns true only for CallExpression nodes', () => {
    expect(isCallNode({ type: CALL })).toBe(true);
  });

  test('returns false for non-CallExpression inputs', () => {
    for (const input of allExcept(CALL)) {
      expect(isCallNode(input)).toBe(false);
    }
  });
});

describe('isArrayNode', () => {
  test('returns true only for ArrayExpression nodes', () => {
    expect(isArrayNode({ type: ARRAY })).toBe(true);
  });

  test('returns false for non-ArrayExpression inputs', () => {
    for (const input of allExcept(ARRAY)) {
      expect(isArrayNode(input)).toBe(false);
    }
  });
});

describe('isLambdaNode', () => {
  test('returns true only for LambdaExpression nodes', () => {
    expect(isLambdaNode({ type: LAMBDA })).toBe(true);
  });

  test('returns false for non-LambdaExpression inputs', () => {
    for (const input of allExcept(LAMBDA)) {
      expect(isLambdaNode(input)).toBe(false);
    }
  });
});

describe('isLetNode', () => {
  test('returns true only for LetExpression nodes', () => {
    expect(isLetNode({ type: LET })).toBe(true);
  });

  test('returns false for non-LetExpression inputs', () => {
    for (const input of allExcept(LET)) {
      expect(isLetNode(input)).toBe(false);
    }
  });
});

describe('isLetDeclaratorNode', () => {
  test('returns true only for LetDeclarator nodes', () => {
    expect(isLetDeclaratorNode({ type: LET_DECL })).toBe(true);
  });

  test('returns false for non-LetDeclarator inputs', () => {
    for (const input of allExcept(LET_DECL)) {
      expect(isLetDeclaratorNode(input)).toBe(false);
    }
  });
});

describe('isExpressionNode', () => {
  // An AstExpression is any of: ReferenceIdentifier, Literal, ErrorLiteral,
  // UnaryExpression, BinaryExpression, CallExpression, ArrayExpression,
  // LambdaExpression, LetExpression. Identifier and LetDeclarator are not
  // expressions on their own.
  const EXPRESSION_TYPES = [
    REFERENCE,
    LITERAL,
    ERROR_LITERAL,
    UNARY,
    BINARY,
    CALL,
    ARRAY,
    LAMBDA,
    LET
  ] as const;
  const NON_EXPRESSION_TYPES = [ IDENTIFIER, LET_DECL ] as const;

  test('returns true for every expression node type', () => {
    for (const t of EXPRESSION_TYPES) {
      expect(isExpressionNode({ type: t })).toBe(true);
    }
  });

  test('returns false for null, undefined, and non-expression node types', () => {
    expect(isExpressionNode(null)).toBe(false);
    expect(isExpressionNode(undefined)).toBe(false);
    for (const t of NON_EXPRESSION_TYPES) {
      expect(isExpressionNode({ type: t })).toBe(false);
    }
  });
});
