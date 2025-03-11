import { test, Test } from 'tape';
import { tokenize } from './lexer.js';
import { addTokenMeta } from './addTokenMeta.js';
import { fixRanges } from './fixRanges.js';
import { FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_STRUCT, REF_TERNARY } from './constants.js';

Test.prototype.isFixed = function (expr, expected, options = {}) {
  const result = fixRanges(expr, options);
  this.is(result, expected, expr + ' → ' + expected);
};

test('fixRanges basics', t => {
  const fx = '=SUM([wb]Sheet1!B2:A1)';
  t.throws(() => fixRanges(123), 'throws on non arrays (number)');
  t.throws(() => fixRanges(null), 'throws on non arrays (null)');
  const tokens = addTokenMeta(tokenize(fx, { mergeRefs: true }));
  tokens[3].foo = 'bar';
  const fixedTokens = fixRanges(tokens, { debug: 0 });
  t.ok(tokens !== fixedTokens, 'emits a new array instance');
  t.ok(tokens[3] !== fixedTokens[3], 'does not mutate existing range tokens');
  t.deepEqual(tokens[3], {
    type: REF_RANGE,
    value: '[wb]Sheet1!B2:A1',
    index: 3,
    depth: 1,
    groupId: 'fxg1',
    foo: 'bar'
  }, 'keeps meta (pre-fix range token)');
  t.deepEqual(fixedTokens[3], {
    type: REF_RANGE,
    value: '[wb]Sheet1!A1:B2',
    index: 3,
    depth: 1,
    groupId: 'fxg1',
    foo: 'bar'
  }, 'keeps meta (post-fix range token)');
  const tokensWithRanges = tokenize(
    '=SUM(B2:A,table[[#This Row],[Foo]])',
    { withLocation: true, mergeRefs: true, allowTernary: true }
  );
  t.deepEqual(fixRanges(tokensWithRanges, { addBounds: true }), [
    { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
    { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ] },
    { type: OPERATOR, value: '(', loc: [ 4, 5 ] },
    { type: REF_TERNARY, value: 'A2:B1048576', loc: [ 5, 16 ] },
    { type: OPERATOR, value: ',', loc: [ 16, 17 ] },
    { type: REF_STRUCT, value: 'table[@Foo]', loc: [ 17, 28 ] },
    { type: OPERATOR, value: ')', loc: [ 28, 29 ] }
  ], 'updates token source location information');
  t.end();
});

test('fixRanges A1', t => {
  const opt = { allowTernary: true };
  // doesn't mess with things that it doesn't have to
  t.isFixed('=A1', '=A1', opt);
  t.isFixed('=ZZ123', '=ZZ123', opt);
  t.isFixed('=A1:B2', '=A1:B2', opt);
  t.isFixed('=B3:OFFSET(A1,10,10)', '=B3:OFFSET(A1,10,10)', opt);
  t.isFixed('=A:B', '=A:B', opt);
  t.isFixed('=C:C', '=C:C', opt);
  t.isFixed('=3:6', '=3:6', opt);
  t.isFixed('=3:3', '=3:3', opt);
  // redundancy
  t.isFixed('=A1:$A$1', '=A1:$A$1', opt);
  t.isFixed('=A1:A1', '=A1', opt);
  // lowercase to uppercase
  t.isFixed('=a1', '=A1', opt);
  t.isFixed('=zz123', '=ZZ123', opt);
  t.isFixed('=a1:b2', '=A1:B2', opt);
  // flipped rects
  t.isFixed('=B2:A1', '=A1:B2', opt);
  t.isFixed('=$B$2:$A$1', '=$A$1:$B$2', opt);
  // flipped beams
  t.isFixed('=C:A', '=A:C', opt);
  t.isFixed('=$D:B', '=B:$D', opt);
  t.isFixed('=10:1', '=1:10', opt);
  t.isFixed('=$5:3', '=3:$5', opt);
  // flipped partials - bottom
  t.isFixed('=A:A1', '=A1:A', opt);
  t.isFixed('=A:A$1', '=A$1:A', opt);
  // flipped partials - right
  t.isFixed('=1:A1', '=A1:1', opt);
  // $1:$A1 is rather counter intuitive case:
  //   This range is parsed as { left=null, top=$1, right=$A, bottom=1 } but,
  //   because left is null, right and left are flipped around, making this
  //   end up as { left=$A, top=$1, right=null, bottom=1 } which serializes
  //   as $A$1:1
  t.isFixed('=$1:$A1', '=$A$1:1', opt);
  t.end();
});

