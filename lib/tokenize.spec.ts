import { describe, test, expect } from 'vitest';
import {
  FX_PREFIX, UNKNOWN,
  OPERATOR, BOOLEAN, ERROR, NUMBER, FUNCTION, WHITESPACE, STRING,
  REF_RANGE, REF_BEAM, REF_NAMED, REF_STRUCT, REF_TERNARY, CONTEXT, CONTEXT_QUOTE, NEWLINE
} from './constants.ts';
import { tokenize, tokenizeXlsx } from './tokenize.ts';

function isTokens (expr: string, result: any[], opts?: any) {
  expect(tokenize(expr, { negativeNumbers: false, ...opts })).toEqual(result);
}

function isTokensNeg (expr: string, result: any[], opts?: any) {
  expect(tokenize(expr, { ...opts, negativeNumbers: true })).toEqual(result);
}

describe('lexer', () => {
  describe('operators', () => {
    test('basic comparison operators', () => {
      isTokens('=1>1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '>' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1>=1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '>=' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1=1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '=' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1<>1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '<>' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1<=1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '<=' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1<1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '<' },
        { type: NUMBER, value: '1' }
      ]);
    });

    test('arithmetic operators', () => {
      isTokens('=1+1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1-1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1*1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '*' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1/1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '/' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1^1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '^' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=1&1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '&' },
        { type: NUMBER, value: '1' }
      ]);
    });

    test('string equality and references', () => {
      isTokens('="A"="B"', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"A"' },
        { type: OPERATOR, value: '=' },
        { type: STRING, value: '"B"' }
      ]);
      isTokens('=A1:INDIRECT("B2",TRUE)', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: FUNCTION, value: 'INDIRECT' },
        { type: OPERATOR, value: '(' },
        { type: STRING, value: '"B2"' },
        { type: OPERATOR, value: ',' },
        { type: BOOLEAN, value: 'TRUE' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('percentage and sheet references', () => {
      isTokens('=123%', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '123' },
        { type: OPERATOR, value: '%' }
      ]);
      isTokens('=Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      isTokens('=Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Sheet1!A1' }
      ]);
    });

    test('range union and intersection', () => {
      isTokens('=(A1:C1,A2:C2)', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'C1' },
        { type: OPERATOR, value: ',' },
        { type: REF_RANGE, value: 'A2' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'C2' },
        { type: OPERATOR, value: ')' }
      ], { mergeRefs: false });
      isTokens('=(A1:C1,A2:C2)', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: 'A1:C1' },
        { type: OPERATOR, value: ',' },
        { type: REF_RANGE, value: 'A2:C2' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=(A1:C1 A2:C2)', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: 'A1:C1' },
        { type: WHITESPACE, value: ' ' }, // INTERSECT
        { type: REF_RANGE, value: 'A2:C2' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=(A1:C1  A2:C2)', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: 'A1:C1' },
        { type: WHITESPACE, value: '  ' }, // INTERSECT
        { type: REF_RANGE, value: 'A2:C2' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('array literals', () => {
      isTokens('={1,2,3}', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '3' },
        { type: OPERATOR, value: '}' }
      ]);
      isTokens('={1;2;3}', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ';' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ';' },
        { type: NUMBER, value: '3' },
        { type: OPERATOR, value: '}' }
      ]);
      isTokens('={1,2;3}', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ';' },
        { type: NUMBER, value: '3' },
        { type: OPERATOR, value: '}' }
      ]);
      isTokens('={"A",33;TRUE,123}', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: STRING, value: '"A"' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '33' },
        { type: OPERATOR, value: ';' },
        { type: BOOLEAN, value: 'TRUE' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '123' },
        { type: OPERATOR, value: '}' }
      ]);
      isTokens('={A1:B2}', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: REF_RANGE, value: 'A1:B2' },
        { type: OPERATOR, value: '}' }
      ]);
      isTokens('={A1:B2,C3:D4}', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: REF_RANGE, value: 'A1:B2' },
        { type: OPERATOR, value: ',' },
        { type: REF_RANGE, value: 'C3:D4' },
        { type: OPERATOR, value: '}' }
      ]);
    });
  });

  describe('functions', () => {
    test('simple functions', () => {
      isTokens('=TODAY()', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'TODAY' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=ToDaY()', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'ToDaY' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=SUM(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=N()', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'N' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('boolean functions', () => {
      isTokens('=TRUE()', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'TRUE' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=FALSE()', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'FALSE' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('implicit intersection operator', () => {
      isTokens('=@SUM(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '@' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('function with arguments and whitespace', () => {
      isTokens('=SUM(1, 2)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ',' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=SUM(1, SUM(2, 3))', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ',' },
        { type: WHITESPACE, value: ' ' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ',' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '3' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('special function names', () => {
      isTokens('=INDIRECT("A1",TRUE)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'INDIRECT' },
        { type: OPERATOR, value: '(' },
        { type: STRING, value: '"A1"' },
        { type: OPERATOR, value: ',' },
        { type: BOOLEAN, value: 'TRUE' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=BINOM.DIST.REF_RANGE(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'BINOM.DIST.REF_RANGE' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=OCT2BIN(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'OCT2BIN' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=TEST_FUNC(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'TEST_FUNC' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=_xlfn.FOO(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: '_xlfn.FOO' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=_FOO(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: '_FOO' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('named range vs function disambiguation', () => {
      isTokens('=\\FOO(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '\\FOO' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=9FOO(1)', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '9' },
        { type: FUNCTION, value: 'FOO' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
    });
  });

  describe('numbers', () => {
    test('integers', () => {
      isTokens('=0', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '0' }
      ]);
      isTokens('=+0', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '0' }
      ]);
      isTokens('=+1', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '1' }
      ]);
      isTokens('=-0', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '0' }
      ]);
      isTokens('=1123', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1123' }
      ]);
      isTokens('=-1123', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1123' }
      ]);
    });

    test('decimals', () => {
      isTokens('=1.5', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1.5' }
      ]);
      isTokens('=-1.5', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1.5' }
      ]);
      isTokens('=1234.5678', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1234.5678' }
      ]);
      isTokens('=-1234.5678', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1234.5678' }
      ]);
    });

    test('scientific notation', () => {
      isTokens('=1E-1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1E-1' }
      ]);
      isTokens('=1.5E-10', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1.5E-10' }
      ]);
      isTokens('=1.55E+100', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1.55E+100' }
      ]);
      isTokens('=1.55e+100', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1.55e+100' }
      ]);
    });
  });

  describe('negative numbers', () => {
    test('basic negative numbers', () => {
      isTokensNeg('=-0', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '-0' }
      ]);
      isTokensNeg('=-1123', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '-1123' }
      ]);
      isTokensNeg('=-1.5', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '-1.5' }
      ]);
      isTokensNeg('=-1234.5678', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '-1234.5678' }
      ]);
    });

    test('negative scientific notation', () => {
      isTokensNeg('=1E-1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1E-1' }
      ]);
      isTokensNeg('=-1E-1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '-1E-1' }
      ]);
      isTokensNeg('=1.5E-10', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1.5E-10' }
      ]);
      isTokensNeg('=-1.5E-10', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '-1.5E-10' }
      ]);
      isTokensNeg('-1', [
        { type: NUMBER, value: '-1' }
      ]);
    });

    test('negative number context sensitivity', () => {
      isTokensNeg('=1-1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('1--1', [
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '-1' }
      ]);
      isTokensNeg('1 - -1', [
        { type: NUMBER, value: '1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '-1' }
      ]);
      isTokensNeg('1 - - 1', [
        { type: NUMBER, value: '1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '1' }
      ]);
    });

    test('negative numbers with newlines', () => {
      isTokensNeg('1 \n  - \n  -1', [
        { type: NUMBER, value: '1' },
        { type: WHITESPACE, value: ' ' },
        { type: NEWLINE, value: '\n' },
        { type: WHITESPACE, value: '  ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: ' ' },
        { type: NEWLINE, value: '\n' },
        { type: WHITESPACE, value: '  ' },
        { type: NUMBER, value: '-1' }
      ]);
    });

    test('negative numbers in parentheses', () => {
      isTokensNeg('-(-1)', [
        { type: OPERATOR, value: '-' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '-1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokensNeg('-( -1 )', [
        { type: OPERATOR, value: '-' },
        { type: OPERATOR, value: '(' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '-1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('negative numbers after other tokens', () => {
      isTokensNeg('=true-1', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'true' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=true -1', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'true' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=true - 1', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'true' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=#VALUE!-1', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#VALUE!' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=#VALUE! -1', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#VALUE!' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
    });

    test('negative numbers with functions and references', () => {
      isTokensNeg('=SUM(-1) -1', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '-1' },
        { type: OPERATOR, value: ')' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=SUM( -1)-1', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '-1' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=A1-1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=A1 -1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=foo-1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'foo' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=foo -1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'foo' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('="true"-1', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"true"' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('="true" -1', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"true"' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
    });

    test('negative numbers with complex expressions', () => {
      isTokensNeg('=SUM(1)-1', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('={1, 2, 3}-4', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '{' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ',' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ',' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '3' },
        { type: OPERATOR, value: '}' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '4' }
      ]);
      isTokensNeg('=10%-1', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '10' },
        { type: OPERATOR, value: '%' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
      isTokensNeg('=A1#-1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: '#' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' }
      ]);
    });
  });

  describe('simple equations', () => {
    test('basic arithmetic with spacing', () => {
      isTokens('=1 + 2', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '+' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '2' }
      ]);
      isTokens('=1+2', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '2' }
      ]);
      isTokens('=1.1+2.2', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1.1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '2.2' }
      ]);
    });

    test('parentheses and operator precedence', () => {
      isTokens('=(1 + 2) - 3', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '+' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ')' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '3' }
      ]);
      isTokens('    =     (     1.1+2  )   -       3  ', [
        { type: WHITESPACE, value: '    ' },
        { type: OPERATOR, value: '=' }, // FX_PREFIX?
        { type: WHITESPACE, value: '     ' },
        { type: OPERATOR, value: '(' },
        { type: WHITESPACE, value: '     ' },
        { type: NUMBER, value: '1.1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '2' },
        { type: WHITESPACE, value: '  ' },
        { type: OPERATOR, value: ')' },
        { type: WHITESPACE, value: '   ' },
        { type: OPERATOR, value: '-' },
        { type: WHITESPACE, value: '       ' },
        { type: NUMBER, value: '3' },
        { type: WHITESPACE, value: '  ' }
      ]);
    });

    test('multiplication and formula prefix', () => {
      isTokens('=1+2*3', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: '*' },
        { type: NUMBER, value: '3' }
      ]);
      isTokens('= 1+2*3', [
        { type: FX_PREFIX, value: '=' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: '*' },
        { type: NUMBER, value: '3' }
      ]);
    });

    test('percentage operator', () => {
      isTokens('=1%', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '%' }
      ]);
      isTokens('=-1%', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '-' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: '%' }
      ]);
      isTokens('=-(1 + 2)%', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '-' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '+' },
        { type: WHITESPACE, value: ' ' },
        { type: NUMBER, value: '2' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '%' }
      ]);
    });
  });

  describe('R1C1 style references', () => {
    test('basic row and column references', () => {
      isTokens('=R', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R' }
      ], { r1c1: true });
      isTokens('=R:R', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R:R' }
      ], { r1c1: true });

      isTokens('=R1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R1' }
      ], { r1c1: true });
      isTokens('=R1:R1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R1:R1' }
      ], { r1c1: true });

      isTokens('=C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C' }
      ], { r1c1: true });
      isTokens('=C:C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C:C' }
      ], { r1c1: true });

      isTokens('=C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C1' }
      ], { r1c1: true });
      isTokens('=C1:C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C1:C1' }
      ], { r1c1: true });
    });

    test('relative references with brackets', () => {
      isTokens('=R[1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R[1]' }
      ], { r1c1: true });
      isTokens('=R[1]:R[1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R[1]:R[1]' }
      ], { r1c1: true });

      isTokens('=R[-1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R[-1]' }
      ], { r1c1: true });
      isTokens('=R[-1]:R[-1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R[-1]:R[-1]' }
      ], { r1c1: true });

      isTokens('=C[1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C[1]' }
      ], { r1c1: true });
      isTokens('=C[1]:C[1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C[1]:C[1]' }
      ], { r1c1: true });

      isTokens('=C[-1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C[-1]' }
      ], { r1c1: true });
      isTokens('=C[-1]:C[-1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C[-1]:C[-1]' }
      ], { r1c1: true });
    });

    test('cell references', () => {
      isTokens('=RC', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC' }
      ], { r1c1: true });
      isTokens('=RC:RC', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC:RC' }
      ], { r1c1: true });

      isTokens('=R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R1C1' }
      ], { r1c1: true });
      isTokens('=R1C1:R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R1C1:R1C1' }
      ], { r1c1: true });
    });

    test('mixed absolute and relative references', () => {
      isTokens('=R[2]C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[2]C' }
      ], { r1c1: true });
      isTokens('=R[2]C:R[2]C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[2]C:R[2]C' }
      ], { r1c1: true });

      isTokens('=R[-2]C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[-2]C' }
      ], { r1c1: true });
      isTokens('=R[-2]C:R[-2]C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[-2]C:R[-2]C' }
      ], { r1c1: true });

      isTokens('=RC[3]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC[3]' }
      ], { r1c1: true });
      isTokens('=RC[3]:RC[3]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC[3]:RC[3]' }
      ], { r1c1: true });

      isTokens('=RC[-3]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC[-3]' }
      ], { r1c1: true });
      isTokens('=RC[-3]:RC[-3]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC[-3]:RC[-3]' }
      ], { r1c1: true });
    });

    test('complex relative references', () => {
      isTokens('=R[2]C[2]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[2]C[2]' }
      ], { r1c1: true });
      isTokens('=R[2]C[2]:R[2]C[2]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[2]C[2]:R[2]C[2]' }
      ], { r1c1: true });

      isTokens('=R[-2]C[-2]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[-2]C[-2]' }
      ], { r1c1: true });
      isTokens('=R[-2]C[-2]:R[-1]C[-1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[-2]C[-2]:R[-1]C[-1]' }
      ], { r1c1: true });
    });

    test('external references', () => {
      isTokens('=[filename]Sheetname!R[-2]C:R[-1]C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[filename]Sheetname!R[-2]C:R[-1]C' }
      ], { r1c1: true });

      isTokens('=[filename]Sheetname!R[-2]C:R[-1]C', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: '[filename]Sheetname' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'R[-2]C' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'R[-1]C' }
      ], { mergeRefs: false, r1c1: true });
    });

    test('ranges and mixed types', () => {
      isTokens('=R[-2]C[-2]:R[-1]C[-1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R[-2]C[-2]:R[-1]C[-1]' }
      ], { r1c1: true });
      isTokens('=R[-2]:R1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R[-2]:R1' }
      ], { r1c1: true });
    });

    test('incompatible range combinations', () => {
      isTokens('=R:C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R' },
        { type: OPERATOR, value: ':' },
        { type: REF_BEAM, value: 'C' }
      ], { r1c1: true });
      isTokens('=C[1]:R[-2]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C[1]' },
        { type: OPERATOR, value: ':' },
        { type: REF_BEAM, value: 'R[-2]' }
      ], { r1c1: true });
      isTokens('=R1:RC', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'RC' }
      ], { r1c1: true });
      isTokens('=RC:C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC' },
        { type: OPERATOR, value: ':' },
        { type: REF_BEAM, value: 'C1' }
      ], { r1c1: true });
    });
  });

  describe('A1 style references', () => {
    test('basic cell references', () => {
      isTokens('=A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' }
      ]);

      isTokens('=C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C1' }
      ]);

      isTokens('=R1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R1' }
      ]);
    });

    test('absolute references', () => {
      isTokens('=$A$1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '$A$1' }
      ]);

      isTokens('=A$1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A$1' }
      ]);

      isTokens('=$A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '$A1' }
      ]);
    });

    test('ranges', () => {
      isTokens('=A10:A20', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A10:A20' }
      ]);

      isTokens('=A10:E20', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A10:E20' }
      ]);

      isTokens('=A1:C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1:C1' }
      ]);

      isTokens('=A1:C1:D1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1:C1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'D1' }
      ]);
    });

    test('spill range syntax', () => {
      isTokens('=A10.:A20', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A10.:A20' }
      ]);

      isTokens('=A10:.A20', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A10:.A20' }
      ]);

      isTokens('=A10.:.A20', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A10.:.A20' }
      ]);
    });

    test('row and column references', () => {
      isTokens('=5:5', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: '5:5' }
      ]);

      isTokens('=A:A', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'A:A' }
      ]);

      isTokens('=$A:$A', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: '$A:$A' }
      ]);

      isTokens('=1:5', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: '1:5' }
      ]);

      isTokens('=A:E', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'A:E' }
      ]);

      isTokens('=$1:$5', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: '$1:$5' }
      ]);

      isTokens('=$A:$E', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: '$A:$E' }
      ]);
    });

    test('sheet references', () => {
      isTokens('=Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      isTokens('=Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Sheet1!A1' }
      ]);

      isTokens('=Sheet1!A1:B2', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
      isTokens('=Sheet1!A1:B2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Sheet1!A1:B2' }
      ]);
    });

    test('sheet names above the character table', () => {
      // The table of sheet-name characters stops at U+00B4, past which every character is allowed
      // wherever a high one is. The mask has to be read off the character in hand: reading it off
      // the name's first character instead let every character after a high one pass, swallowing
      // the "!" and the range behind it into a single name token.
      isTokens('=Ærið!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Ærið' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      isTokens('=´!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: '´' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      isTokens('=Ærið!A1+1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Ærið!A1' },
        { type: OPERATOR, value: '+' },
        { type: NUMBER, value: '1' }
      ]);
    });

    test('a sheet name holding a "." is not a range and a stray dot', () => {
      // "." is the one character a sheet name may contain that a range is also allowed to end on,
      // so a range lexer would otherwise stop part-way through one: the "v1" of "v1.0" is no cell
      isTokens('=v1.0!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'v1.0' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      isTokens('=a1.b!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'a1.b!A1' }
      ]);
      isTokens('=C.!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C.!A1' }
      ]);
    });

    test('quoted sheet names', () => {
      isTokens("='Sheets'' name'!A1:B2", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'Sheets'' name'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });

      isTokens("='Run forest, run!'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '\'Run forest, run!\'!A1' }
      ]);

      isTokens("='Run forest, run!'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'Run forest, run!'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });

      isTokens("='foo'''!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'foo'''!A1" }
      ]);

      isTokens("='foo'''!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'foo'''" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });

      isTokens("='foo'''''!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'foo'''''!A1" }
      ]);

      isTokens("='foo'''''!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'foo'''''" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
    });

    test('external workbook references', () => {
      isTokens('=[filename]Sheetname!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[filename]Sheetname!A1' }
      ]);

      isTokens('=[filename]Sheetname!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: '[filename]Sheetname' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });

      isTokens("='[filename]Sheets'' name'!A1:B2", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[filename]Sheets'' name'!A1:B2" }
      ]);

      isTokens("='[filename]Sheets'' name'!A1:B2", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'[filename]Sheets'' name'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });

      isTokens('=[15]Sheet32!X4', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[15]Sheet32!X4' }
      ]);

      isTokens('=[15]Sheet32!X4', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: '[15]Sheet32' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'X4' }
      ], { mergeRefs: false });
    });

    test('illegal syntax handling', () => {
      isTokens('=[15]!named', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '[' },
        { type: NUMBER, value: '15' },
        { type: UNKNOWN, value: ']' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'named' }
      ]);

      isTokens('=filename!named', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'filename!named' }
      ]);
      isTokens('=filename!named', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'filename' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'named' }
      ], { mergeRefs: false });
    });

    test('maximum reference bounds', () => {
      isTokens('=XFD1048576', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'XFD1048576' }
      ]);
      isTokens('=XFD1048577', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'XFD1048577' }
      ]);
      isTokens('=XFE1048577', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'XFE1048577' }
      ]);
      isTokens('=pensioneligibilitypartner1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'pensioneligibilitypartner1' }
      ]);
    });

    test('file path references', () => {
      isTokens("='D:\\Reports\\Sales.xlsx'!namedrange", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'D:\\Reports\\Sales.xlsx'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'namedrange' }
      ], { mergeRefs: false });
      isTokens("='D:\\Reports\\Sales.xlsx'!namedrange", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: "'D:\\Reports\\Sales.xlsx'!namedrange" }
      ]);

      isTokens('=Sales.xlsx!namedrange', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sales.xlsx' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'namedrange' }
      ], { mergeRefs: false });
      isTokens('=Sales.xlsx!namedrange', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Sales.xlsx!namedrange' }
      ]);
    });

    test('column and row beam references with sheets', () => {
      isTokens('=Sheet1!A:A', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'Sheet1!A:A' }
      ]);
      isTokens('=Sheet1!A:A', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_BEAM, value: 'A:A' }
      ], { mergeRefs: false });

      isTokens('=Sheet1!A:A:B:B', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'Sheet1!A:A' },
        { type: OPERATOR, value: ':' },
        { type: REF_BEAM, value: 'B:B' }
      ]);
      isTokens('=Sheet1!A:A:B:B', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_BEAM, value: 'A:A' },
        { type: OPERATOR, value: ':' },
        { type: REF_BEAM, value: 'B:B' }
      ], { mergeRefs: false });

      isTokens('=Sheet1!A.:.A:B.:.B', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_BEAM, value: 'A.:.A' },
        { type: OPERATOR, value: ':' },
        { type: REF_BEAM, value: 'B.:.B' }
      ], { mergeRefs: false });
    });

    test('error references', () => {
      isTokens('=Sheet1!#REF!:A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: ERROR, value: '#REF!' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'A1' }
      ]);
    });
  });

  describe('errors', () => {
    test('standard errors', () => {
      isTokens('=#NAME?', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#NAME?' }
      ]);
      isTokens('=#VALUE!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#VALUE!' }
      ]);
      isTokens('=#REF!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#REF!' }
      ]);
      isTokens('=#DIV/0!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#DIV/0!' }
      ]);
      isTokens('=#NULL!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#NULL!' }
      ]);
      isTokens('=#NUM!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#NUM!' }
      ]);
      isTokens('=#N/A', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#N/A' }
      ]);
    });

    test('dynamic array and advanced errors', () => {
      isTokens('=#GETTING_DATA', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#GETTING_DATA' }
      ]);
      isTokens('=#SPILL!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#SPILL!' }
      ]);
      isTokens('=#UNKNOWN!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#UNKNOWN!' }
      ]);
      isTokens('=#FIELD!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#FIELD!' }
      ]);
      isTokens('=#CALC!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#CALC!' }
      ]);
      isTokens('=#SYNTAX?', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#SYNTAX?' }
      ]);
      isTokens('=#ERROR!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#ERROR!' }
      ]);
      isTokens('=#CONNECT!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#CONNECT!' }
      ]);
      isTokens('=#BLOCKED!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#BLOCKED!' }
      ]);
      isTokens('=#EXTERNAL!', [
        { type: FX_PREFIX, value: '=' },
        { type: ERROR, value: '#EXTERNAL!' }
      ]);
    });

    test('unrecognized error syntax', () => {
      isTokens('=#NONSENSE!', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '#' },
        { type: CONTEXT, value: 'NONSENSE' },
        { type: OPERATOR, value: '!' }
      ]);
    });
  });

  describe('booleans', () => {
    test('true values', () => {
      isTokens('=true', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'true' }
      ]);
      isTokens('=tRuE', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'tRuE' }
      ]);
      isTokens('=TRUE', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'TRUE' }
      ]);
      isTokens('true!A1', [
        { type: BOOLEAN, value: 'true' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      isTokens('truesheet!A1', [
        { type: REF_RANGE, value: 'truesheet!A1' }
      ]);
      isTokens('true()', [
        { type: FUNCTION, value: 'true' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('false values', () => {
      isTokens('=false', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'false' }
      ]);
      isTokens('=fAlSe', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'fAlSe' }
      ]);
      isTokens('=FALSE', [
        { type: FX_PREFIX, value: '=' },
        { type: BOOLEAN, value: 'FALSE' }
      ]);
      isTokens('false!A1', [
        { type: BOOLEAN, value: 'false' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      isTokens('falsesheet!A1', [
        { type: REF_RANGE, value: 'falsesheet!A1' }
      ]);
      isTokens('false()', [
        { type: FUNCTION, value: 'false' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
    });
  });

  describe('strings', () => {
    test('basic strings', () => {
      isTokens('=""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '""' }
      ]);
      isTokens('=""""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '""""' }
      ]);
      isTokens('="data"', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"data"' }
      ]);
      isTokens('="data""data"', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"data""data"' }
      ]);
    });

    test('string concatenation', () => {
      isTokens('="data"&"data"', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"data"' },
        { type: OPERATOR, value: '&' },
        { type: STRING, value: '"data"' }
      ]);
      isTokens('="data"&"data"&"data"', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"data"' },
        { type: OPERATOR, value: '&' },
        { type: STRING, value: '"data"' },
        { type: OPERATOR, value: '&' },
        { type: STRING, value: '"data"' }
      ]);
    });

    test('unterminated strings', () => {
      isTokens('="incomple', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"incomple', unterminated: true }
      ]);

      isTokens('="', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"', unterminated: true }
      ]);
      isTokens('=""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '""' }
      ]);
      isTokens('="""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"""', unterminated: true }
      ]);
      isTokens('=""""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '""""' }
      ]);
      isTokens('="""""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"""""', unterminated: true }
      ]);
      isTokens('=""""""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '""""""' }
      ]);
    });

    test('escaped quotes', () => {
      isTokens('="aa""ss', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"aa""ss', unterminated: true }
      ]);
      isTokens('="aa""ss"', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"aa""ss"' }
      ]);
      isTokens('="aa""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"aa""', unterminated: true }
      ]);
      isTokens('="aa"""', [
        { type: FX_PREFIX, value: '=' },
        { type: STRING, value: '"aa"""' }
      ]);
    });
  });

  describe('unknowns and location handling', () => {
    test('unknown tokens with location', () => {
      isTokens('=-1', [
        { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
        { type: OPERATOR, value: '-', loc: [ 1, 2 ] },
        { type: NUMBER, value: '1', loc: [ 2, 3 ] }
      ], { withLocation: true });
      isTokens('=-1', [
        { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
        { type: NUMBER, value: '-1', loc: [ 1, 3 ] }
      ], { withLocation: true, negativeNumbers: true });

      isTokens('=$C', [
        { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
        { type: UNKNOWN, value: '$C', loc: [ 1, 3 ] }
      ], { withLocation: true });
      isTokens('=$C.foo', [
        { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
        { type: UNKNOWN, value: '$C.foo', loc: [ 1, 7 ] }
      ], { withLocation: true });
    });
  });

  describe('named ranges and functions', () => {
    test('basic named ranges', () => {
      isTokens('=foo', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'foo' }
      ]);
      isTokens('=_foo', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '_foo' }
      ]);
      isTokens('=\\foo', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '\\foo' }
      ]);
      isTokens('=\\fo', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '\\fo' }
      ]);
    });

    test('unknown backslash syntax', () => {
      isTokens('=\\f', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '\\f' }
      ]);
      isTokens('=\\', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '\\' }
      ]);
    });

    test('unicode named ranges', () => {
      isTokens('=æði', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'æði' }
      ]);
      isTokens('=らーめん', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'らーめん' }
      ]);
      isTokens('=¢mah¢', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '¢mah¢' }
      ]);
    });

    test('implicit intersection and named ranges', () => {
      isTokens('=@foo', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: '@' },
        { type: REF_NAMED, value: 'foo' }
      ]);
      isTokens('=9æði', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '9' },
        { type: REF_NAMED, value: 'æði' }
      ]);
    });

    test('invalid characters in names', () => {
      isTokens('=~mah~', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '~mah~' }
      ]);
      isTokens('=$foo', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '$foo' }
      ]);
      isTokens('=$zzzz12', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '$zzzz12' }
      ]);
      isTokens('=~zzzz12()', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '~zzzz12' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=zzzz~12()', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: 'zzzz~' },
        { type: NUMBER, value: '12' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
    });
  });

  describe('partial ranges', () => {
    const opts = { allowTernary: true };

    test('form 1: row:cell references', () => {
      isTokens('1:D$1', [
        { type: REF_TERNARY, value: '1:D$1' }
      ], opts);

      isTokens('1:D$1', [
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'D$1' }
      ]);

      isTokens('B2:B', [
        { type: REF_TERNARY, value: 'B2:B' }
      ], opts);
      isTokens('B2:B', [
        { type: REF_RANGE, value: 'B2' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'B' }
      ]);

      isTokens('1:A1', [
        { type: REF_TERNARY, value: '1:A1' }
      ], opts);
      isTokens('$1:A1', [
        { type: REF_TERNARY, value: '$1:A1' }
      ], opts);
      isTokens('1:$A1', [
        { type: REF_TERNARY, value: '1:$A1' }
      ], opts);
      isTokens('1:A$1', [
        { type: REF_TERNARY, value: '1:A$1' }
      ], opts);
      isTokens('1:$A$1', [
        { type: REF_TERNARY, value: '1:$A$1' }
      ], opts);
      isTokens('$1:A$1', [
        { type: REF_TERNARY, value: '$1:A$1' }
      ], opts);
      isTokens('$1:$A1', [
        { type: REF_TERNARY, value: '$1:$A1' }
      ], opts);
      isTokens('$1:$A$1', [
        { type: REF_TERNARY, value: '$1:$A$1' }
      ], opts);
    });

    test('form 2: cell:row references', () => {
      isTokens('A1:1', [
        { type: REF_TERNARY, value: 'A1:1' }
      ], opts);
      isTokens('A1:$1', [
        { type: REF_TERNARY, value: 'A1:$1' }
      ], opts);
      isTokens('$A1:1', [
        { type: REF_TERNARY, value: '$A1:1' }
      ], opts);
      isTokens('A$1:1', [
        { type: REF_TERNARY, value: 'A$1:1' }
      ], opts);
      isTokens('$A$1:1', [
        { type: REF_TERNARY, value: '$A$1:1' }
      ], opts);
      isTokens('A$1:$1', [
        { type: REF_TERNARY, value: 'A$1:$1' }
      ], opts);
      isTokens('$A1:$1', [
        { type: REF_TERNARY, value: '$A1:$1' }
      ], opts);
      isTokens('$A$1:$1', [
        { type: REF_TERNARY, value: '$A$1:$1' }
      ], opts);
    });

    test('form 3: column:cell references', () => {
      isTokens('A:A1', [
        { type: REF_TERNARY, value: 'A:A1' }
      ], opts);
      isTokens('$A:A1', [
        { type: REF_TERNARY, value: '$A:A1' }
      ], opts);
      isTokens('A:$A1', [
        { type: REF_TERNARY, value: 'A:$A1' }
      ], opts);
      isTokens('A:A$1', [
        { type: REF_TERNARY, value: 'A:A$1' }
      ], opts);
      isTokens('A:$A$1', [
        { type: REF_TERNARY, value: 'A:$A$1' }
      ], opts);
      isTokens('$A:A$1', [
        { type: REF_TERNARY, value: '$A:A$1' }
      ], opts);
      isTokens('$A:$A1', [
        { type: REF_TERNARY, value: '$A:$A1' }
      ], opts);
      isTokens('$A:$A$1', [
        { type: REF_TERNARY, value: '$A:$A$1' }
      ], opts);
    });

    test('form 4: cell:column references', () => {
      isTokens('A1:A', [
        { type: REF_TERNARY, value: 'A1:A' }
      ], opts);
      isTokens('A1:$A', [
        { type: REF_TERNARY, value: 'A1:$A' }
      ], opts);
      isTokens('$A1:A', [
        { type: REF_TERNARY, value: '$A1:A' }
      ], opts);
      isTokens('A$1:A', [
        { type: REF_TERNARY, value: 'A$1:A' }
      ], opts);
      isTokens('$A$1:A', [
        { type: REF_TERNARY, value: '$A$1:A' }
      ], opts);
      isTokens('A$1:$A', [
        { type: REF_TERNARY, value: 'A$1:$A' }
      ], opts);
      isTokens('$A1:$A', [
        { type: REF_TERNARY, value: '$A1:$A' }
      ], opts);
      isTokens('$A$1:$A', [
        { type: REF_TERNARY, value: '$A$1:$A' }
      ], opts);
    });

    test('complex partial range expressions', () => {
      isTokens('=A10:A+B1:2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_TERNARY, value: 'A10:A' },
        { type: OPERATOR, value: '+' },
        { type: REF_TERNARY, value: 'B1:2' }
      ], opts);
      isTokens('=SUM(A:A$10,3:B$2)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: REF_TERNARY, value: 'A:A$10' },
        { type: OPERATOR, value: ',' },
        { type: REF_TERNARY, value: '3:B$2' },
        { type: OPERATOR, value: ')' }
      ], opts);
      isTokens('$A$10:$12', [
        { type: REF_TERNARY, value: '$A$10:$12' }
      ], opts);
      isTokens('1:D$1', [
        { type: REF_TERNARY, value: '1:D$1' }
      ], opts);
    });

    test('ambiguous range vs function cases', () => {
      isTokens('=A1:IF()', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: FUNCTION, value: 'IF' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ], opts);
      isTokens('=A1:F.DIST()', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: FUNCTION, value: 'F.DIST' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ], opts);
    });

    test('invalid partial range syntax', () => {
      isTokens('=1:A1.', [
        { type: FX_PREFIX, value: '=' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'A1' },
        { type: UNKNOWN, value: '.' }
      ], opts);
      isTokens('=A1:X$', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: 'X$' }
      ], opts);
    });

    test('external partial ranges', () => {
      isTokens('=[foo]Bar!A:A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: '[foo]Bar' },
        { type: OPERATOR, value: '!' },
        { type: REF_TERNARY, value: 'A:A1' }
      ], { mergeRefs: false, allowTernary: true });
    });
  });

  describe('external refs syntax from XLSX files', () => {
    const opts = { xlsx: true };

    test('numeric workbook references', () => {
      isTokens('=[1]!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[1]!A1' }
      ], opts);
      isTokens('=[1]Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[1]Sheet1!A1' }
      ], opts);
      isTokens('=[4]!name', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '[4]!name' }
      ], opts);
      isTokens('=[16]Sheet1!name', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '[16]Sheet1!name' }
      ], opts);
    });

    test('quoted numeric workbook references', () => {
      isTokens("='[1]'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[1]'!A1" }
      ], opts);
      isTokens("='[1]Sheet1'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[1]Sheet1'!A1" }
      ], opts);
      isTokens("='[4]'!name", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: "'[4]'!name" }
      ], opts);
      isTokens("='[16]Sheet1'!name", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: "'[16]Sheet1'!name" }
      ], opts);
    });

    test('named workbook references', () => {
      isTokens('=[Workbook.xlsx]!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[Workbook.xlsx]!A1' }
      ], opts);
      isTokens('=[Workbook.xlsx]Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[Workbook.xlsx]Sheet1!A1' }
      ], opts);
      isTokens('=[Workbook.xlsx]!name', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '[Workbook.xlsx]!name' }
      ], opts);
      isTokens('=[Workbook.xlsx]Sheet1!name', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: '[Workbook.xlsx]Sheet1!name' }
      ], opts);
    });

    test('quoted named workbook references', () => {
      isTokens("='[Workbook.xlsx]'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[Workbook.xlsx]'!A1" }
      ], opts);
      isTokens("='[Workbook.xlsx]Sheet1'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[Workbook.xlsx]Sheet1'!A1" }
      ], opts);
      isTokens("='[Workbook.xlsx]'!name", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: "'[Workbook.xlsx]'!name" }
      ], opts);
      isTokens("='[Workbook.xlsx]Sheet1'!name", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: "'[Workbook.xlsx]Sheet1'!name" }
      ], opts);
    });
  });

  describe('r and c as names within LET and LAMBDA calls', () => {
    test('r and c context sensitivity', () => {
      isTokens('=c*(LAMBDA(r,c,r*c)+r)+r', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: 'c' },
        { type: OPERATOR, value: '*' },
        { type: OPERATOR, value: '(' },
        { type: FUNCTION, value: 'LAMBDA' },
        { type: OPERATOR, value: '(' },
        { type: REF_NAMED, value: 'r' },
        { type: OPERATOR, value: ',' },
        { type: REF_NAMED, value: 'c' },
        { type: OPERATOR, value: ',' },
        { type: REF_NAMED, value: 'r' },
        { type: OPERATOR, value: '*' },
        { type: REF_NAMED, value: 'c' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '+' },
        { type: UNKNOWN, value: 'r' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '+' },
        { type: UNKNOWN, value: 'r' }
      ]);
      isTokens('=c*(LET(r,A1,c,B2,r*c)+r)+r', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: 'c' },
        { type: OPERATOR, value: '*' },
        { type: OPERATOR, value: '(' },
        { type: FUNCTION, value: 'LET' },
        { type: OPERATOR, value: '(' },
        { type: REF_NAMED, value: 'r' },
        { type: OPERATOR, value: ',' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ',' },
        { type: REF_NAMED, value: 'c' },
        { type: OPERATOR, value: ',' },
        { type: REF_RANGE, value: 'B2' },
        { type: OPERATOR, value: ',' },
        { type: REF_NAMED, value: 'r' },
        { type: OPERATOR, value: '*' },
        { type: REF_NAMED, value: 'c' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '+' },
        { type: UNKNOWN, value: 'r' },
        { type: OPERATOR, value: ')' },
        { type: OPERATOR, value: '+' },
        { type: UNKNOWN, value: 'r' }
      ]);
    });
  });

  describe('trim operators', () => {
    test('valid trim operators between ranges', () => {
      isTokens('=Sheet1!A1.:.B2', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'Sheet1' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: '.:.' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
      isTokens('A1:.B2', [
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':.' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
      isTokens('A1.:B2', [
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: '.:' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
    });

    test('invalid trim operators outside literal ranges', () => {
      isTokens('=Sheet1!A.:.A.:.B.:.B', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'Sheet1!A.:.A' },
        { type: UNKNOWN, value: '.:.' },
        { type: REF_BEAM, value: 'B.:.B' }
      ]);

      isTokens('=name1.:.name2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'name1.' },
        { type: UNKNOWN, value: ':.name2' }
      ]);

      isTokens('=OFFSET(A1,1,1).:.INDIRECT("A1")', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'OFFSET' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ',' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' },
        { type: UNKNOWN, value: '.:.INDIRECT' },
        { type: OPERATOR, value: '(' },
        { type: STRING, value: '"A1"' },
        { type: OPERATOR, value: ')' }
      ]);
    });
  });

  describe('whitespace handling', () => {
    test('various whitespace types', () => {
      isTokens('\tA1\u00a0+\nB2\r', [
        { type: WHITESPACE, value: '\t' },
        { type: REF_RANGE, value: 'A1' },
        { type: WHITESPACE, value: '\u00a0' },
        { type: OPERATOR, value: '+' },
        { type: NEWLINE, value: '\n' },
        { type: REF_RANGE, value: 'B2' },
        { type: WHITESPACE, value: '\r' }
      ]);
    });
  });

  test('xlsx vs non-xlsx modes work as exptected', () => {
    // to the tokenizer, the only difference between the two variants is
    // that [x]!A1 is forbidden in the default one
    expect(tokenize('[foo]bar!A1')).toEqual([ { type: REF_RANGE, value: '[foo]bar!A1' } ]);
    expect(tokenize('[foo]!A1')).toEqual([
      { type: UNKNOWN, value: '[foo]' },
      { type: OPERATOR, value: '!' },
      { type: REF_RANGE, value: 'A1' }
    ]);
    expect(tokenize('foo!A1')).toEqual([ { type: REF_RANGE, value: 'foo!A1' } ]);
    expect(tokenizeXlsx('[foo]bar!A1')).toEqual([ { type: REF_RANGE, value: '[foo]bar!A1' } ]);
    expect(tokenizeXlsx('[foo]!A1')).toEqual([ { type: REF_RANGE, value: '[foo]!A1' } ]);
    expect(tokenizeXlsx('foo!A1')).toEqual([ { type: REF_RANGE, value: 'foo!A1' } ]);
  });

  test('r and c as LET arguments in R1C1 mode', () => {
    // Unlike with LET(c,1,c) is not valid syntax with the R1C1 notation in Excel.
    //
    // If you create a cell with this expression in A1 mode and flip to R1C1, Excel
    // will not change it when expressing it, but will not allow you to re-enter it.
    //
    // Excel will always save the formula such as the arguments will have a "_xlpm."
    // prefix: _xlfn.LET(_xlpm.c,1,_xlpm.c)
    //
    // However, that is also invalid syntax in the exposed/common Excel formula syntax.
    // To counter this, fx does the following:
    //
    // tokenize:
    //    Supports _xlpm.c in both modes.
    //    Assumes c, C, r and R are names when encountered as tokens within LET functions.
    // translateTokensToR1C1:
    //    Tries to be unabiguous by serializing "c" ranges in within LET as C[0].
    //    Same goes for "r" to R[0]. Prefixed names are left as they are.
    //    This way round-tripping is possible.
    expect(tokenize('LET(c,1,c)', { r1c1: true })).toEqual([
      { type: FUNCTION, value: 'LET' },
      { type: OPERATOR, value: '(' },
      { type: REF_NAMED, value: 'c' },
      { type: OPERATOR, value: ',' },
      { type: NUMBER, value: '1' },
      { type: OPERATOR, value: ',' },
      { type: REF_NAMED, value: 'c' },
      { type: OPERATOR, value: ')' }
    ]);
    expect(tokenize('LET(r,1,r)', { r1c1: true })).toEqual([
      { type: FUNCTION, value: 'LET' },
      { type: OPERATOR, value: '(' },
      { type: REF_NAMED, value: 'r' },
      { type: OPERATOR, value: ',' },
      { type: NUMBER, value: '1' },
      { type: OPERATOR, value: ',' },
      { type: REF_NAMED, value: 'r' },
      { type: OPERATOR, value: ')' }
    ]);
    // Even if the second C could be identified as a range,
    // which requires a parse-tree of some sort, the the "c+C"
    // would both have to be names as arguments are
    // case-insensitive:
    expect(tokenize('LET(c,C,c+C)', { r1c1: true })).toEqual([
      { type: FUNCTION, value: 'LET' },
      { type: OPERATOR, value: '(' },
      { type: REF_NAMED, value: 'c' },
      { type: OPERATOR, value: ',' },
      { type: REF_NAMED, value: 'C' }, // beam
      { type: OPERATOR, value: ',' },
      { type: REF_NAMED, value: 'c' },
      { type: OPERATOR, value: '+' },
      { type: REF_NAMED, value: 'C' }, // beam
      { type: OPERATOR, value: ')' }
    ]);
    expect(tokenize('LET(c,C,SUM(c,C))', { r1c1: true })).toEqual([
      { type: FUNCTION, value: 'LET' },
      { type: OPERATOR, value: '(' },
      { type: REF_NAMED, value: 'c' },
      { type: OPERATOR, value: ',' },
      { type: REF_NAMED, value: 'C' },
      { type: OPERATOR, value: ',' },
      { type: FUNCTION, value: 'SUM' },
      { type: OPERATOR, value: '(' },
      { type: REF_NAMED, value: 'c' },
      { type: OPERATOR, value: ',' },
      { type: REF_NAMED, value: 'C' },
      { type: OPERATOR, value: ')' },
      { type: OPERATOR, value: ')' }
    ]);
  });

  describe('Sheet name that looks like an A1 ref', () => {
    test('Sheet name that looks like an A1 ref', () => {
      expect(tokenize("'Sch1'!B2")).toEqual([
        { type: REF_RANGE, value: "'Sch1'!B2" }
      ]);
      expect(tokenize('Sch1!B2')).toEqual([
        { type: REF_RANGE, value: 'Sch1!B2' }
      ]);
    });

    test('Sheet name that is a R or C ref', () => {
      expect(tokenize("'C'!R[-9]C[-3]", { r1c1: true })).toEqual([
        { type: REF_RANGE, value: "'C'!R[-9]C[-3]" }
      ]);
      expect(tokenize('C!R[-9]C[-3]', { r1c1: true })).toEqual([
        { type: REF_RANGE, value: 'C!R[-9]C[-3]' }
      ]);
    });
  });

  describe('3-D references', () => {
    test('unquoted sheet ranges are one range token', () => {
      isTokens('=fool:bard!A1:B2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'fool:bard!A1:B2' }
      ]);
      isTokens('=fool:bard!A1:B2', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: 'fool:bard' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
      isTokens('=Sheet1:Sheet2!name', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Sheet1:Sheet2!name' }
      ]);
    });

    test('sheet names that are also column letters', () => {
      // JAN and DEC are valid column letters, so "Jan:Dec" would otherwise lex as a beam
      isTokens('=Jan:Dec!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Jan:Dec!A1' }
      ]);
      isTokens('=A:C!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A:C!A1' }
      ]);
      isTokens('=Jan:Dec!A:C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'Jan:Dec!A:C' }
      ]);
      // ... but without the "!" they are still beams
      isTokens('=Jan:Dec', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'Jan:Dec' }
      ]);
      isTokens('=A:C', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'A:C' }
      ]);
    });

    test('a sheet name holding a "." is still one name', () => {
      // "." is the one character a sheet name may contain that a range is also allowed to end on,
      // so a name is measured to the colon rather than to wherever the range grammar runs out.
      // Here the beam "A:a" stops inside the far end's name, and "a1" inside the near end's.
      isTokens('=A:a.b!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A:a.b!A1' }
      ]);
      isTokens('=Jan:a.b!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Jan:a.b!A1' }
      ]);
      isTokens('=a1.b:Dec!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'a1.b:Dec!A1' }
      ]);
      // ... and a near end that only starts out as a cell address is no cell, so it keeps no colon
      isTokens('=A1.b:Dec!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1.b:Dec!A1' }
      ]);
      // ... while without a sheet prefix behind it the beam stands, dot and all
      isTokens('=A:a.b', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'A:a' },
        { type: UNKNOWN, value: '.b' }
      ]);
    });

    test('quoted sheet ranges', () => {
      isTokens("='Sheet1:Sheet2'!A1:B2", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'Sheet1:Sheet2'!A1:B2" }
      ]);
      isTokens("='Sheet 1:Sheet 2'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'Sheet 1:Sheet 2'!A1" }
      ]);
      isTokens("='Sheet 1:Sheet 2'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'Sheet 1:Sheet 2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
    });

    test('sheet ranges with a workbook', () => {
      isTokens('=[Book.xlsx]Sheet1:Sheet2!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[Book.xlsx]Sheet1:Sheet2!A1' }
      ]);
      isTokens('=SUM([Book.xlsx]S1:S3!A1)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: '[Book.xlsx]S1:S3!A1' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens("='[Book.xlsx]Sheet 1:Sheet 2'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[Book.xlsx]Sheet 1:Sheet 2'!A1" }
      ]);
      expect(tokenizeXlsx('=[1]Sheet1:Sheet2!A1')).toEqual([
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[1]Sheet1:Sheet2!A1' }
      ]);
      expect(tokenizeXlsx("='[1]Sheet1:Sheet2'!A1")).toEqual([
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[1]Sheet1:Sheet2'!A1" }
      ]);
    });

    test('each end of a sheet range may be quoted on its own', () => {
      // Accepted to be forgiving of other producers: Excel does not read a separately-quoted pair
      // as a sheet range at all. The tell of getting this wrong is an open-ended beam: the lexer
      // bailing at the quote used to leave "foo:" behind, which then normalized to the
      // unrelated "A:FOO".
      isTokens("=foo:'bar'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "foo:'bar'!A1" }
      ]);
      isTokens("='foo':bar!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'foo':bar!A1" }
      ]);
      isTokens("='foo':'bar'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'foo':'bar'!A1" }
      ]);
      isTokens("='foo bar':'baz'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'foo bar':'baz'!A1" }
      ]);
      isTokens("='[Book.xlsx]foo':'bar'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'[Book.xlsx]foo':'bar'!A1" }
      ]);
      isTokens("=foo:'bar'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: "foo:'bar'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      isTokens("='foo':'bar'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: "'foo':'bar'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      // A workbook may only be named ahead of the whole prefix, so a quoted endpoint containing
      // one is not an endpoint. Excel writes this when the far end of a sheet range names no sheet:
      // it manufactures an external link for that name, leaving a reference to another workbook.
      isTokens("=Jan:'[1]Nope'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Jan' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'[1]Nope'!A1" }
      ]);
      expect(tokenizeXlsx("=Jan:'[1]Nope'!A1")).toEqual([
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Jan' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'[1]Nope'!A1" }
      ]);
      // Excel forbids ":" in a sheet name, and the one dividing the two ends is behind us here,
      // so a quoted endpoint containing one is no endpoint either. (A colon inside a prefix
      // quoted as a whole is the divider, and does not come this way.)
      isTokens("=Jan:'a:b'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Jan' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'a:b'!A1" }
      ]);
      isTokens("='Jan:Dec'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'Jan:Dec'!A1" }
      ]);
      // A quoted endpoint that never closes names no sheet, so neither does the pair.
      isTokens("=Jan:'Dec!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Jan' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "'" },
        { type: REF_RANGE, value: 'Dec!A1' }
      ]);
      // ... nor does a closed one with no prefix behind it, there being no reference to scope
      isTokens("=Jan:'Dec'", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Jan' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "'Dec'" }
      ]);
      // ... nor a quoted near end whose far end is missing
      isTokens("='Jan':!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: "'Jan'" },
        { type: OPERATOR, value: ':' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
    });

    test('a colon inside the workbook brackets is not a sheet range', () => {
      // A path scope may contain a colon of its own — a Windows drive letter — which divides no
      // sheet names. Only a colon past the brackets separates two of those.
      isTokens('=[C:\\Book.xlsx]Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[C:\\Book.xlsx]Sheet1!A1' }
      ]);
      isTokens('=[C:\\Book.xlsx]Jan:Dec!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '[C:\\Book.xlsx]Jan:Dec!A1' }
      ]);
    });

    test('beams and quoted prefixes elsewhere are unaffected', () => {
      // a trailing colon with nothing after it is still an open-ended beam
      isTokens('=SUM(foo:)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: REF_BEAM, value: 'foo:' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=SUM(A:A)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: REF_BEAM, value: 'A:A' },
        { type: OPERATOR, value: ')' }
      ]);
      isTokens('=A1:MyName', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'MyName' }
      ]);
      isTokens("=A1&'Sheet1'!B2", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: '&' },
        { type: REF_RANGE, value: "'Sheet1'!B2" }
      ]);
    });

    test('a quote straight after a range takes the range down with it', () => {
      // canEndRange refuses "'" whether or not a sheet prefix follows, which is wider than the
      // rule needs. No valid formula spells these, and the half-typed one that matters,
      // "=A1:'Sheet 2'!B2", ends its range at the colon, so the width is deliberate.
      isTokens("=A1'", [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: "A1'" }
      ]);
      isTokens("=A1:B2'", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "B2'" }
      ]);
      isTokens("=A1:'Sheet 2'!B2", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'Sheet 2'!B2" }
      ]);
    });

    test('sheet ranges in R1C1 mode', () => {
      isTokens('=Jan:Dec!R[1]C[1]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Jan:Dec!R[1]C[1]' }
      ], { r1c1: true });
      // C1 and C5 are valid R1C1 column parts, so "C1:C5" would otherwise lex as a beam
      isTokens('=C1:C5!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C1:C5!R1C1' }
      ], { r1c1: true });
      isTokens('=C1:C5', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C1:C5' }
      ], { r1c1: true });
      // the far end is a sheet name, so it need not be an R1C1 part itself, nor unquoted
      isTokens('=C1:Dec!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C1:Dec!R1C1' }
      ], { r1c1: true });
      isTokens("=C1:'Dec'!R1C1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "C1:'Dec'!R1C1" }
      ], { r1c1: true });
      isTokens('=C:D!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C:D!R1C1' }
      ], { r1c1: true });
      isTokens('=R1:Total!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R1:Total!R1C1' }
      ], { r1c1: true });
      // ... but a bracket is one thing a sheet name may not contain, so a far end with one names
      // no second sheet and the near end is left standing as a beam
      isTokens('=C1:R[1]C[1]!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C1' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: 'R' },
        { type: REF_STRUCT, value: '[1]' },
        { type: UNKNOWN, value: 'C[' },
        { type: NUMBER, value: '1' },
        { type: UNKNOWN, value: ']' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'R1C1' }
      ], { r1c1: true });
      // ... and a bracket on the near end rules a sheet range out just the same
      isTokens('=R[1]:Dec!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'R[1]' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Dec!R1C1' }
      ], { r1c1: true });
      // a trim range operator's "." counts towards the near end's name, as it does in A1, where
      // "=A.:Dec!C3" is likewise a sheet range
      isTokens('=C1.:Dec!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C1.:Dec!R1C1' }
      ], { r1c1: true });
      // ... and a "." inside either name keeps that name whole here as it does in A1, so neither
      // the beam "C1:C5" nor the cell "R1C1" ends where the name it is part of continues
      isTokens('=C1:C5.b!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'C1:C5.b!R1C1' }
      ], { r1c1: true });
      isTokens('=R1C1.b:Dec!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R1C1.b:Dec!R1C1' }
      ], { r1c1: true });
      // ... while a missing far end names no second sheet
      isTokens('=C1:!R1C1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C1' },
        { type: OPERATOR, value: ':' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'R1C1' }
      ], { r1c1: true });
      // ... but with no sheet prefix behind it, the near end is still a beam of its own
      isTokens('=C1:Dec', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'C1' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Dec' }
      ], { r1c1: true });
      // A1 cell addresses are just names here, so the pair Excel reads as a range operator in A1
      // notation is a sheet range in R1C1 notation. Excel does the same: with the R1C1 reference
      // style on, "=SUM(A1:B2!R3C3)" sums R3C3 across sheets A1 through B2, where the A1-notation
      // "=SUM(A1:B2!C3)" is #VALUE!.
      isTokens('=A1:B2!R3C3', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1:B2!R3C3' }
      ], { r1c1: true });
      // ... but a left side that is also a cell address takes the colon here too, for the names
      // that are cell addresses in R1C1
      isTokens('=R1C1:R2C2!R3C3', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'R1C1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'R2C2!R3C3' }
      ], { r1c1: true });
      isTokens('=RC:R2C2!R3C3', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'RC' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'R2C2!R3C3' }
      ], { r1c1: true });
      isTokens("='R1C1:R2C2'!R3C3", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'R1C1:R2C2'!R3C3" }
      ], { r1c1: true });
    });

    test('a cell-shaped left side wins over a sheet range', () => {
      // Excel reads "=SUM(A1:B2!C3)" as cell A1 joined to 'B2'!C3 (and yields #VALUE!), while
      // "=SUM(A:C!A1)" and "=SUM(Jan:Mar!A1)" are sheet ranges — a left side that is only a
      // column letter does not take the colon that way. Only the quoted spelling makes such a
      // pair a sheet range. Cell address is meant in this notation: see the R1C1 tests above,
      // where "A1:B2!R3C3" is a sheet range because "A1" is no cell there.
      isTokens('=A1:B2!C3', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2!C3' }
      ]);
      isTokens('=Q1:Sales!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Q1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Sales!A1' }
      ]);
      isTokens("='A1:B2'!C3", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'A1:B2'!C3" }
      ]);
      isTokens('=Jan:Mar!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Jan:Mar!A1' }
      ]);
    });

    test('"$" is not allowed on an unquoted sheet name', () => {
      // Excel refuses "=SUM($Jan:$Mar!A1)" on entry, and a file containing one does not open
      isTokens('=$Jan:$Mar!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: UNKNOWN, value: '$Jan' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: '$' },
        { type: REF_RANGE, value: 'Mar!A1' }
      ]);
      // ... but "$" is a legal character in a sheet name, so the quoted spelling is a sheet range
      isTokens("='$Jan:$Mar'!A1", [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: "'$Jan:$Mar'!A1" }
      ]);
    });

    test('a cross-sheet range is still two references', () => {
      isTokens('=B!F2:B!F20', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'B!F2' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B!F20' }
      ]);
      isTokens('=Sheet1!A1:Sheet2!B2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'Sheet1!A1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Sheet2!B2' }
      ]);
    });

    test('a colon outside a sheet prefix is still a range operator', () => {
      isTokens('=foo:B2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'foo' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2' }
      ]);
      isTokens('=SUM(foo:B2)', [
        { type: FX_PREFIX, value: '=' },
        { type: FUNCTION, value: 'SUM' },
        { type: OPERATOR, value: '(' },
        { type: REF_NAMED, value: 'foo' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'B2' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('a sheet range has exactly two endpoints', () => {
      // a second colon disqualifies the run as a context, as does a missing endpoint
      isTokens('=a:b:c!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_BEAM, value: 'a:b' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'c!A1' }
      ]);
      isTokens('=Sheet1:!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      isTokens('=:Sheet1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Sheet1!A1' }
      ]);
      // a workbook is not a sheet, so the colon after one has no first sheet name in front of it
      isTokens('=[Book.xlsx]:Sheet2!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_STRUCT, value: '[Book.xlsx]' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Sheet2!A1' }
      ]);
      // ... and neither endpoint may be missing when the names are not column letters
      isTokens('=zoo1:bar1:baz1!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'zoo1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'bar1' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'baz1!A1' }
      ]);
      // a later "!" does not supply the missing far end: "!" is no sheet name, so the prefix ends
      // at the colon rather than scanning on for a second one
      isTokens('=a:!!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_NAMED, value: 'a' },
        { type: OPERATOR, value: ':' },
        { type: OPERATOR, value: '!' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
    });

    test('a sheet named "." keeps the colon of its sheet range', () => {
      // "." heads the trim range operators, which run ahead of every other lexer, so a sheet
      // range whose near end is a lone "." has to be let past them as it is past the range lexers
      isTokens('=.:Dec!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: '.:Dec!A1' }
      ]);
      isTokens('=.:.!A1', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT, value: '.:.' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ], { mergeRefs: false });
      // ... while a trim operator with a range on its left is untouched
      isTokens('=A1.:B2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: '.:' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
      isTokens('=A1:.B2', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_RANGE, value: 'A1' },
        { type: OPERATOR, value: ':.' },
        { type: REF_RANGE, value: 'B2' }
      ], { mergeRefs: false });
    });
  });

  describe('Function name that looks like an A1 ref', () => {
    test('Function name that looks like an A1 ref', () => {
      expect(tokenize('LOG10(1)')).toEqual([
        { type: FUNCTION, value: 'LOG10' },
        { type: OPERATOR, value: '(' },
        { type: NUMBER, value: '1' },
        { type: OPERATOR, value: ')' }
      ]);
      expect(tokenize('ROW(LOG10)')).toEqual([
        { type: FUNCTION, value: 'ROW' },
        { type: OPERATOR, value: '(' },
        { type: REF_RANGE, value: 'LOG10' },
        { type: OPERATOR, value: ')' }
      ]);
    });

    test('Function name that is a R or C', () => {
      expect(tokenize('R()')).toEqual([
        { type: FUNCTION, value: 'R' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
      expect(tokenize('C()')).toEqual([
        { type: FUNCTION, value: 'C' },
        { type: OPERATOR, value: '(' },
        { type: OPERATOR, value: ')' }
      ]);
    });
  });
});
