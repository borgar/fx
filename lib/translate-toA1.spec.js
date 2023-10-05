import { test, Test } from 'tape';
import { translateToA1 } from './translate.js';
import { tokenize } from './lexer.js';
import { addTokenMeta } from './addTokenMeta.js';
import { ERROR, FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_BEAM, REF_STRUCT } from './constants.js';

Test.prototype.isR2A = function isTokens (expr, anchor, result, opts) {
  this.is(translateToA1(expr, anchor, opts), result, expr);
};

test('translate absolute cells from RC to A1', t => {
  t.isR2A('=R1C1', 'B2', '=$A$1');
  t.isR2A('=R2C1', 'B2', '=$A$2');
  t.isR2A('=R3C1', 'B2', '=$A$3');
  t.isR2A('=R1C2', 'B2', '=$B$1');
  t.isR2A('=R2C2', 'B2', '=$B$2');
  t.isR2A('=R3C2', 'B2', '=$B$3');
  t.isR2A('=R1C3', 'B2', '=$C$1');
  t.isR2A('=R2C3', 'B2', '=$C$2');
  t.isR2A('=R3C3', 'B2', '=$C$3');
  // absolute cells, anchor has no real effect
  t.isR2A('=R1C1', 'Z19', '=$A$1');
  t.isR2A('=R2C1', 'Z19', '=$A$2');
  t.isR2A('=R3C1', 'Z19', '=$A$3');
  t.isR2A('=R1C2', 'Z19', '=$B$1');
  t.isR2A('=R2C2', 'Z19', '=$B$2');
  t.isR2A('=R3C2', 'Z19', '=$B$3');
  t.isR2A('=R1C3', 'Z19', '=$C$1');
  t.isR2A('=R2C3', 'Z19', '=$C$2');
  t.isR2A('=R3C3', 'Z19', '=$C$3');
  t.end();
});

test('translate relative cells from RC to A1', t => {
  t.isR2A('=R[-1]C[-1]', 'B2', '=A1');
  t.isR2A('=RC[-1]', 'B2', '=A2');
  t.isR2A('=R[1]C[-1]', 'B2', '=A3');
  t.isR2A('=R[-1]C', 'B2', '=B1');
  t.isR2A('=RC', 'B2', '=B2');
  t.isR2A('=R[1]C', 'B2', '=B3');
  t.isR2A('=R[-1]C[1]', 'B2', '=C1');
  t.isR2A('=RC[1]', 'B2', '=C2');
  t.isR2A('=R[1]C[1]', 'B2', '=C3');
  // relative cells move with anchor
  t.isR2A('=R[-1]C[-1]', 'I12', '=H11');
  t.isR2A('=RC[-1]', 'I12', '=H12');
  t.isR2A('=R[1]C[-1]', 'I12', '=H13');
  t.isR2A('=R[-1]C', 'I12', '=I11');
  t.isR2A('=RC', 'I12', '=I12');
  t.isR2A('=R[1]C', 'I12', '=I13');
  t.isR2A('=R[-1]C[1]', 'I12', '=J11');
  t.isR2A('=RC[1]', 'I12', '=J12');
  t.isR2A('=R[1]C[1]', 'I12', '=J13');
  // relative cells, but with [0] notation
  t.isR2A('=R[0]C[-1]', 'B2', '=A2');
  t.isR2A('=R[-1]C[0]', 'B2', '=B1');
  t.isR2A('=R[0]C[0]', 'B2', '=B2');
  t.isR2A('=R[1]C[0]', 'B2', '=B3');
  t.isR2A('=R[0]C[1]', 'B2', '=C2');
  t.end();
});

test('translate rows from RC to A1', t => {
  t.isR2A('=R', 'B2', '=2:2');
  t.isR2A('=R[0]', 'B2', '=2:2');
  t.isR2A('=R', 'B13', '=13:13');
  t.isR2A('=R:R', 'B2', '=2:2');
  t.isR2A('=R2:R2', 'B2', '=$2:$2');
  t.isR2A('=R:R2', 'B2', '=2:$2');
  t.isR2A('=R[1]:R[-1]', 'Z10', '=9:11');
  t.end();
});

