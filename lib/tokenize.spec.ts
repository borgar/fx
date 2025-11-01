import { describe, test, expect } from 'vitest';
import {
  FX_PREFIX, UNKNOWN,
  OPERATOR, BOOLEAN, ERROR, NUMBER, FUNCTION, WHITESPACE, STRING,
  REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, CONTEXT, CONTEXT_QUOTE, NEWLINE
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
});
