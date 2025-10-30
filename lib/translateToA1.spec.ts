import { describe, test, expect } from 'vitest';
import { translateFormulaToA1, translateTokensToA1 } from './translateToA1.ts';
import { tokenize } from './tokenize.ts';
import { addTokenMeta } from './addTokenMeta.ts';
import { ERROR, FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_BEAM, REF_STRUCT } from './constants.ts';

function isR2A (expr: string, anchor: string, result: string, opts?: any) {
  expect(translateFormulaToA1(expr, anchor, opts)).toBe(result);
}

describe('translate absolute cells from RC to A1', () => {
  test('absolute cells with B2 anchor', () => {
    isR2A('=R1C1', 'B2', '=$A$1');
    isR2A('=R2C1', 'B2', '=$A$2');
    isR2A('=R3C1', 'B2', '=$A$3');
    isR2A('=R1C2', 'B2', '=$B$1');
    isR2A('=R2C2', 'B2', '=$B$2');
    isR2A('=R3C2', 'B2', '=$B$3');
    isR2A('=R1C3', 'B2', '=$C$1');
    isR2A('=R2C3', 'B2', '=$C$2');
    isR2A('=R3C3', 'B2', '=$C$3');
  });

  test('absolute cells with Z19 anchor', () => {
    // absolute cells, anchor has no real effect
    isR2A('=R1C1', 'Z19', '=$A$1');
    isR2A('=R2C1', 'Z19', '=$A$2');
    isR2A('=R3C1', 'Z19', '=$A$3');
    isR2A('=R1C2', 'Z19', '=$B$1');
    isR2A('=R2C2', 'Z19', '=$B$2');
    isR2A('=R3C2', 'Z19', '=$B$3');
    isR2A('=R1C3', 'Z19', '=$C$1');
    isR2A('=R2C3', 'Z19', '=$C$2');
    isR2A('=R3C3', 'Z19', '=$C$3');
  });
});

describe('translate relative cells from RC to A1', () => {
  test('relative cells with B2 anchor', () => {
    isR2A('=R[-1]C[-1]', 'B2', '=A1');
    isR2A('=RC[-1]', 'B2', '=A2');
    isR2A('=R[1]C[-1]', 'B2', '=A3');
    isR2A('=R[-1]C', 'B2', '=B1');
    isR2A('=RC', 'B2', '=B2');
    isR2A('=R[1]C', 'B2', '=B3');
    isR2A('=R[-1]C[1]', 'B2', '=C1');
    isR2A('=RC[1]', 'B2', '=C2');
    isR2A('=R[1]C[1]', 'B2', '=C3');
  });

  test('relative cells with I12 anchor', () => {
    // relative cells move with anchor
    isR2A('=R[-1]C[-1]', 'I12', '=H11');
    isR2A('=RC[-1]', 'I12', '=H12');
    isR2A('=R[1]C[-1]', 'I12', '=H13');
    isR2A('=R[-1]C', 'I12', '=I11');
    isR2A('=RC', 'I12', '=I12');
    isR2A('=R[1]C', 'I12', '=I13');
    isR2A('=R[-1]C[1]', 'I12', '=J11');
    isR2A('=RC[1]', 'I12', '=J12');
    isR2A('=R[1]C[1]', 'I12', '=J13');
  });

  test('relative cells with explicit [0] notation', () => {
    isR2A('=R[0]C[-1]', 'B2', '=A2');
    isR2A('=R[-1]C[0]', 'B2', '=B1');
    isR2A('=R[0]C[0]', 'B2', '=B2');
    isR2A('=R[1]C[0]', 'B2', '=B3');
    isR2A('=R[0]C[1]', 'B2', '=C2');
  });
});

describe('translate rows from RC to A1', () => {
  test('relative and absolute row references', () => {
    isR2A('=R', 'B2', '=2:2');
    isR2A('=R[0]', 'B2', '=2:2');
    isR2A('=R', 'B13', '=13:13');
    isR2A('=R:R', 'B2', '=2:2');
    isR2A('=R2:R2', 'B2', '=$2:$2');
    isR2A('=R:R2', 'B2', '=2:$2');
    isR2A('=R[1]:R[-1]', 'Z10', '=9:11');
  });
});

describe('translate cols from RC to A1', () => {
  test('relative and absolute column references', () => {
    isR2A('=C', 'B2', '=B:B');
    isR2A('=C[0]', 'B2', '=B:B');
    isR2A('=C', 'Z2', '=Z:Z');
    isR2A('=C:C', 'B2', '=B:B');
    isR2A('=C2:C2', 'B2', '=$B:$B');
    isR2A('=C:C2', 'B2', '=B:$B');
    isR2A('=C[1]:C[-1]', 'M10', '=L:N');
  });
});