test('translate cols from RC to A1', t => {
  t.isR2A('=C', 'B2', '=B:B');
  t.isR2A('=C[0]', 'B2', '=B:B');
  t.isR2A('=C', 'Z2', '=Z:Z');
  t.isR2A('=C:C', 'B2', '=B:B');
  t.isR2A('=C2:C2', 'B2', '=$B:$B');
  t.isR2A('=C:C2', 'B2', '=B:$B');
  t.isR2A('=C[1]:C[-1]', 'M10', '=L:N');
  t.end();
});

test('translate partials from RC to A1', t => {
  t.isR2A('=R[-5]C[-2]:C[-2]', 'C6', '=A1:A');
  t.isR2A('=R[-5]C[-3]:R[-5]', 'D6', '=A1:1');
  t.isR2A('=R[-6]C1:C1', 'C7', '=$A1:$A');
  t.isR2A('=C1:R[-6]C1', 'D7', '=$A1:$A');
  t.isR2A('=R[-6]C1:R[-6]', 'C7', '=$A1:1');
  t.isR2A('=R[-6]:R[-6]C1', 'C7', '=$A1:1');
  t.isR2A('=R1C[-2]:C[-2]', 'C6', '=A$1:A');
  t.isR2A('=C[-2]:R1C[-2]', 'C6', '=A$1:A');
  t.isR2A('=R1C[-3]:R1', 'D6', '=A$1:$1');
  t.isR2A('=R1C[-3]:R1', 'D6', '=A$1:$1');
  t.isR2A('=R1C1:C1', 'D6', '=$A$1:$A');
  t.isR2A('=C1:R1C1', 'D6', '=$A$1:$A');
  t.isR2A('=R1C1:R1', 'D6', '=$A$1:$1');
  t.isR2A('=R1:R1C1', 'D6', '=$A$1:$1');
  t.end();
});

test('translate bounds coords from RC to A1', t => {
  t.isR2A('=C[-1]', 'A1', '=XFD:XFD');
  t.isR2A('=C[-2]', 'A1', '=XFC:XFC');
  t.isR2A('=RC[16383]', 'B1', '=A1');
  t.isR2A('=RC[16383]', 'C1', '=B1');
  t.isR2A('=R[-1]', 'A1', '=1048576:1048576');
  t.isR2A('=R[-2]', 'A1', '=1048575:1048575');
  t.isR2A('=R[1048575]C', 'A2', '=A1');
  t.isR2A('=R[1048575]C', 'A3', '=A2');

  t.isR2A('=R1:R1048576', 'A1', '=$1:$1048576');
  t.isR2A('=C1:C16384', 'A1', '=$A:$XFD');
  t.isR2A('=R1C1:R1048576C16384', 'A1', '=$A$1:$XFD$1048576');

  const f1 = '=R[-1]C[-1]';
  t.is(translateToA1(f1, 'A1', { wrapEdges: false }), '=#REF!', f1);

  const tokens = addTokenMeta(tokenize('SUM(Sheet1!R[-1]C[-1])', { r1c1: true, withLocation: true }));
  t.deepEqual(translateToA1(tokens, 'A1', { wrapEdges: false }), [
    { type: FUNCTION, value: 'SUM', loc: [ 0, 3 ], index: 0, depth: 0 },
    { type: OPERATOR, value: '(', loc: [ 3, 4 ], index: 1, depth: 1, groupId: 'fxg1' },
    { type: ERROR, value: '#REF!', loc: [ 4, 9 ], index: 2, depth: 1 },
    { type: OPERATOR, value: ')', loc: [ 9, 10 ], index: 3, depth: 1, groupId: 'fxg1' }
  ], 'tokens with meta');

  const f2 = '=Sheet4!R[-2]C[-2]:R[-1]C[-1]';
  t.is(translateToA1(f2, 'B2', { wrapEdges: false }), '=#REF!', f2);

  const f3 = '=Sheet4!R[-2]C[-2]:R[-1]C[-1]';
  t.is(translateToA1(f3, 'B2', { wrapEdges: false, mergeRefs: false }), '=Sheet4!#REF!:A1', f3);

  t.end();
});

