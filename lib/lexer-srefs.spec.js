import { test, Test } from 'tape';
import {
  FX_PREFIX, UNKNOWN,
  OPERATOR, WHITESPACE,
  RANGE_NAMED, CONTEXT_QUOTE, RANGE_STRUCT
} from './constants.js';
import { tokenize } from './lexer.js';

Test.prototype.isTokens = function isTokens (expr, result, opts) {
  this.deepEqual(tokenize(expr, { negativeNumbers: false, ...opts }), result, expr);
};
Test.prototype.isTokensNeg = function isTokensNeg (expr, result, opts) {
  this.deepEqual(tokenize(expr, { ...opts, negativeNumbers: true }), result, expr);
};

test('tokenize structured references (merges on)', t => {
  // keyword specifiers
  t.isTokens('[@]', [
    { type: RANGE_STRUCT, value: '[@]' }
  ]);
  t.isTokens('[[@]]', [
    { type: UNKNOWN, value: '[' },
    { type: RANGE_STRUCT, value: '[@]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[@foo]', [
    { type: RANGE_STRUCT, value: '[@foo]' }
  ]);
  t.isTokens('[Column Name]', [
    { type: RANGE_STRUCT, value: '[Column Name]' }
  ]);
  t.isTokens('[@foo:bar]', [
    { type: RANGE_STRUCT, value: '[@foo:bar]' }
  ]);
  t.isTokens('[@[foo]:bar]', [
    { type: RANGE_STRUCT, value: '[@[foo]:bar]' }
  ]);
  t.isTokens('[@[foo]:[bar]]', [
    { type: RANGE_STRUCT, value: '[@[foo]:[bar]]' }
  ]);
  t.isTokens('[@foo:[bar]]', [
    { type: RANGE_STRUCT, value: '[@foo:[bar]]' }
  ]);
  t.isTokens('[@[foo]]', [
    { type: RANGE_STRUCT, value: '[@[foo]]' }
  ]);
  t.isTokens('[[@foo]]', [
    { type: UNKNOWN, value: '[' },
    { type: RANGE_STRUCT, value: '[@foo]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[\'@foo]]', [
    { type: RANGE_STRUCT, value: '[[\'@foo]]' }
  ]);
  t.isTokens('[#All]', [
    { type: RANGE_STRUCT, value: '[#All]' }
  ]);
  t.isTokens('[#All]', [
    { type: RANGE_STRUCT, value: '[#All]' }
  ]);
  t.isTokens('[#Data]', [
    { type: RANGE_STRUCT, value: '[#Data]' }
  ]);
  t.isTokens('[#Headers]', [
    { type: RANGE_STRUCT, value: '[#Headers]' }
  ]);
  t.isTokens('[#Totals]', [
    { type: RANGE_STRUCT, value: '[#Totals]' }
  ]);
  t.isTokens('[#This Row]', [
    { type: RANGE_STRUCT, value: '[#This Row]' }
  ]);
  t.isTokens('[#Totals]', [
    { type: RANGE_STRUCT, value: '[#Totals]' }
  ]);
  t.isTokens('[#totals]', [
    { type: RANGE_STRUCT, value: '[#totals]' }
  ]);
  t.isTokens('[#tOtAlS]', [
    { type: RANGE_STRUCT, value: '[#tOtAlS]' }
  ]);
  t.isTokens('[#This  Row]', [
    { type: UNKNOWN, value: '[' },
    { type: OPERATOR, value: '#' },
    { type: RANGE_NAMED, value: 'This' },
    { type: WHITESPACE, value: '  ' },
    { type: UNKNOWN, value: 'Row]' }
  ]);
  t.isTokens('[ #tOtAlS]', [
    { type: UNKNOWN, value: '[' },
    { type: WHITESPACE, value: ' ' },
    { type: OPERATOR, value: '#' },
    { type: UNKNOWN, value: 'tOtAlS]' }
  ]);
  t.isTokens('[#tOtAlS ]', [
    { type: UNKNOWN, value: '[' },
    { type: OPERATOR, value: '#' },
    { type: RANGE_NAMED, value: 'tOtAlS' },
    { type: WHITESPACE, value: ' ' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[# tOtAlS ]', [
    { type: UNKNOWN, value: '[' },
    { type: OPERATOR, value: '#' },
    { type: WHITESPACE, value: ' ' },
    { type: RANGE_NAMED, value: 'tOtAlS' },
    { type: WHITESPACE, value: ' ' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#all],@[foo]]', [
    { type: UNKNOWN, value: '[' },
    { type: RANGE_STRUCT, value: '[#all]' },
    { type: OPERATOR, value: ',' },
    { type: OPERATOR, value: '@' },
    { type: RANGE_STRUCT, value: '[foo]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#all],]', [
    { type: UNKNOWN, value: '[' },
    { type: RANGE_STRUCT, value: '[#all]' },
    { type: OPERATOR, value: ',' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#data][#headers]]', [
    { type: UNKNOWN, value: '[' },
    { type: RANGE_STRUCT, value: '[#data]' },
    { type: RANGE_STRUCT, value: '[#headers]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#data]foo]', [
    { type: UNKNOWN, value: '[' },
    { type: RANGE_STRUCT, value: '[#data]' },
    { type: UNKNOWN, value: 'foo]' }
  ]);
  t.isTokens('[[#all],[foo]]', [
    { type: RANGE_STRUCT, value: '[[#all],[foo]]' }
  ]);
  t.isTokens('[[#all],foo]', [
    { type: RANGE_STRUCT, value: '[[#all],foo]' }
  ]);
  t.isTokens('[[#all],foo:bar]', [
    { type: RANGE_STRUCT, value: '[[#all],foo:bar]' }
  ]);
  t.isTokens('[[#all],[foo]:[bar]]', [
    { type: RANGE_STRUCT, value: '[[#all],[foo]:[bar]]' }
  ]);
  // this may not be what users expect, but "foo:bar baz" is a legit column name
  t.isTokens('[foo:bar baz]', [
    { type: RANGE_STRUCT, value: '[foo:bar baz]' }
  ]);
  t.isTokens('[foo:[bar baz]]', [
    { type: RANGE_STRUCT, value: '[foo:[bar baz]]' }
  ]);
  t.isTokens('[foo:]', [
    { type: RANGE_STRUCT, value: '[foo:]' }
  ]);
  t.isTokens('[[foo]:[bar baz]]', [
    { type: RANGE_STRUCT, value: '[[foo]:[bar baz]]' }
  ]);
  t.isTokens('[[#headers],[#data],[#headers],[#data],[#headers],[#data],[Baz]]', [
    { type: RANGE_STRUCT, value: '[[#headers],[#data],[#headers],[#data],[#headers],[#data],[Baz]]' }
  ]);
  t.isTokens('[[#all],[#all],[#all],[#all],[ColumnName]]', [
    { type: RANGE_STRUCT, value: '[[#all],[#all],[#all],[#all],[ColumnName]]' }
  ]);
  t.isTokens('[[#Totals],col name:Foo]', [
    { type: RANGE_STRUCT, value: '[[#Totals],col name:Foo]' }
  ]);
  t.end();
});

test('tokenize structured references (merges off)', t => {
  t.isTokens('Table1[[#This Row],[Column]]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[[#This Row],[Column]]' }
  ], { mergeRanges: false });
  t.isTokens('DeptSales[[#Headers],[#Data],[% Commission]]', [
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[[#Headers],[#Data],[% Commission]]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[[#This Row],[Column Name]]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[[#This Row],[Column Name]]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[@[Column]]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[@[Column]]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[@Column]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[@Column]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[ [#Data], [Surf]:[Rod] ]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[ [#Data], [Surf]:[Rod] ]' }
  ], { mergeRanges: false });
  // Excel does pick this up but normalizes to DeptSales[@[Commission Amount]]
  t.isTokens('DeptSales[@Commission Amount]', [
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[@Commission Amount]' }
  ], { mergeRanges: false });
  t.isTokens('DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]', [
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[[#Totals],[Sales Amount]:[Commission Amount]]' }
  ], { mergeRanges: false });
  t.isTokens('DeptSales[[#Headers],[Region]:[Commission Amount]]', [
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[[#Headers],[Region]:[Commission Amount]]' }
  ], { mergeRanges: false });
  t.isTokens('DeptSales[\'#OfItems]', [
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[\'#OfItems]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[[#Data],[#Totals],Bar:Baz]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[[#Data],[#Totals],Bar:Baz]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[[Foo]:[Bar]]:Table1[Baz]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[[Foo]:[Bar]]' },
    { type: OPERATOR, value: ':' },
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[Baz]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[Bar]:Table1[Baz]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[Bar]' },
    { type: OPERATOR, value: ':' },
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[Baz]' }
  ], { mergeRanges: false });
  t.isTokens('Table1[[#Headers],[My\'#thing]]', [
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[[#Headers],[My\'#thing]]' }
  ], { mergeRanges: false });
  t.isTokens('DeptSales[Sales Amount]*DeptSales[% Commission]', [
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[Sales Amount]' },
    { type: OPERATOR, value: '*' },
    { type: RANGE_NAMED, value: 'DeptSales' },
    { type: RANGE_STRUCT, value: '[% Commission]' }
  ], { mergeRanges: false });
  t.isTokens('=\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]', [
    { type: FX_PREFIX, value: '=' },
    { type: CONTEXT_QUOTE, value: '\'Sales - May2020.xlsx\'' },
    { type: OPERATOR, value: '!' },
    { type: RANGE_NAMED, value: 'Table1' },
    { type: RANGE_STRUCT, value: '[ [#Data], [#Totals], [Surf]:[Rod] ]' }
  ], { mergeRanges: false });
  t.end();
});

test('tokenize structured references (merges on)', t => {
  t.isTokens('Table1[[#This Row],[Column]]', [
    { type: RANGE_STRUCT, value: 'Table1[[#This Row],[Column]]' }
  ]);
  t.isTokens('DeptSales[[#Headers],[#Data],[% Commission]]', [
    { type: RANGE_STRUCT, value: 'DeptSales[[#Headers],[#Data],[% Commission]]' }
  ]);
  t.isTokens('Table1[[#This Row],[Column Name]]', [
    { type: RANGE_STRUCT, value: 'Table1[[#This Row],[Column Name]]' }
  ]);
  t.isTokens('Table1[@[Column]]', [
    { type: RANGE_STRUCT, value: 'Table1[@[Column]]' }
  ]);
  t.isTokens('Table1[@Column]', [
    { type: RANGE_STRUCT, value: 'Table1[@Column]' }
  ]);
  t.isTokens('Table1[ [#Data], [Surf]:[Rod] ]', [
    { type: RANGE_STRUCT, value: 'Table1[ [#Data], [Surf]:[Rod] ]' }
  ]);
  // Excel does pick this up but normalizes to DeptSales[@[Commission Amount]]
  t.isTokens('DeptSales[@Commission Amount]', [
    { type: RANGE_STRUCT, value: 'DeptSales[@Commission Amount]' }
  ]);
  t.isTokens('DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]', [
    { type: RANGE_STRUCT, value: 'DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]' }
  ]);
  t.isTokens('DeptSales[[#Headers],[Region]:[Commission Amount]]', [
    { type: RANGE_STRUCT, value: 'DeptSales[[#Headers],[Region]:[Commission Amount]]' }
  ]);
  t.isTokens('DeptSales[\'#OfItems]', [
    { type: RANGE_STRUCT, value: 'DeptSales[\'#OfItems]' }
  ]);
  t.isTokens('Table1[[#Data],[#Totals],Bar:Baz]', [
    { type: RANGE_STRUCT, value: 'Table1[[#Data],[#Totals],Bar:Baz]' }
  ]);
  t.isTokens('Table1[[Foo]:[Bar]]:Table1[Baz]', [
    { type: RANGE_STRUCT, value: 'Table1[[Foo]:[Bar]]' },
    { type: OPERATOR, value: ':' },
    { type: RANGE_STRUCT, value: 'Table1[Baz]' }
  ]);
  t.isTokens('Table1[Bar]:Table1[Baz]', [
    { type: RANGE_STRUCT, value: 'Table1[Bar]' },
    { type: OPERATOR, value: ':' },
    { type: RANGE_STRUCT, value: 'Table1[Baz]' }
  ]);
  t.isTokens('Table1[[#Headers],[My\'#thing]]', [
    { type: RANGE_STRUCT, value: 'Table1[[#Headers],[My\'#thing]]' }
  ]);
  t.isTokens('DeptSales[Sales Amount]*DeptSales[% Commission]', [
    { type: RANGE_STRUCT, value: 'DeptSales[Sales Amount]' },
    { type: OPERATOR, value: '*' },
    { type: RANGE_STRUCT, value: 'DeptSales[% Commission]' }
  ]);
  t.isTokens('=\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]', [
    { type: FX_PREFIX, value: '=' },
    { type: RANGE_STRUCT, value: '\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]' }
  ]);
  t.end();
});
