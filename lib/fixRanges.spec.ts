import { describe, test, expect } from 'vitest';
import { tokenize } from './lexer.js';
import { addTokenMeta } from './addTokenMeta.js';
import { fixRanges } from './fixRanges.js';
import { FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_STRUCT, REF_TERNARY } from './constants.js';

function isFixed(expr: string, expected: string, options = {}) {
  const result = fixRanges(expr, options);
  expect(result).toBe(expected);
}

describe('fixRanges basics', () => {
  test('throws on non-string inputs', () => {
    expect(() => fixRanges(123 as any)).toThrow();
    expect(() => fixRanges(null as any)).toThrow();
  });

  test('emits new array instance and preserves meta', () => {
    const fx = '=SUM([wb]Sheet1!B2:A1)';
    const tokens = addTokenMeta(tokenize(fx, { mergeRefs: true }));
    tokens[3].foo = 'bar';
    const fixedTokens = fixRanges(tokens);

    expect(tokens).not.toBe(fixedTokens);
    expect(tokens[3]).not.toBe(fixedTokens[3]);

    expect(tokens[3]).toEqual({
      type: REF_RANGE,
      value: '[wb]Sheet1!B2:A1',
      index: 3,
      depth: 1,
      groupId: 'fxg1',
      foo: 'bar'
    });

    expect(fixedTokens[3]).toEqual({
      type: REF_RANGE,
      value: '[wb]Sheet1!A1:B2',
      index: 3,
      depth: 1,
      groupId: 'fxg1',
      foo: 'bar'
    });
  });

  test('updates token source location information', () => {
    const tokensWithRanges = tokenize(
      '=SUM(B2:A,table[[#This Row],[Foo]])',
      { withLocation: true, mergeRefs: true, allowTernary: true }
    );

    expect(fixRanges(tokensWithRanges, { addBounds: true })).toEqual([
      { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
      { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ] },
      { type: OPERATOR, value: '(', loc: [ 4, 5 ] },
      { type: REF_TERNARY, value: 'A2:B1048576', loc: [ 5, 16 ] },
      { type: OPERATOR, value: ',', loc: [ 16, 17 ] },
      { type: REF_STRUCT, value: 'table[@Foo]', loc: [ 17, 28 ] },
      { type: OPERATOR, value: ')', loc: [ 28, 29 ] }
    ]);
  });
});

describe('fixRanges A1', () => {
  const opt = { allowTernary: true };

  test('doesn\'t mess with things that it doesn\'t have to', () => {
    isFixed('=A1', '=A1', opt);
    isFixed('=ZZ123', '=ZZ123', opt);
    isFixed('=A1:B2', '=A1:B2', opt);
    isFixed('=B3:OFFSET(A1,10,10)', '=B3:OFFSET(A1,10,10)', opt);
    isFixed('=A:B', '=A:B', opt);
    isFixed('=C:C', '=C:C', opt);
    isFixed('=3:6', '=3:6', opt);
    isFixed('=3:3', '=3:3', opt);
  });

  test('handles redundancy', () => {
    isFixed('=A1:$A$1', '=A1:$A$1', opt);
    isFixed('=A1:A1', '=A1', opt);
  });

  test('converts lowercase to uppercase', () => {
    isFixed('=a1', '=A1', opt);
    isFixed('=zz123', '=ZZ123', opt);
    isFixed('=a1:b2', '=A1:B2', opt);
  });

  test('fixes flipped rectangles', () => {
    isFixed('=B2:A1', '=A1:B2', opt);
    isFixed('=$B$2:$A$1', '=$A$1:$B$2', opt);
  });

  test('fixes flipped beams', () => {
    isFixed('=C:A', '=A:C', opt);
    isFixed('=$D:B', '=B:$D', opt);
    isFixed('=10:1', '=1:10', opt);
    isFixed('=$5:3', '=3:$5', opt);
  });

  test('fixes flipped partials - bottom', () => {
    isFixed('=A:A1', '=A1:A', opt);
    isFixed('=A:A$1', '=A$1:A', opt);
  });

  test('fixes flipped partials - right', () => {
    isFixed('=1:A1', '=A1:1', opt);
    // $1:$A1 is rather counter intuitive case:
    //   This range is parsed as { left=null, top=$1, right=$A, bottom=1 } but,
    //   because left is null, right and left are flipped around, making this
    //   end up as { left=$A, top=$1, right=null, bottom=1 } which serializes
    //   as $A$1:1
    isFixed('=$1:$A1', '=$A$1:1', opt);
  });
});

