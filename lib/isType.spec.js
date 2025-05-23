import { test } from 'tape';
import {
  REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, REF_STRUCT,
  FX_PREFIX, WHITESPACE, NEWLINE,
  FUNCTION, OPERATOR,
  ERROR, STRING, NUMBER, BOOLEAN
} from './constants.js';
import { isRange, isReference, isLiteral, isError, isWhitespace, isFunction, isFxPrefix, isOperator } from './isType.js';

test('isRange', t => {
  t.is(isRange(null), false, 'null is not a range');
  t.is(isRange({}), false, 'plain object is not a range');
  t.is(isRange({ type: BOOLEAN }), false, 'BOOLEAN is not a range');
  t.is(isRange({ type: ERROR }), false, 'ERROR is not a range');
  t.is(isRange({ type: FUNCTION }), false, 'FUNCTION is not a range');
  t.is(isRange({ type: FX_PREFIX }), false, 'FX_PREFIX is not a range');
  t.is(isRange({ type: NEWLINE }), false, 'NEWLINE is not a range');
  t.is(isRange({ type: NUMBER }), false, 'NUMBER is not a range');
  t.is(isRange({ type: OPERATOR }), false, 'OPERATOR is not a range');
  t.is(isRange({ type: REF_BEAM }), true, 'REF_BEAM is a range');
  t.is(isRange({ type: REF_NAMED }), false, 'REF_NAMED is not a range');
  t.is(isRange({ type: REF_RANGE }), true, 'REF_RANGE is a range');
  t.is(isRange({ type: REF_STRUCT }), false, 'REF_STRUCT is not a range');
  t.is(isRange({ type: REF_TERNARY }), true, 'REF_TERNARY is a range');
  t.is(isRange({ type: STRING }), false, 'STRING is not a range');
  t.is(isRange({ type: WHITESPACE }), false, 'WHITESPACE is not a range');
  t.end();
});

test('isReference', t => {
  t.is(isReference(null), false, 'null is not a reference');
  t.is(isReference({}), false, 'plain object is not a reference');
  t.is(isReference({ type: BOOLEAN }), false, 'BOOLEAN is not a reference');
  t.is(isReference({ type: ERROR }), false, 'ERROR is not a reference');
  t.is(isReference({ type: FUNCTION }), false, 'FUNCTION is not a reference');
  t.is(isReference({ type: FX_PREFIX }), false, 'FX_PREFIX is not a reference');
  t.is(isReference({ type: NEWLINE }), false, 'NEWLINE is not a reference');
  t.is(isReference({ type: NUMBER }), false, 'NUMBER is not a reference');
  t.is(isReference({ type: OPERATOR }), false, 'OPERATOR is not a reference');
  t.is(isReference({ type: REF_BEAM }), true, 'REF_BEAM is a reference');
  t.is(isReference({ type: REF_NAMED }), true, 'REF_NAMED is not a reference');
  t.is(isReference({ type: REF_RANGE }), true, 'REF_RANGE is a reference');
  t.is(isReference({ type: REF_STRUCT }), true, 'REF_STRUCT is not a reference');
  t.is(isReference({ type: REF_TERNARY }), true, 'REF_TERNARY is a reference');
  t.is(isReference({ type: STRING }), false, 'STRING is not a reference');
  t.is(isReference({ type: WHITESPACE }), false, 'WHITESPACE is not a reference');
  t.end();
});

test('isLiteral', t => {
  t.is(isLiteral(null), false, 'null is not a literal');
  t.is(isLiteral({}), false, 'plain object is not a literal');
  t.is(isLiteral({ type: BOOLEAN }), true, 'BOOLEAN is not a literal');
  t.is(isLiteral({ type: ERROR }), true, 'ERROR is not a literal');
  t.is(isLiteral({ type: FUNCTION }), false, 'FUNCTION is not a literal');
  t.is(isLiteral({ type: FX_PREFIX }), false, 'FX_PREFIX is not a literal');
  t.is(isLiteral({ type: NEWLINE }), false, 'NEWLINE is not a literal');
  t.is(isLiteral({ type: NUMBER }), true, 'NUMBER is not a literal');
  t.is(isLiteral({ type: OPERATOR }), false, 'OPERATOR is not a literal');
  t.is(isLiteral({ type: REF_BEAM }), false, 'REF_BEAM is a literal');
  t.is(isLiteral({ type: REF_NAMED }), false, 'REF_NAMED is not a literal');
  t.is(isLiteral({ type: REF_RANGE }), false, 'REF_RANGE is a literal');
  t.is(isLiteral({ type: REF_STRUCT }), false, 'REF_STRUCT is not a literal');
  t.is(isLiteral({ type: REF_TERNARY }), false, 'REF_TERNARY is a literal');
  t.is(isLiteral({ type: STRING }), true, 'STRING is not a literal');
  t.is(isLiteral({ type: WHITESPACE }), false, 'WHITESPACE is not a literal');
  t.end();
});

