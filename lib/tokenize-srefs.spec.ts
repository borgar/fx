import { describe, test, expect } from 'vitest';
import {
  FX_PREFIX, UNKNOWN,
  OPERATOR, WHITESPACE,
  REF_NAMED, CONTEXT_QUOTE, REF_STRUCT, REF_RANGE
} from './constants.ts';
import { tokenize } from './tokenize.ts';

function isTokens (expr: string, result: any[], opts?: any) {
  expect(tokenize(expr, { negativeNumbers: false, ...opts })).toEqual(result);
}

describe('tokenize structured references', () => {
  describe('basic structured references (default merge on)', () => {
    test('keyword specifiers', () => {
      isTokens('[@]', [
        { type: REF_STRUCT, value: '[@]' }
      ]);

      isTokens('[[@]]', [
        { type: UNKNOWN, value: '[' },
        { type: REF_STRUCT, value: '[@]' },
        { type: UNKNOWN, value: ']' }
      ]);

      isTokens('[@foo]', [
        { type: REF_STRUCT, value: '[@foo]' }
      ]);

      isTokens('[Column Name]', [
        { type: REF_STRUCT, value: '[Column Name]' }
      ]);
    });

    test('range specifiers with columns', () => {
      isTokens('[@foo:bar]', [
        { type: REF_STRUCT, value: '[@foo:bar]' }
      ]);

      isTokens('[@[foo]:bar]', [
        { type: REF_STRUCT, value: '[@[foo]:bar]' }
      ]);

      isTokens('[@[foo]:[bar]]', [
        { type: REF_STRUCT, value: '[@[foo]:[bar]]' }
      ]);

      isTokens('[@foo:[bar]]', [
        { type: REF_STRUCT, value: '[@foo:[bar]]' }
      ]);

      isTokens('[@[foo]]', [
        { type: REF_STRUCT, value: '[@[foo]]' }
      ]);
    });

    test('nested bracket handling', () => {
      isTokens('[[@foo]]', [
        { type: UNKNOWN, value: '[' },
        { type: REF_STRUCT, value: '[@foo]' },
        { type: UNKNOWN, value: ']' }
      ]);

      isTokens('[[\'@foo]]', [
        { type: REF_STRUCT, value: '[[\'@foo]]' }
      ]);
    });

    test('special identifiers', () => {
      isTokens('[#All]', [
        { type: REF_STRUCT, value: '[#All]' }
      ]);

      isTokens('[#Data]', [
        { type: REF_STRUCT, value: '[#Data]' }
      ]);

      isTokens('[#Headers]', [
        { type: REF_STRUCT, value: '[#Headers]' }
      ]);

      isTokens('[#Totals]', [
        { type: REF_STRUCT, value: '[#Totals]' }
      ]);

      isTokens('[#This Row]', [
        { type: REF_STRUCT, value: '[#This Row]' }
      ]);
    });

    test('case sensitivity for special identifiers', () => {
      isTokens('[#totals]', [
        { type: REF_STRUCT, value: '[#totals]' }
      ]);

      isTokens('[#tOtAlS]', [
        { type: REF_STRUCT, value: '[#tOtAlS]' }
      ]);
    });

    test('invalid special identifier formats', () => {
      isTokens('[#This  Row]', [
        { type: UNKNOWN, value: '[' },
        { type: OPERATOR, value: '#' },
        { type: REF_NAMED, value: 'This' },
        { type: WHITESPACE, value: '  ' },
        { type: UNKNOWN, value: 'Row]' }
      ]);

      isTokens('[ #tOtAlS]', [
        { type: UNKNOWN, value: '[' },
        { type: WHITESPACE, value: ' ' },
        { type: OPERATOR, value: '#' },
        { type: UNKNOWN, value: 'tOtAlS]' }
      ]);

      isTokens('[#tOtAlS ]', [
        { type: UNKNOWN, value: '[' },
        { type: OPERATOR, value: '#' },
        { type: REF_NAMED, value: 'tOtAlS' },
        { type: WHITESPACE, value: ' ' },
        { type: UNKNOWN, value: ']' }
      ]);

      isTokens('[# tOtAlS ]', [
        { type: UNKNOWN, value: '[' },
        { type: OPERATOR, value: '#' },
        { type: WHITESPACE, value: ' ' },
        { type: REF_NAMED, value: 'tOtAlS' },
        { type: WHITESPACE, value: ' ' },
        { type: UNKNOWN, value: ']' }
      ]);
    });

    test('complex nested references', () => {
      isTokens('[[#all],@[foo]]', [
        { type: UNKNOWN, value: '[' },
        { type: REF_STRUCT, value: '[#all]' },
        { type: OPERATOR, value: ',' },
        { type: OPERATOR, value: '@' },
        { type: REF_STRUCT, value: '[foo]' },
        { type: UNKNOWN, value: ']' }
      ]);

      isTokens('[[#all],]', [
        { type: UNKNOWN, value: '[' },
        { type: REF_STRUCT, value: '[#all]' },
        { type: OPERATOR, value: ',' },
        { type: UNKNOWN, value: ']' }
      ]);

      isTokens('[[#data][#headers]]', [
        { type: UNKNOWN, value: '[' },
        { type: REF_STRUCT, value: '[#data]' },
        { type: REF_STRUCT, value: '[#headers]' },
        { type: UNKNOWN, value: ']' }
      ]);

      isTokens('[[#data]foo]', [
        { type: UNKNOWN, value: '[' },
        { type: REF_STRUCT, value: '[#data]' },
        { type: UNKNOWN, value: 'foo]' }
      ]);
    });

    test('valid complex structured references', () => {
      isTokens('[[#all],[foo]]', [
        { type: REF_STRUCT, value: '[[#all],[foo]]' }
      ]);

      isTokens('[[#all],foo]', [
        { type: REF_STRUCT, value: '[[#all],foo]' }
      ]);

      isTokens('[[#all],foo:bar]', [
        { type: REF_STRUCT, value: '[[#all],foo:bar]' }
      ]);

      isTokens('[[#all],[foo]:[bar]]', [
        { type: REF_STRUCT, value: '[[#all],[foo]:[bar]]' }
      ]);
    });

    test('column names with special characters', () => {
      // this may not be what users expect, but "foo:bar baz" is a legit column name
      isTokens('[foo:bar baz]', [
        { type: REF_STRUCT, value: '[foo:bar baz]' }
      ]);

      isTokens('[foo:[bar baz]]', [
        { type: REF_STRUCT, value: '[foo:[bar baz]]' }
      ]);

      isTokens('[foo:]', [
        { type: REF_STRUCT, value: '[foo:]' }
      ]);

      isTokens('[[foo]:[bar baz]]', [
        { type: REF_STRUCT, value: '[[foo]:[bar baz]]' }
      ]);
    });

    test('complex multi-section references', () => {
      isTokens('[[#headers],[#data],[#headers],[#data],[#headers],[#data],[Baz]]', [
        { type: REF_STRUCT, value: '[[#headers],[#data],[#headers],[#data],[#headers],[#data],[Baz]]' }
      ]);

      isTokens('[[#all],[#all],[#all],[#all],[ColumnName]]', [
        { type: REF_STRUCT, value: '[[#all],[#all],[#all],[#all],[ColumnName]]' }
      ]);

      isTokens('[[#Totals],col name:Foo]', [
        { type: REF_STRUCT, value: '[[#Totals],col name:Foo]' }
      ]);
    });

    test('mixed with other token types', () => {
      isTokens('Table1[[#This Row],[a]]*[1]Sheet1!$A$1', [
        { type: REF_STRUCT, value: 'Table1[[#This Row],[a]]' },
        { type: OPERATOR, value: '*' },
        { type: REF_RANGE, value: '[1]Sheet1!$A$1' }
      ], { xlsx: true });

      isTokens("Sheet1!Table1[foo '[bar']]", [
        { type: REF_STRUCT, value: "Sheet1!Table1[foo '[bar']]" }
      ]);
    });
  });

  describe('with mergeRefs disabled', () => {
    const mergeOffOpts = { mergeRefs: false };

    test('table references separated from structured parts', () => {
      isTokens('Table1[[#This Row],[Column]]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[[#This Row],[Column]]' }
      ], mergeOffOpts);

      isTokens('DeptSales[[#Headers],[#Data],[% Commission]]', [
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[[#Headers],[#Data],[% Commission]]' }
      ], mergeOffOpts);

      isTokens('Table1[[#This Row],[Column Name]]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[[#This Row],[Column Name]]' }
      ], mergeOffOpts);
    });

    test('column references', () => {
      isTokens('Table1[@[Column]]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[@[Column]]' }
      ], mergeOffOpts);

      isTokens('Table1[@Column]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[@Column]' }
      ], mergeOffOpts);

      isTokens('Table1[ [#Data], [Surf]:[Rod] ]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[ [#Data], [Surf]:[Rod] ]' }
      ], mergeOffOpts);

      // Excel does pick this up but normalizes to DeptSales[@[Commission Amount]]
      isTokens('DeptSales[@Commission Amount]', [
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[@Commission Amount]' }
      ], mergeOffOpts);
    });

    test('complex table references', () => {
      isTokens('DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]', [
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[[#Totals],[Sales Amount]:[Commission Amount]]' }
      ], mergeOffOpts);

      isTokens('DeptSales[[#Headers],[Region]:[Commission Amount]]', [
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[[#Headers],[Region]:[Commission Amount]]' }
      ], mergeOffOpts);

      isTokens('DeptSales[\'#OfItems]', [
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[\'#OfItems]' }
      ], mergeOffOpts);

      isTokens('Table1[[#Data],[#Totals],Bar:Baz]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[[#Data],[#Totals],Bar:Baz]' }
      ], mergeOffOpts);
    });

    test('range operations between table references', () => {
      isTokens('Table1[[Foo]:[Bar]]:Table1[Baz]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[[Foo]:[Bar]]' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[Baz]' }
      ], mergeOffOpts);

      isTokens('Table1[Bar]:Table1[Baz]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[Bar]' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[Baz]' }
      ], mergeOffOpts);
    });

    test('special characters in column names', () => {
      isTokens('Table1[[#Headers],[My\'#thing]]', [
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[[#Headers],[My\'#thing]]' }
      ], mergeOffOpts);

      isTokens('DeptSales[Sales Amount]*DeptSales[% Commission]', [
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[Sales Amount]' },
        { type: OPERATOR, value: '*' },
        { type: REF_NAMED, value: 'DeptSales' },
        { type: REF_STRUCT, value: '[% Commission]' }
      ], mergeOffOpts);
    });

    test('external workbook references', () => {
      isTokens('=\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]', [
        { type: FX_PREFIX, value: '=' },
        { type: CONTEXT_QUOTE, value: '\'Sales - May2020.xlsx\'' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[ [#Data], [#Totals], [Surf]:[Rod] ]' }
      ], mergeOffOpts);
    });
  });

  describe('with mergeRefs enabled (default)', () => {
    test('table references merged with structured parts', () => {
      isTokens('Table1[[#This Row],[Column]]', [
        { type: REF_STRUCT, value: 'Table1[[#This Row],[Column]]' }
      ]);

      isTokens('DeptSales[[#Headers],[#Data],[% Commission]]', [
        { type: REF_STRUCT, value: 'DeptSales[[#Headers],[#Data],[% Commission]]' }
      ]);

      isTokens('Table1[[#This Row],[Column Name]]', [
        { type: REF_STRUCT, value: 'Table1[[#This Row],[Column Name]]' }
      ]);
    });

    test('column references merged', () => {
      isTokens('Table1[@[Column]]', [
        { type: REF_STRUCT, value: 'Table1[@[Column]]' }
      ]);

      isTokens('Table1[@Column]', [
        { type: REF_STRUCT, value: 'Table1[@Column]' }
      ]);

      isTokens('Table1[ [#Data], [Surf]:[Rod] ]', [
        { type: REF_STRUCT, value: 'Table1[ [#Data], [Surf]:[Rod] ]' }
      ]);

      // Excel does pick this up but normalizes to DeptSales[@[Commission Amount]]
      isTokens('DeptSales[@Commission Amount]', [
        { type: REF_STRUCT, value: 'DeptSales[@Commission Amount]' }
      ]);
    });

    test('complex table references merged', () => {
      isTokens('DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]', [
        { type: REF_STRUCT, value: 'DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]' }
      ]);

      isTokens('DeptSales[[#Headers],[Region]:[Commission Amount]]', [
        { type: REF_STRUCT, value: 'DeptSales[[#Headers],[Region]:[Commission Amount]]' }
      ]);

      isTokens('DeptSales[\'#OfItems]', [
        { type: REF_STRUCT, value: 'DeptSales[\'#OfItems]' }
      ]);

      isTokens('Table1[[#Data],[#Totals],Bar:Baz]', [
        { type: REF_STRUCT, value: 'Table1[[#Data],[#Totals],Bar:Baz]' }
      ]);
    });

    test('range operations between merged table references', () => {
      isTokens('Table1[[Foo]:[Bar]]:Table1[Baz]', [
        { type: REF_STRUCT, value: 'Table1[[Foo]:[Bar]]' },
        { type: OPERATOR, value: ':' },
        { type: REF_STRUCT, value: 'Table1[Baz]' }
      ]);

      isTokens('Table1[Bar]:Table1[Baz]', [
        { type: REF_STRUCT, value: 'Table1[Bar]' },
        { type: OPERATOR, value: ':' },
        { type: REF_STRUCT, value: 'Table1[Baz]' }
      ]);
    });

    test('special characters in column names merged', () => {
      isTokens('Table1[[#Headers],[My\'#thing]]', [
        { type: REF_STRUCT, value: 'Table1[[#Headers],[My\'#thing]]' }
      ]);

      isTokens('DeptSales[Sales Amount]*DeptSales[% Commission]', [
        { type: REF_STRUCT, value: 'DeptSales[Sales Amount]' },
        { type: OPERATOR, value: '*' },
        { type: REF_STRUCT, value: 'DeptSales[% Commission]' }
      ]);
    });

    test('external workbook references merged', () => {
      isTokens('=\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_STRUCT, value: '\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]' }
      ]);

      isTokens('=[myworkbook.xlsx]Sheet1!TMP8w0habhr[#All]', [
        { type: FX_PREFIX, value: '=' },
        { type: REF_STRUCT, value: '[myworkbook.xlsx]Sheet1!TMP8w0habhr[#All]' }
      ]);
    });
  });
});
