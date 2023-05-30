import { test, Test } from 'tape';
import {
  FX_PREFIX, UNKNOWN,
  OPERATOR, WHITESPACE,
  REF_NAMED, CONTEXT_QUOTE, REF_STRUCT, REF_RANGE
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
    { type: REF_STRUCT, value: '[@]' }
  ]);
  t.isTokens('[[@]]', [
    { type: UNKNOWN, value: '[' },
    { type: REF_STRUCT, value: '[@]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[@foo]', [
    { type: REF_STRUCT, value: '[@foo]' }
  ]);
  t.isTokens('[Column Name]', [
    { type: REF_STRUCT, value: '[Column Name]' }
  ]);
  t.isTokens('[@foo:bar]', [
    { type: REF_STRUCT, value: '[@foo:bar]' }
  ]);
  t.isTokens('[@[foo]:bar]', [
    { type: REF_STRUCT, value: '[@[foo]:bar]' }
  ]);
  t.isTokens('[@[foo]:[bar]]', [
    { type: REF_STRUCT, value: '[@[foo]:[bar]]' }
  ]);
  t.isTokens('[@foo:[bar]]', [
    { type: REF_STRUCT, value: '[@foo:[bar]]' }
  ]);
  t.isTokens('[@[foo]]', [
    { type: REF_STRUCT, value: '[@[foo]]' }
  ]);
  t.isTokens('[[@foo]]', [
    { type: UNKNOWN, value: '[' },
    { type: REF_STRUCT, value: '[@foo]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[\'@foo]]', [
    { type: REF_STRUCT, value: '[[\'@foo]]' }
  ]);
  t.isTokens('[#All]', [
    { type: REF_STRUCT, value: '[#All]' }
  ]);
  t.isTokens('[#All]', [
    { type: REF_STRUCT, value: '[#All]' }
  ]);
  t.isTokens('[#Data]', [
    { type: REF_STRUCT, value: '[#Data]' }
  ]);
  t.isTokens('[#Headers]', [
    { type: REF_STRUCT, value: '[#Headers]' }
  ]);
  t.isTokens('[#Totals]', [
    { type: REF_STRUCT, value: '[#Totals]' }
  ]);
  t.isTokens('[#This Row]', [
    { type: REF_STRUCT, value: '[#This Row]' }
  ]);
  t.isTokens('[#Totals]', [
    { type: REF_STRUCT, value: '[#Totals]' }
  ]);
  t.isTokens('[#totals]', [
    { type: REF_STRUCT, value: '[#totals]' }
  ]);
  t.isTokens('[#tOtAlS]', [
    { type: REF_STRUCT, value: '[#tOtAlS]' }
  ]);
  t.isTokens('[#This  Row]', [
    { type: UNKNOWN, value: '[' },
    { type: OPERATOR, value: '#' },
    { type: REF_NAMED, value: 'This' },
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
    { type: REF_NAMED, value: 'tOtAlS' },
    { type: WHITESPACE, value: ' ' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[# tOtAlS ]', [
    { type: UNKNOWN, value: '[' },
    { type: OPERATOR, value: '#' },
    { type: WHITESPACE, value: ' ' },
    { type: REF_NAMED, value: 'tOtAlS' },
    { type: WHITESPACE, value: ' ' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#all],@[foo]]', [
    { type: UNKNOWN, value: '[' },
    { type: REF_STRUCT, value: '[#all]' },
    { type: OPERATOR, value: ',' },
    { type: OPERATOR, value: '@' },
    { type: REF_STRUCT, value: '[foo]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#all],]', [
    { type: UNKNOWN, value: '[' },
    { type: REF_STRUCT, value: '[#all]' },
    { type: OPERATOR, value: ',' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#data][#headers]]', [
    { type: UNKNOWN, value: '[' },
    { type: REF_STRUCT, value: '[#data]' },
    { type: REF_STRUCT, value: '[#headers]' },
    { type: UNKNOWN, value: ']' }
  ]);
  t.isTokens('[[#data]foo]', [
    { type: UNKNOWN, value: '[' },
    { type: REF_STRUCT, value: '[#data]' },
    { type: UNKNOWN, value: 'foo]' }
  ]);
  t.isTokens('[[#all],[foo]]', [
    { type: REF_STRUCT, value: '[[#all],[foo]]' }
  ]);
  t.isTokens('[[#all],foo]', [
    { type: REF_STRUCT, value: '[[#all],foo]' }
  ]);
  t.isTokens('[[#all],foo:bar]', [
    { type: REF_STRUCT, value: '[[#all],foo:bar]' }
  ]);
  t.isTokens('[[#all],[foo]:[bar]]', [
    { type: REF_STRUCT, value: '[[#all],[foo]:[bar]]' }
  ]);
  // this may not be what users expect, but "foo:bar baz" is a legit column name
  t.isTokens('[foo:bar baz]', [
    { type: REF_STRUCT, value: '[foo:bar baz]' }
  ]);
  t.isTokens('[foo:[bar baz]]', [
    { type: REF_STRUCT, value: '[foo:[bar baz]]' }
  ]);
  t.isTokens('[foo:]', [
    { type: REF_STRUCT, value: '[foo:]' }
  ]);
  t.isTokens('[[foo]:[bar baz]]', [
    { type: REF_STRUCT, value: '[[foo]:[bar baz]]' }
  ]);
  t.isTokens('[[#headers],[#data],[#headers],[#data],[#headers],[#data],[Baz]]', [
    { type: REF_STRUCT, value: '[[#headers],[#data],[#headers],[#data],[#headers],[#data],[Baz]]' }
  ]);
  t.isTokens('[[#all],[#all],[#all],[#all],[ColumnName]]', [
    { type: REF_STRUCT, value: '[[#all],[#all],[#all],[#all],[ColumnName]]' }
  ]);
  t.isTokens('[[#Totals],col name:Foo]', [
    { type: REF_STRUCT, value: '[[#Totals],col name:Foo]' }
  ]);
  t.isTokens('Table1[[#This Row],[a]]*[1]Sheet1!$A$1', [
    { type: REF_STRUCT, value: 'Table1[[#This Row],[a]]' },
    { type: OPERATOR, value: '*' },
    { type: REF_RANGE, value: '[1]Sheet1!$A$1' }
  ], { xlsx: true });
  t.isTokens("Sheet1!Table1[foo '[bar']]", [
    { type: REF_STRUCT, value: "Sheet1!Table1[foo '[bar']]" }
  ]);
  t.end();
});

test('tokenize structured references (merges off)', t => {
  t.isTokens('Table1[[#This Row],[Column]]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[[#This Row],[Column]]' }
  ], { mergeRefs: false });
  t.isTokens('DeptSales[[#Headers],[#Data],[% Commission]]', [
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[[#Headers],[#Data],[% Commission]]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[[#This Row],[Column Name]]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[[#This Row],[Column Name]]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[@[Column]]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[@[Column]]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[@Column]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[@Column]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[ [#Data], [Surf]:[Rod] ]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[ [#Data], [Surf]:[Rod] ]' }
  ], { mergeRefs: false });
  // Excel does pick this up but normalizes to DeptSales[@[Commission Amount]]
  t.isTokens('DeptSales[@Commission Amount]', [
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[@Commission Amount]' }
  ], { mergeRefs: false });
  t.isTokens('DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]', [
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[[#Totals],[Sales Amount]:[Commission Amount]]' }
  ], { mergeRefs: false });
  t.isTokens('DeptSales[[#Headers],[Region]:[Commission Amount]]', [
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[[#Headers],[Region]:[Commission Amount]]' }
  ], { mergeRefs: false });
  t.isTokens('DeptSales[\'#OfItems]', [
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[\'#OfItems]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[[#Data],[#Totals],Bar:Baz]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[[#Data],[#Totals],Bar:Baz]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[[Foo]:[Bar]]:Table1[Baz]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[[Foo]:[Bar]]' },
    { type: OPERATOR, value: ':' },
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[Baz]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[Bar]:Table1[Baz]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[Bar]' },
    { type: OPERATOR, value: ':' },
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[Baz]' }
  ], { mergeRefs: false });
  t.isTokens('Table1[[#Headers],[My\'#thing]]', [
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[[#Headers],[My\'#thing]]' }
  ], { mergeRefs: false });
  t.isTokens('DeptSales[Sales Amount]*DeptSales[% Commission]', [
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[Sales Amount]' },
    { type: OPERATOR, value: '*' },
    { type: REF_NAMED, value: 'DeptSales' },
    { type: REF_STRUCT, value: '[% Commission]' }
  ], { mergeRefs: false });
  t.isTokens('=\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]', [
    { type: FX_PREFIX, value: '=' },
    { type: CONTEXT_QUOTE, value: '\'Sales - May2020.xlsx\'' },
    { type: OPERATOR, value: '!' },
    { type: REF_NAMED, value: 'Table1' },
    { type: REF_STRUCT, value: '[ [#Data], [#Totals], [Surf]:[Rod] ]' }
  ], { mergeRefs: false });
  t.end();
});

test('tokenize structured references (merges on)', t => {
  t.isTokens('Table1[[#This Row],[Column]]', [
    { type: REF_STRUCT, value: 'Table1[[#This Row],[Column]]' }
  ]);
  t.isTokens('DeptSales[[#Headers],[#Data],[% Commission]]', [
    { type: REF_STRUCT, value: 'DeptSales[[#Headers],[#Data],[% Commission]]' }
  ]);
  t.isTokens('Table1[[#This Row],[Column Name]]', [
    { type: REF_STRUCT, value: 'Table1[[#This Row],[Column Name]]' }
  ]);
  t.isTokens('Table1[@[Column]]', [
    { type: REF_STRUCT, value: 'Table1[@[Column]]' }
  ]);
  t.isTokens('Table1[@Column]', [
    { type: REF_STRUCT, value: 'Table1[@Column]' }
  ]);
  t.isTokens('Table1[ [#Data], [Surf]:[Rod] ]', [
    { type: REF_STRUCT, value: 'Table1[ [#Data], [Surf]:[Rod] ]' }
  ]);
  // Excel does pick this up but normalizes to DeptSales[@[Commission Amount]]
  t.isTokens('DeptSales[@Commission Amount]', [
    { type: REF_STRUCT, value: 'DeptSales[@Commission Amount]' }
  ]);
  t.isTokens('DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]', [
    { type: REF_STRUCT, value: 'DeptSales[[#Totals],[Sales Amount]:[Commission Amount]]' }
  ]);
  t.isTokens('DeptSales[[#Headers],[Region]:[Commission Amount]]', [
    { type: REF_STRUCT, value: 'DeptSales[[#Headers],[Region]:[Commission Amount]]' }
  ]);
  t.isTokens('DeptSales[\'#OfItems]', [
    { type: REF_STRUCT, value: 'DeptSales[\'#OfItems]' }
  ]);
  t.isTokens('Table1[[#Data],[#Totals],Bar:Baz]', [
    { type: REF_STRUCT, value: 'Table1[[#Data],[#Totals],Bar:Baz]' }
  ]);
  t.isTokens('Table1[[Foo]:[Bar]]:Table1[Baz]', [
    { type: REF_STRUCT, value: 'Table1[[Foo]:[Bar]]' },
    { type: OPERATOR, value: ':' },
    { type: REF_STRUCT, value: 'Table1[Baz]' }
  ]);
  t.isTokens('Table1[Bar]:Table1[Baz]', [
    { type: REF_STRUCT, value: 'Table1[Bar]' },
    { type: OPERATOR, value: ':' },
    { type: REF_STRUCT, value: 'Table1[Baz]' }
  ]);
  t.isTokens('Table1[[#Headers],[My\'#thing]]', [
    { type: REF_STRUCT, value: 'Table1[[#Headers],[My\'#thing]]' }
  ]);
  t.isTokens('DeptSales[Sales Amount]*DeptSales[% Commission]', [
    { type: REF_STRUCT, value: 'DeptSales[Sales Amount]' },
    { type: OPERATOR, value: '*' },
    { type: REF_STRUCT, value: 'DeptSales[% Commission]' }
  ]);
  t.isTokens('=\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]', [
    { type: FX_PREFIX, value: '=' },
    { type: REF_STRUCT, value: '\'Sales - May2020.xlsx\'!Table1[ [#Data], [#Totals], [Surf]:[Rod] ]' }
  ]);
  t.end();
});