describe('translate partials from RC to A1', () => {
  test('partial range references', () => {
    isR2A('=R[-5]C[-2]:C[-2]', 'C6', '=A1:A');
    isR2A('=R[-5]C[-3]:R[-5]', 'D6', '=A1:1');
    isR2A('=R[-6]C1:C1', 'C7', '=$A1:$A');
    isR2A('=C1:R[-6]C1', 'D7', '=$A1:$A');
    isR2A('=R[-6]C1:R[-6]', 'C7', '=$A1:1');
    isR2A('=R[-6]:R[-6]C1', 'C7', '=$A1:1');
    isR2A('=R1C[-2]:C[-2]', 'C6', '=A$1:A');
    isR2A('=C[-2]:R1C[-2]', 'C6', '=A$1:A');
    isR2A('=R1C[-3]:R1', 'D6', '=A$1:$1');
    isR2A('=R1C1:C1', 'D6', '=$A$1:$A');
    isR2A('=C1:R1C1', 'D6', '=$A$1:$A');
    isR2A('=R1C1:R1', 'D6', '=$A$1:$1');
    isR2A('=R1:R1C1', 'D6', '=$A$1:$1');
  });
});

describe('translate bounds coords from RC to A1', () => {
  test('boundary coordinate references', () => {
    isR2A('=C[-1]', 'A1', '=XFD:XFD');
    isR2A('=C[-2]', 'A1', '=XFC:XFC');
    isR2A('=RC[16383]', 'B1', '=A1');
    isR2A('=RC[16383]', 'C1', '=B1');
    isR2A('=R[-1]', 'A1', '=1048576:1048576');
    isR2A('=R[-2]', 'A1', '=1048575:1048575');
    isR2A('=R[1048575]C', 'A2', '=A1');
    isR2A('=R[1048575]C', 'A3', '=A2');

    isR2A('=R1:R1048576', 'A1', '=$1:$1048576');
    isR2A('=C1:C16384', 'A1', '=$A:$XFD');
    isR2A('=R1C1:R1048576C16384', 'A1', '=$A$1:$XFD$1048576');
  });

  test('out of bounds references with wrapEdges disabled', () => {
    const f1 = '=R[-1]C[-1]';
    expect(translateFormulaToA1(f1, 'A1', { wrapEdges: false })).toBe('=#REF!');

    const tokens = addTokenMeta(tokenize('SUM(Sheet1!R[-1]C[-1])', { r1c1: true, withLocation: true }));
    expect(translateTokensToA1(tokens, 'A1', { wrapEdges: false })).toEqual([
      { type: FUNCTION, value: 'SUM', loc: [ 0, 3 ], index: 0, depth: 0 },
      { type: OPERATOR, value: '(', loc: [ 3, 4 ], index: 1, depth: 1, groupId: 'fxg1' },
      { type: ERROR, value: '#REF!', loc: [ 4, 9 ], index: 2, depth: 1 },
      { type: OPERATOR, value: ')', loc: [ 9, 10 ], index: 3, depth: 1, groupId: 'fxg1' }
    ]);

    const f2 = '=Sheet4!R[-2]C[-2]:R[-1]C[-1]';
    expect(translateFormulaToA1(f2, 'B2', { wrapEdges: false })).toBe('=#REF!');

    const f3 = '=Sheet4!R[-2]C[-2]:R[-1]C[-1]';
    expect(translateFormulaToA1(f3, 'B2', { wrapEdges: false, mergeRefs: false })).toBe('=Sheet4!#REF!:A1');
  });
});

describe('translate mixed rel/abs coords from RC to A1', () => {
  test('mixed relative/absolute references', () => {
    isR2A('=R1C[0]', 'B2', '=B$1');
    isR2A('=R[4]C4', 'B4', '=$D8');
    isR2A('=R[4]:R10', 'B4', '=8:$10');
    isR2A('=C10:C[10]', 'B4', '=$J:L');
    isR2A('=R1C1:R2C2', 'D4', '=$A$1:$B$2');
    isR2A('=R[-1]C[-1]:R[2]C[2]', 'D4', '=C3:F6');
  });
});

describe('translate involved formula from RC to A1', () => {
  test('complex function expressions', () => {
    isR2A('=SUM(IF(RC[1],R2C5,R3C5),Sheet1!R2*Sheet2!C[-2])', 'D10',
      '=SUM(IF(E10,$E$2,$E$3),Sheet1!$2:$2*Sheet2!B:B)');
  });
});

describe('translate works with merged ranges', () => {
  test('preserves token metadata and locations', () => {
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
    expect(translateTokensToA1(tokens, 'D10')).toEqual(expected);
  });
});

describe('translate works with xlsx mode references', () => {
  function testExpr (expr: string, anchor: string, expected: any[]) {
    const opts = { mergeRefs: true, xlsx: true, r1c1: true };
    expect(translateTokensToA1(tokenize(expr, opts), anchor, opts)).toEqual(expected);
  }

  test('XLSX workbook references', () => {
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
  });
});

describe('translate works with trimmed ranges', () => {
  function testExpr (expr: string, anchor: string, expected: any[]) {
    const opts = { mergeRefs: true, xlsx: true, r1c1: true };
    expect(translateTokensToA1(tokenize(expr, opts), anchor, opts)).toEqual(expected);
  }

  test('trimmed range translation', () => {
    testExpr('Sheet!R[-1]C[-1].:.RC*Sheet2!C[50].:.C[700]', 'B2', [
      { type: 'range', value: 'Sheet!A1.:.B2' },
      { type: 'operator', value: '*' },
      { type: 'range_beam', value: 'Sheet2!AZ.:.ZZ' }
    ]);
  });
});