describe('fixRanges A1 addBounds', () => {
  const opt = { allowTernary: true, addBounds: true };

  test('handles functions and existing bounds', () => {
    isFixed('=B3:OFFSET(A1,10,10)', '=B3:OFFSET(A1,10,10)', opt);
    isFixed('=A:A', '=A:A', opt);
    isFixed('=A:A1', '=A:A', opt);
    isFixed('=A:A$1', '=A:A', opt);
    isFixed('=A:$A$1', '=A:$A', opt);
    isFixed('=A.:A', '=A.:A', opt);
  });

  test('adds bounds to partials - bottom', () => {
    isFixed('=A1:A', '=A:A', opt);
    isFixed('=A1:Z', '=A:Z', opt);
    isFixed('=A:A1', '=A:A', opt);
    isFixed('=$A1:A', '=$A:A', opt);
    isFixed('=A$1:A', '=A:A', opt);
    isFixed('=A1:$A', '=A:$A', opt);
    isFixed('=A2:A', '=A2:A1048576', opt);
    isFixed('=B2:B', '=B2:B1048576', opt);
    isFixed('=A:A2', '=A2:A1048576', opt);
    isFixed('=B:B2', '=B2:B1048576', opt);
    isFixed('=B.:.B2', '=B2.:.B1048576', opt);
  });

  test('adds bounds to flipped partials - bottom', () => {
    isFixed('=A1:1', '=1:1', opt);
    isFixed('=A1:4', '=1:4', opt);
    isFixed('=1:A1', '=1:1', opt);
    isFixed('=$A1:1', '=1:1', opt);
    isFixed('=A$1:1', '=$1:1', opt);
    isFixed('=A1:$1', '=1:$1', opt);
    isFixed('=B1:1', '=B1:XFD1', opt);
    isFixed('=1:B1', '=B1:XFD1', opt);
    isFixed('=B2:20', '=B2:XFD20', opt);
    isFixed('=2:B20', '=B2:XFD20', opt);
    isFixed('=2:.B20', '=B2:.XFD20', opt);
  });
});

describe('fixRanges structured references', () => {
  test('fixes this row references', () => {
    isFixed('=Table1[[#This Row],[Foo]]', '=Table1[@Foo]');
    isFixed('=[[#This Row],[s:s]]', '=[@[s:s]]');
  });

  test('fixes column ranges', () => {
    isFixed('=Table1[[#Totals],col name:Foo]', '=Table1[[#Totals],[col name]:[Foo]]');
  });

  test('fixes special identifiers order', () => {
    isFixed('[[#data],[#headers]]', '[[#Headers],[#Data]]');
    isFixed('[[#headers],[#data]]', '[[#Headers],[#Data]]');
    isFixed('[[#totals],[#data]]', '[[#Data],[#Totals]]');
    isFixed('[ [#totals], [#data] ]', '[[#Data],[#Totals]]');
    isFixed('[[#data],[#totals]]', '[[#Data],[#Totals]]');
  });

  test('fixes column references', () => {
    isFixed('[[#all],foo:bar]', '[[#All],[foo]:[bar]]');
    isFixed('[[#all],[#all],[#all],[#all],[ColumnName]]', '[[#All],[ColumnName]]');
    isFixed('[@[foo]:bar]', '[@[foo]:[bar]]');
    isFixed('[@foo bar]', '[@[foo bar]]');
  });

  test('preserves whitespace in column headers', () => {
    // Care must be taken with spaces in column headers.
    // Excel considers refs only valid if they match the column name
    // but the parser does not know the names, so it must preserve
    // leading/trailing whitespace.
    isFixed('[ @[foo bar] ]', '[@[foo bar]]');
    isFixed('[ @[ foo bar ] ]', '[@[ foo bar ]]');
    isFixed('[ @foo bar ]', '[@[foo bar ]]');
    isFixed('[@ foo bar]', '[@[ foo bar]]');
    isFixed('[ @ foo bar ]', '[@[ foo bar ]]');
  });
});

describe('fixRanges works with xlsx mode', () => {
  test('should not mess with invalid ranges in normal mode', () => {
    isFixed("='[Workbook]'!Table[Column]", "='[Workbook]'!Table[Column]");
    isFixed('=[Workbook]!Table[Column]', '=[Workbook]!Table[Column]');
    isFixed("='[Foo]'!A1", "='[Foo]'!A1");
    isFixed('=[Foo]!A1', '=[Foo]!A1');
  });

  test('should fix things in xlsx mode', () => {
    const opts = { xlsx: true };
    isFixed("='[Workbook]'!Table[Column]", '=[Workbook]!Table[Column]', opts);
    isFixed('=[Workbook]!Table[Column]', '=[Workbook]!Table[Column]', opts);
    isFixed('=[Lorem Ipsum]!Table[Column]', "='[Lorem Ipsum]'!Table[Column]", opts);
    isFixed("='[Foo]'!A1", '=[Foo]!A1', opts);
    isFixed('=[Foo]Bar!A1', '=[Foo]Bar!A1', opts);
    isFixed('=[Foo Bar]Baz!A1', "='[Foo Bar]Baz'!A1", opts);
    isFixed('=[Foo]!A1', '=[Foo]!A1', opts);
    isFixed('=[Lorem Ipsum]!A1', "='[Lorem Ipsum]'!A1", opts);
  });
});