test('isError', t => {
  t.is(isError(null), false, 'null is not an error');
  t.is(isError({}), false, 'plain object is not an error');
  t.is(isError({ type: BOOLEAN }), false, 'BOOLEAN is not an error');
  t.is(isError({ type: ERROR }), true, 'ERROR is not an error');
  t.is(isError({ type: FUNCTION }), false, 'FUNCTION is not an error');
  t.is(isError({ type: FX_PREFIX }), false, 'FX_PREFIX is not an error');
  t.is(isError({ type: NEWLINE }), false, 'NEWLINE is not an error');
  t.is(isError({ type: NUMBER }), false, 'NUMBER is not an error');
  t.is(isError({ type: OPERATOR }), false, 'OPERATOR is not an error');
  t.is(isError({ type: REF_BEAM }), false, 'REF_BEAM is an error');
  t.is(isError({ type: REF_NAMED }), false, 'REF_NAMED is not an error');
  t.is(isError({ type: REF_RANGE }), false, 'REF_RANGE is an error');
  t.is(isError({ type: REF_STRUCT }), false, 'REF_STRUCT is not an error');
  t.is(isError({ type: REF_TERNARY }), false, 'REF_TERNARY is an error');
  t.is(isError({ type: STRING }), false, 'STRING is not an error');
  t.is(isError({ type: WHITESPACE }), false, 'WHITESPACE is not an error');
  t.end();
});

test('isWhitespace', t => {
  t.is(isWhitespace(null), false, 'null is not a whitespace');
  t.is(isWhitespace({}), false, 'plain object is not a whitespace');
  t.is(isWhitespace({ type: BOOLEAN }), false, 'BOOLEAN is not a whitespace');
  t.is(isWhitespace({ type: ERROR }), false, 'ERROR is not a whitespace');
  t.is(isWhitespace({ type: FUNCTION }), false, 'FUNCTION is not a whitespace');
  t.is(isWhitespace({ type: FX_PREFIX }), false, 'FX_PREFIX is not a whitespace');
  t.is(isWhitespace({ type: NEWLINE }), true, 'NEWLINE is not a whitespace');
  t.is(isWhitespace({ type: NUMBER }), false, 'NUMBER is not a whitespace');
  t.is(isWhitespace({ type: OPERATOR }), false, 'OPERATOR is not a whitespace');
  t.is(isWhitespace({ type: REF_BEAM }), false, 'REF_BEAM is a whitespace');
  t.is(isWhitespace({ type: REF_NAMED }), false, 'REF_NAMED is not a whitespace');
  t.is(isWhitespace({ type: REF_RANGE }), false, 'REF_RANGE is a whitespace');
  t.is(isWhitespace({ type: REF_STRUCT }), false, 'REF_STRUCT is not a whitespace');
  t.is(isWhitespace({ type: REF_TERNARY }), false, 'REF_TERNARY is a whitespace');
  t.is(isWhitespace({ type: STRING }), false, 'STRING is not a whitespace');
  t.is(isWhitespace({ type: WHITESPACE }), true, 'WHITESPACE is not a whitespace');
  t.end();
});