test('translate mixed rel/abs coords from RC to A1', t => {
  t.isR2A('=R1C[0]', 'B2', '=B$1');
  t.isR2A('=R[4]C4', 'B4', '=$D8');
  t.isR2A('=R[4]:R10', 'B4', '=8:$10');
  t.isR2A('=C10:C[10]', 'B4', '=$J:L');
  t.isR2A('=R1C1:R2C2', 'D4', '=$A$1:$B$2');
  t.isR2A('=R[-1]C[-1]:R[2]C[2]', 'D4', '=C3:F6');
  t.end();
});

test('translate involved formula from RC to A1', t => {
  t.isR2A('=SUM(IF(RC[1],R2C5,R3C5),Sheet1!R2*Sheet2!C[-2])', 'D10',
    '=SUM(IF(E10,$E$2,$E$3),Sheet1!$2:$2*Sheet2!B:B)');
  t.end();
});

test('translate works with merged ranges', t => {
  // This tests that:
  // - Translate works with ranges that have context attached
  // - If input is a tokenlist, output is also a tokenlist
  // - If tokens have ranges, those ranges are adjusted to new token lengths
  // - Properties added by addTokenMeta are preserved
  const expr = '=SUM(IF(RC[1],R2C5,R3C5),Sheet1!R2*Sheet2!C[-2])';
  const tokens = addTokenMeta(tokenize(expr, { withLocation: true, r1c1: true }));
  const expected = [
    { type: FX_PREFIX, value: '=', loc: [ 0, 1 ], index: 0, depth: 0 },
    { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ], index: 1, depth: 0 },
    { type: OPERATOR, value: '(', loc: [ 4, 5 ], index: 2, depth: 1, groupId: 'fxg3' },
    { type: FUNCTION, value: 'IF', loc: [ 5, 7 ], index: 3, depth: 1 },
    { type: OPERATOR, value: '(', loc: [ 7, 8 ], index: 4, depth: 2, groupId: 'fxg1' },
    { type: REF_RANGE, value: 'E10', loc: [ 8, 11 ], index: 5, depth: 2 },
    { type: OPERATOR, value: ',', loc: [ 11, 12 ], index: 6, depth: 2 },
    { type: REF_RANGE, value: '$E$2', loc: [ 12, 16 ], index: 7, depth: 2 },
    { type: OPERATOR, value: ',', loc: [ 16, 17 ], index: 8, depth: 2 },
    { type: REF_RANGE, value: '$E$3', loc: [ 17, 21 ], index: 9, depth: 2 },
    { type: OPERATOR, value: ')', loc: [ 21, 22 ], index: 10, depth: 2, groupId: 'fxg1' },
    { type: OPERATOR, value: ',', loc: [ 22, 23 ], index: 11, depth: 1 },
    { type: REF_BEAM, value: 'Sheet1!$2:$2', loc: [ 23, 35 ], index: 12, depth: 1, groupId: 'fxg2' },
    { type: OPERATOR, value: '*', loc: [ 35, 36 ], index: 13, depth: 1 },
    { type: REF_BEAM, value: 'Sheet2!B:B', loc: [ 36, 46 ], index: 14, depth: 1 },
    { type: OPERATOR, value: ')', loc: [ 46, 47 ], index: 15, depth: 1, groupId: 'fxg3' }
  ];
  t.deepEqual(translateToA1(tokens, 'D10'), expected, expr);
  t.end();
});

test('translate works with xlsx mode references', t => {
  const testExpr = (expr, anchor, expected) => {
    const opts = { mergeRefs: true, xlsx: true, r1c1: true };
    t.deepEqual(translateToA1(tokenize(expr, opts), anchor, opts), expected, expr);
  };
  testExpr("'[My Fancy Workbook.xlsx]'!R1C", 'B2', [
    { type: REF_RANGE, value: "'[My Fancy Workbook.xlsx]'!B$1" }
  ]);
  testExpr('[Workbook.xlsx]!R1C', 'B2', [
    { type: REF_RANGE, value: '[Workbook.xlsx]!B$1' }
  ]);
  testExpr('[Workbook.xlsx]Sheet1!R1C', 'B2', [
    { type: REF_RANGE, value: '[Workbook.xlsx]Sheet1!B$1' }
  ]);
  testExpr('[Workbook.xlsx]!table[#data]', 'B2', [
    { type: REF_STRUCT, value: '[Workbook.xlsx]!table[#data]' }
  ]);
  t.end();
});