test('fixRanges A1 addBounds', t => {
  const opt = { allowTernary: true, addBounds: true };
  t.isFixed('=B3:OFFSET(A1,10,10)', '=B3:OFFSET(A1,10,10)', opt);
  t.isFixed('=A:A', '=A:A', opt);
  t.isFixed('=A:A1', '=A:A', opt);
  t.isFixed('=A:A$1', '=A:A', opt);
  t.isFixed('=A:$A$1', '=A:$A', opt);
  t.isFixed('=A.:A', '=A.:A', opt);
  // partials - bottom
  t.isFixed('=A1:A', '=A:A', opt);
  t.isFixed('=A1:Z', '=A:Z', opt);
  t.isFixed('=A:A1', '=A:A', opt);
  t.isFixed('=$A1:A', '=$A:A', opt);
  t.isFixed('=A$1:A', '=A:A', opt);
  t.isFixed('=A1:$A', '=A:$A', opt);
  t.isFixed('=A2:A', '=A2:A1048576', opt);
  t.isFixed('=B2:B', '=B2:B1048576', opt);
  t.isFixed('=A:A2', '=A2:A1048576', opt);
  t.isFixed('=B:B2', '=B2:B1048576', opt);
  t.isFixed('=B.:.B2', '=B2.:.B1048576', opt);
  // flipped partials - bottom
  t.isFixed('=A1:1', '=1:1', opt);
  t.isFixed('=A1:4', '=1:4', opt);
  t.isFixed('=1:A1', '=1:1', opt);
  t.isFixed('=$A1:1', '=1:1', opt);
  t.isFixed('=A$1:1', '=$1:1', opt);
  t.isFixed('=A1:$1', '=1:$1', opt);
  t.isFixed('=B1:1', '=B1:XFD1', opt);
  t.isFixed('=1:B1', '=B1:XFD1', opt);
  t.isFixed('=B2:20', '=B2:XFD20', opt);
  t.isFixed('=2:B20', '=B2:XFD20', opt);
  t.isFixed('=2:.B20', '=B2:.XFD20', opt);
  t.end();
});

test('fixRanges structured references', t => {
  t.isFixed('=Table1[[#This Row],[Foo]]', '=Table1[@Foo]');
  t.isFixed('=[[#This Row],[s:s]]', '=[@[s:s]]');
  t.isFixed('=Table1[[#Totals],col name:Foo]', '=Table1[[#Totals],[col name]:[Foo]]');
  t.isFixed('[[#data],[#headers]]', '[[#Headers],[#Data]]');
  t.isFixed('[[#headers],[#data]]', '[[#Headers],[#Data]]');
  t.isFixed('[[#totals],[#data]]', '[[#Data],[#Totals]]');
  t.isFixed('[ [#totals], [#data] ]', '[[#Data],[#Totals]]');
  t.isFixed('[[#data],[#totals]]', '[[#Data],[#Totals]]');
  t.isFixed('[[#all],foo:bar]', '[[#All],[foo]:[bar]]');
  t.isFixed('[[#all],[#all],[#all],[#all],[ColumnName]]', '[[#All],[ColumnName]]');
  t.isFixed('[@[foo]:bar]', '[@[foo]:[bar]]');
  t.isFixed('[@foo bar]', '[@[foo bar]]');
  // Care must be taken with spaces in column headers.
  // Excel considers refs only valid if they match the column name
  // but the parser does not know the names, so it must preserve
  // leading/trailing whitespace.
  t.isFixed('[ @[foo bar] ]', '[@[foo bar]]');
  t.isFixed('[ @[ foo bar ] ]', '[@[ foo bar ]]');
  t.isFixed('[ @foo bar ]', '[@[foo bar ]]');
  t.isFixed('[@ foo bar]', '[@[ foo bar]]');
  t.isFixed('[ @ foo bar ]', '[@[ foo bar ]]');
  t.end();
});

test('fixRanges works with xlsx mode', t => {
  // should not mess with invalid ranges in normal mode
  t.isFixed("='[Workbook]'!Table[Column]", "='[Workbook]'!Table[Column]");
  t.isFixed('=[Workbook]!Table[Column]', '=[Workbook]!Table[Column]');
  t.isFixed("='[Foo]'!A1", "='[Foo]'!A1");
  t.isFixed('=[Foo]!A1', '=[Foo]!A1');
  // should fix things in xlsx mode
  const opts = { xlsx: true };
  t.isFixed("='[Workbook]'!Table[Column]", '=[Workbook]!Table[Column]', opts);
  t.isFixed('=[Workbook]!Table[Column]', '=[Workbook]!Table[Column]', opts);
  t.isFixed('=[Lorem Ipsum]!Table[Column]', "='[Lorem Ipsum]'!Table[Column]", opts);
  t.isFixed("='[Foo]'!A1", '=[Foo]!A1', opts);
  t.isFixed('=[Foo]Bar!A1', '=[Foo]Bar!A1', opts);
  t.isFixed('=[Foo Bar]Baz!A1', "='[Foo Bar]Baz'!A1", opts);
  t.isFixed('=[Foo]!A1', '=[Foo]!A1', opts);
  t.isFixed('=[Lorem Ipsum]!A1', "='[Lorem Ipsum]'!A1", opts);
  t.end();
});
