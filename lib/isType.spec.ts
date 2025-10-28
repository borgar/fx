import { describe, test, expect } from 'vitest';
import {
  REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, REF_STRUCT,
  FX_PREFIX, WHITESPACE, NEWLINE,
  FUNCTION, OPERATOR,
  ERROR, STRING, NUMBER, BOOLEAN
} from './constants.js';
import { isRange, isReference, isLiteral, isError, isWhitespace, isFunction, isFxPrefix, isOperator } from './isType.js';

describe('isRange', () => {
  test('returns false for non-range types', () => {
    expect(isRange(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isRange({})).toBe(false);
    expect(isRange({ type: BOOLEAN })).toBe(false);
    expect(isRange({ type: ERROR })).toBe(false);
    expect(isRange({ type: FUNCTION })).toBe(false);
    expect(isRange({ type: FX_PREFIX })).toBe(false);
    expect(isRange({ type: NEWLINE })).toBe(false);
    expect(isRange({ type: NUMBER })).toBe(false);
    expect(isRange({ type: OPERATOR })).toBe(false);
    expect(isRange({ type: REF_NAMED })).toBe(false);
    expect(isRange({ type: REF_STRUCT })).toBe(false);
    expect(isRange({ type: STRING })).toBe(false);
    expect(isRange({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for range types', () => {
    expect(isRange({ type: REF_BEAM })).toBe(true);
    expect(isRange({ type: REF_RANGE })).toBe(true);
    expect(isRange({ type: REF_TERNARY })).toBe(true);
  });
});

describe('isReference', () => {
  test('returns false for non-reference types', () => {
    expect(isReference(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isReference({})).toBe(false);
    expect(isReference({ type: BOOLEAN })).toBe(false);
    expect(isReference({ type: ERROR })).toBe(false);
    expect(isReference({ type: FUNCTION })).toBe(false);
    expect(isReference({ type: FX_PREFIX })).toBe(false);
    expect(isReference({ type: NEWLINE })).toBe(false);
    expect(isReference({ type: NUMBER })).toBe(false);
    expect(isReference({ type: OPERATOR })).toBe(false);
    expect(isReference({ type: STRING })).toBe(false);
    expect(isReference({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for reference types', () => {
    expect(isReference({ type: REF_BEAM })).toBe(true);
    expect(isReference({ type: REF_NAMED })).toBe(true);
    expect(isReference({ type: REF_RANGE })).toBe(true);
    expect(isReference({ type: REF_STRUCT })).toBe(true);
    expect(isReference({ type: REF_TERNARY })).toBe(true);
  });
});

describe('isLiteral', () => {
  test('returns false for non-literal types', () => {
    expect(isLiteral(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isLiteral({})).toBe(false);
    expect(isLiteral({ type: FUNCTION })).toBe(false);
    expect(isLiteral({ type: FX_PREFIX })).toBe(false);
    expect(isLiteral({ type: NEWLINE })).toBe(false);
    expect(isLiteral({ type: OPERATOR })).toBe(false);
    expect(isLiteral({ type: REF_BEAM })).toBe(false);
    expect(isLiteral({ type: REF_NAMED })).toBe(false);
    expect(isLiteral({ type: REF_RANGE })).toBe(false);
    expect(isLiteral({ type: REF_STRUCT })).toBe(false);
    expect(isLiteral({ type: REF_TERNARY })).toBe(false);
    expect(isLiteral({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for literal types', () => {
    expect(isLiteral({ type: BOOLEAN })).toBe(true);
    expect(isLiteral({ type: ERROR })).toBe(true);
    expect(isLiteral({ type: NUMBER })).toBe(true);
    expect(isLiteral({ type: STRING })).toBe(true);
  });
});

describe('isError', () => {
  test('returns false for non-error types', () => {
    expect(isError(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isError({})).toBe(false);
    expect(isError({ type: BOOLEAN })).toBe(false);
    expect(isError({ type: FUNCTION })).toBe(false);
    expect(isError({ type: FX_PREFIX })).toBe(false);
    expect(isError({ type: NEWLINE })).toBe(false);
    expect(isError({ type: NUMBER })).toBe(false);
    expect(isError({ type: OPERATOR })).toBe(false);
    expect(isError({ type: REF_BEAM })).toBe(false);
    expect(isError({ type: REF_NAMED })).toBe(false);
    expect(isError({ type: REF_RANGE })).toBe(false);
    expect(isError({ type: REF_STRUCT })).toBe(false);
    expect(isError({ type: REF_TERNARY })).toBe(false);
    expect(isError({ type: STRING })).toBe(false);
    expect(isError({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for error type', () => {
    expect(isError({ type: ERROR })).toBe(true);
  });
});

describe('isWhitespace', () => {
  test('returns false for non-whitespace types', () => {
    expect(isWhitespace(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isWhitespace({})).toBe(false);
    expect(isWhitespace({ type: BOOLEAN })).toBe(false);
    expect(isWhitespace({ type: ERROR })).toBe(false);
    expect(isWhitespace({ type: FUNCTION })).toBe(false);
    expect(isWhitespace({ type: FX_PREFIX })).toBe(false);
    expect(isWhitespace({ type: NUMBER })).toBe(false);
    expect(isWhitespace({ type: OPERATOR })).toBe(false);
    expect(isWhitespace({ type: REF_BEAM })).toBe(false);
    expect(isWhitespace({ type: REF_NAMED })).toBe(false);
    expect(isWhitespace({ type: REF_RANGE })).toBe(false);
    expect(isWhitespace({ type: REF_STRUCT })).toBe(false);
    expect(isWhitespace({ type: REF_TERNARY })).toBe(false);
    expect(isWhitespace({ type: STRING })).toBe(false);
  });

  test('returns true for whitespace types', () => {
    expect(isWhitespace({ type: NEWLINE })).toBe(true);
    expect(isWhitespace({ type: WHITESPACE })).toBe(true);
  });
});

describe('isFunction', () => {
  test('returns false for non-function types', () => {
    expect(isFunction(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isFunction({})).toBe(false);
    expect(isFunction({ type: BOOLEAN })).toBe(false);
    expect(isFunction({ type: ERROR })).toBe(false);
    expect(isFunction({ type: FX_PREFIX })).toBe(false);
    expect(isFunction({ type: NEWLINE })).toBe(false);
    expect(isFunction({ type: NUMBER })).toBe(false);
    expect(isFunction({ type: OPERATOR })).toBe(false);
    expect(isFunction({ type: REF_BEAM })).toBe(false);
    expect(isFunction({ type: REF_NAMED })).toBe(false);
    expect(isFunction({ type: REF_RANGE })).toBe(false);
    expect(isFunction({ type: REF_STRUCT })).toBe(false);
    expect(isFunction({ type: REF_TERNARY })).toBe(false);
    expect(isFunction({ type: STRING })).toBe(false);
    expect(isFunction({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for function type', () => {
    expect(isFunction({ type: FUNCTION })).toBe(true);
  });
});

describe('isFxPrefix', () => {
  test('returns false for non-prefix types', () => {
    expect(isFxPrefix(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isFxPrefix({})).toBe(false);
    expect(isFxPrefix({ type: BOOLEAN })).toBe(false);
    expect(isFxPrefix({ type: ERROR })).toBe(false);
    expect(isFxPrefix({ type: FUNCTION })).toBe(false);
    expect(isFxPrefix({ type: NEWLINE })).toBe(false);
    expect(isFxPrefix({ type: NUMBER })).toBe(false);
    expect(isFxPrefix({ type: OPERATOR })).toBe(false);
    expect(isFxPrefix({ type: REF_BEAM })).toBe(false);
    expect(isFxPrefix({ type: REF_NAMED })).toBe(false);
    expect(isFxPrefix({ type: REF_RANGE })).toBe(false);
    expect(isFxPrefix({ type: REF_STRUCT })).toBe(false);
    expect(isFxPrefix({ type: REF_TERNARY })).toBe(false);
    expect(isFxPrefix({ type: STRING })).toBe(false);
    expect(isFxPrefix({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for FX_PREFIX type', () => {
    expect(isFxPrefix({ type: FX_PREFIX })).toBe(true);
  });
});

describe('isOperator', () => {
  test('returns false for non-operator types', () => {
    expect(isOperator(null)).toBe(false);
    // @ts-expect-error -- testing invalid input
    expect(isOperator({})).toBe(false);
    expect(isOperator({ type: BOOLEAN })).toBe(false);
    expect(isOperator({ type: ERROR })).toBe(false);
    expect(isOperator({ type: FUNCTION })).toBe(false);
    expect(isOperator({ type: FX_PREFIX })).toBe(false);
    expect(isOperator({ type: NEWLINE })).toBe(false);
    expect(isOperator({ type: NUMBER })).toBe(false);
    expect(isOperator({ type: REF_BEAM })).toBe(false);
    expect(isOperator({ type: REF_NAMED })).toBe(false);
    expect(isOperator({ type: REF_RANGE })).toBe(false);
    expect(isOperator({ type: REF_STRUCT })).toBe(false);
    expect(isOperator({ type: REF_TERNARY })).toBe(false);
    expect(isOperator({ type: STRING })).toBe(false);
    expect(isOperator({ type: WHITESPACE })).toBe(false);
  });

  test('returns true for operator type', () => {
    expect(isOperator({ type: OPERATOR })).toBe(true);
  });
});