test('isFunction', t => {
  t.is(isFunction(null), false, 'null is not a function');
  t.is(isFunction({}), false, 'plain object is not a function');
  t.is(isFunction({ type: BOOLEAN }), false, 'BOOLEAN is not a function');
  t.is(isFunction({ type: ERROR }), false, 'ERROR is not a function');
  t.is(isFunction({ type: FUNCTION }), true, 'FUNCTION is not a function');
  t.is(isFunction({ type: FX_PREFIX }), false, 'FX_PREFIX is not a function');
  t.is(isFunction({ type: NEWLINE }), false, 'NEWLINE is not a function');
  t.is(isFunction({ type: NUMBER }), false, 'NUMBER is not a function');
  t.is(isFunction({ type: OPERATOR }), false, 'OPERATOR is not a function');
  t.is(isFunction({ type: REF_BEAM }), false, 'REF_BEAM is a function');
  t.is(isFunction({ type: REF_NAMED }), false, 'REF_NAMED is not a function');
  t.is(isFunction({ type: REF_RANGE }), false, 'REF_RANGE is a function');
  t.is(isFunction({ type: REF_STRUCT }), false, 'REF_STRUCT is not a function');
  t.is(isFunction({ type: REF_TERNARY }), false, 'REF_TERNARY is a function');
  t.is(isFunction({ type: STRING }), false, 'STRING is not a function');
  t.is(isFunction({ type: WHITESPACE }), false, 'WHITESPACE is not a function');
  t.end();
});

test('isFxPrefix', t => {
  t.is(isFxPrefix(null), false, 'null is not a prefix');
  t.is(isFxPrefix({}), false, 'plain object is not a prefix');
  t.is(isFxPrefix({ type: BOOLEAN }), false, 'BOOLEAN is not a prefix');
  t.is(isFxPrefix({ type: ERROR }), false, 'ERROR is not a prefix');
  t.is(isFxPrefix({ type: FUNCTION }), false, 'FUNCTION is not a prefix');
  t.is(isFxPrefix({ type: FX_PREFIX }), true, 'FX_PREFIX is not a prefix');
  t.is(isFxPrefix({ type: NEWLINE }), false, 'NEWLINE is not a prefix');
  t.is(isFxPrefix({ type: NUMBER }), false, 'NUMBER is not a prefix');
  t.is(isFxPrefix({ type: OPERATOR }), false, 'OPERATOR is not a prefix');
  t.is(isFxPrefix({ type: REF_BEAM }), false, 'REF_BEAM is a prefix');
  t.is(isFxPrefix({ type: REF_NAMED }), false, 'REF_NAMED is not a prefix');
  t.is(isFxPrefix({ type: REF_RANGE }), false, 'REF_RANGE is a prefix');
  t.is(isFxPrefix({ type: REF_STRUCT }), false, 'REF_STRUCT is not a prefix');
  t.is(isFxPrefix({ type: REF_TERNARY }), false, 'REF_TERNARY is a prefix');
  t.is(isFxPrefix({ type: STRING }), false, 'STRING is not a prefix');
  t.is(isFxPrefix({ type: WHITESPACE }), false, 'WHITESPACE is not a prefix');
  t.end();
});

test('isOperator', t => {
  t.is(isOperator(null), false, 'null is not a operator');
  t.is(isOperator({}), false, 'plain object is not a operator');
  t.is(isOperator({ type: BOOLEAN }), false, 'BOOLEAN is not a operator');
  t.is(isOperator({ type: ERROR }), false, 'ERROR is not a operator');
  t.is(isOperator({ type: FUNCTION }), false, 'FUNCTION is not a operator');
  t.is(isOperator({ type: FX_PREFIX }), false, 'FX_PREFIX is not a operator');
  t.is(isOperator({ type: NEWLINE }), false, 'NEWLINE is not a operator');
  t.is(isOperator({ type: NUMBER }), false, 'NUMBER is not a operator');
  t.is(isOperator({ type: OPERATOR }), true, 'OPERATOR is not a operator');
  t.is(isOperator({ type: REF_BEAM }), false, 'REF_BEAM is a operator');
  t.is(isOperator({ type: REF_NAMED }), false, 'REF_NAMED is not a operator');
  t.is(isOperator({ type: REF_RANGE }), false, 'REF_RANGE is a operator');
  t.is(isOperator({ type: REF_STRUCT }), false, 'REF_STRUCT is not a operator');
  t.is(isOperator({ type: REF_TERNARY }), false, 'REF_TERNARY is a operator');
  t.is(isOperator({ type: STRING }), false, 'STRING is not a operator');
  t.is(isOperator({ type: WHITESPACE }), false, 'WHITESPACE is not a operator');
  t.end();
});
