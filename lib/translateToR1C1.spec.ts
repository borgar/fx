import { describe, test, expect } from 'vitest';
import { translateToR1C1 } from './translateToR1C1.ts';
import { tokenize } from './tokenize.ts';
import { addTokenMeta } from './addTokenMeta.ts';
import { FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_BEAM, REF_STRUCT } from './constants.ts';

function isA2R (expr: string, anchor: string, result: string) {
  expect(translateToR1C1(expr, anchor)).toBe(result);
}

describe('translate absolute cells from A1 to RC', () => {
  test('absolute cells with B2 anchor', () => {
    isA2R('=$A$1', 'B2', '=R1C1');
    isA2R('=$A$2', 'B2', '=R2C1');
    isA2R('=$A$3', 'B2', '=R3C1');
    isA2R('=$B$1', 'B2', '=R1C2');
    isA2R('=$B$2', 'B2', '=R2C2');
    isA2R('=$B$3', 'B2', '=R3C2');
    isA2R('=$C$1', 'B2', '=R1C3');
    isA2R('=$C$2', 'B2', '=R2C3');
    isA2R('=$C$3', 'B2', '=R3C3');
  });

  test('absolute cells with Z19 anchor', () => {
    // absolute cells, anchor has no real effect
    isA2R('=$A$1', 'Z19', '=R1C1');
    isA2R('=$A$2', 'Z19', '=R2C1');
    isA2R('=$A$3', 'Z19', '=R3C1');
    isA2R('=$B$1', 'Z19', '=R1C2');
    isA2R('=$B$2', 'Z19', '=R2C2');
    isA2R('=$B$3', 'Z19', '=R3C2');
    isA2R('=$C$1', 'Z19', '=R1C3');
    isA2R('=$C$2', 'Z19', '=R2C3');
    isA2R('=$C$3', 'Z19', '=R3C3');
  });
});

describe('translate relative cells from A1 to RC', () => {
  test('relative cells with B2 anchor', () => {
    isA2R('=A1', 'B2', '=R[-1]C[-1]');
    isA2R('=A2', 'B2', '=RC[-1]');
    isA2R('=A3', 'B2', '=R[1]C[-1]');
    isA2R('=B1', 'B2', '=R[-1]C');
    isA2R('=B2', 'B2', '=RC');
    isA2R('=B3', 'B2', '=R[1]C');
    isA2R('=C1', 'B2', '=R[-1]C[1]');
    isA2R('=C2', 'B2', '=RC[1]');
    isA2R('=C3', 'B2', '=R[1]C[1]');
  });

  test('relative cells with I12 anchor', () => {
    // relative cells, but with [0] notation
    isA2R('=H11', 'I12', '=R[-1]C[-1]');
    isA2R('=H12', 'I12', '=RC[-1]');
    isA2R('=H13', 'I12', '=R[1]C[-1]');
    isA2R('=I11', 'I12', '=R[-1]C');
    isA2R('=I12', 'I12', '=RC');
    isA2R('=I13', 'I12', '=R[1]C');
    isA2R('=J11', 'I12', '=R[-1]C[1]');
    isA2R('=J12', 'I12', '=RC[1]');
    isA2R('=J13', 'I12', '=R[1]C[1]');
  });
});

describe('translate rows from A1 to RC', () => {
  test('relative row references', () => {
    isA2R('=2:2', 'B1', '=R[1]');
    isA2R('=2:2', 'B2', '=R');
    isA2R('=2:2', 'B3', '=R[-1]');
    isA2R('=13:13', 'B13', '=R');
  });

  test('mixed row references', () => {
    isA2R('=$2:$2', 'B2', '=R2');
    isA2R('=2:$2', 'B2', '=R:R2');
    isA2R('=11:9', 'Z10', '=R[-1]:R[1]');
  });
});

describe('translate cols from A1 to RC', () => {
  test('relative column references', () => {
    isA2R('=B:B', 'A2', '=C[1]');
    isA2R('=B:B', 'B2', '=C');
    isA2R('=B:B', 'C2', '=C[-1]');
    isA2R('=Z:Z', 'Z2', '=C');
  });

  test('mixed column references', () => {
    isA2R('=$B:$B', 'B2', '=C2');
    isA2R('=B:$B', 'B2', '=C:C2');
    isA2R('=N:L', 'M10', '=C[-1]:C[1]');
  });
});

describe('translate partials from A1 to RC', () => {
  test('partial range references', () => {
    isA2R('=A1:A', 'C6', '=R[-5]C[-2]:C[-2]');
    isA2R('=A1:1', 'D6', '=R[-5]C[-3]:R[-5]');
    isA2R('=$A1:$A', 'C7', '=R[-6]C1:C1');
    isA2R('=$A:$A1', 'D7', '=R[-6]C1:C1');
    isA2R('=$A1:1', 'C7', '=R[-6]C1:R[-6]');
    isA2R('=1:$A1', 'C7', '=R[-6]C1:R[-6]');
    isA2R('=A$1:A', 'C6', '=R1C[-2]:C[-2]');
    isA2R('=A:A$1', 'C6', '=R1C[-2]:C[-2]');
    isA2R('=A$1:$1', 'D6', '=R1C[-3]:R1');
    isA2R('=$1:A$1', 'D6', '=R1C[-3]:R1');
    isA2R('=$A$1:$A', 'D6', '=R1C1:C1');
    isA2R('=$A:$A$1', 'D6', '=R1C1:C1');
    isA2R('=$A$1:$1', 'D6', '=R1C1:R1');
    isA2R('=$1:$A$1', 'D6', '=R1C1:R1');
  });
});

describe('translate boundary coords from A1 to RC', () => {
  test('boundary coordinate references', () => {
    isA2R('=XFD:XFD', 'A1', '=C[16383]');
    isA2R('=A1', 'B1', '=RC[-1]');
    isA2R('=B1', 'C1', '=RC[-1]');
    isA2R('=1048576:1048576', 'A1', '=R[1048575]');
    isA2R('=$1:$1048576', 'A1', '=R1:R1048576');
    isA2R('=$A:$XFD', 'A1', '=C1:C16384');
    isA2R('=$A$1:$XFD$1048576', 'A1', '=R1C1:R1048576C16384');
    isA2R('=A1', 'A2', '=R[-1]C');
    isA2R('=A2', 'A3', '=R[-1]C');
  });
});

describe('translate mixed rel/abs coords from A1 to RC', () => {
  test('mixed relative/absolute references', () => {
    isA2R('=B$1', 'B2', '=R1C');
    isA2R('=$D8', 'B4', '=R[4]C4');
    isA2R('=8:$10', 'B4', '=R[4]:R10');
    isA2R('=$J:L', 'B4', '=C10:C[10]');
    isA2R('=$A$1:$B$2', 'D4', '=R1C1:R2C2');
    isA2R('=C3:F6', 'D4', '=R[-1]C[-1]:R[2]C[2]');
  });
});

describe('translate involved cases from A1 to RC', () => {
  test('complex function expressions', () => {
    isA2R('=SUM(IF(E10,$E$2,$E$3),Sheet1!$2:$2*Sheet2!B:B)', 'D10',
      '=SUM(IF(RC[1],R2C5,R3C5),Sheet1!R2*Sheet2!C[-2])');
  });

  test('expressions with structured and named references', () => {
    // make sure we don't get confused by structured, or named refs
    isA2R('=A1+Table1[#Data]', 'D10', '=R[-9]C[-3]+Table1[#Data]');
    isA2R('=A1+foobar', 'D10', '=R[-9]C[-3]+foobar');
  });

  test('XLSX internal syntax', () => {
    // This [123]Sheet!A1 variant of the syntax is used internally in xlsx files
    isA2R('=[2]Sheet1!A1', 'D10', '=[2]Sheet1!R[-9]C[-3]');
  });
});

describe('translate works with merged ranges', () => {
  test('preserves token metadata and locations', () => {
    // This tests that:
    // - Translate works with ranges that have context attached
    // - If input is a tokenlist, output is also a tokenlist
    // - If tokens have ranges, those ranges are adjusted to new token lengths
    // - Properties added by addTokenMeta are preserved
    const expr = '=SUM(IF(E10,$E$2,$E$3),Sheet1!$2:$2*Sheet2!B:B)';
    const tokens = addTokenMeta(tokenize(expr, { withLocation: true }));
    const expected = [
      { type: FX_PREFIX, value: '=', loc: [ 0, 1 ], index: 0, depth: 0 },
      { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ], index: 1, depth: 0 },
      { type: OPERATOR, value: '(', loc: [ 4, 5 ], index: 2, depth: 1, groupId: 'fxg7' },
      { type: FUNCTION, value: 'IF', loc: [ 5, 7 ], index: 3, depth: 1 },
      { type: OPERATOR, value: '(', loc: [ 7, 8 ], index: 4, depth: 2, groupId: 'fxg4' },
      { type: REF_RANGE, value: 'RC[1]', loc: [ 8, 13 ], index: 5, depth: 2, groupId: 'fxg1' },
      { type: OPERATOR, value: ',', loc: [ 13, 14 ], index: 6, depth: 2 },
      { type: REF_RANGE, value: 'R2C5', loc: [ 14, 18 ], index: 7, depth: 2, groupId: 'fxg2' },
      { type: OPERATOR, value: ',', loc: [ 18, 19 ], index: 8, depth: 2 },
      { type: REF_RANGE, value: 'R3C5', loc: [ 19, 23 ], index: 9, depth: 2, groupId: 'fxg3' },
      { type: OPERATOR, value: ')', loc: [ 23, 24 ], index: 10, depth: 2, groupId: 'fxg4' },
      { type: OPERATOR, value: ',', loc: [ 24, 25 ], index: 11, depth: 1 },
      { type: REF_BEAM, value: 'Sheet1!R2', loc: [ 25, 34 ], index: 12, depth: 1, groupId: 'fxg5' },
      { type: OPERATOR, value: '*', loc: [ 34, 35 ], index: 13, depth: 1 },
      { type: REF_BEAM, value: 'Sheet2!C[-2]', loc: [ 35, 47 ], index: 14, depth: 1, groupId: 'fxg6' },
      { type: OPERATOR, value: ')', loc: [ 47, 48 ], index: 15, depth: 1, groupId: 'fxg7' }
    ];
    expect(translateToR1C1(tokens, 'D10')).toEqual(expected);
  });
});

describe('translate works with xlsx mode', () => {
  function testExpr (expr: string, anchor: string, expected: any[]) {
    const opts = { mergeRefs: true, xlsx: true, r1c1: false };
    const tokens = tokenize(expr, opts);
    expect(translateToR1C1(tokens, anchor, opts)).toEqual(expected);
  }

  test('XLSX workbook references', () => {
    testExpr("'[My Fancy Workbook.xlsx]'!B$1", 'B2', [
      { type: REF_RANGE, value: "'[My Fancy Workbook.xlsx]'!R1C" }
    ]);

    testExpr('[Workbook.xlsx]!B$1', 'B2', [
      { type: REF_RANGE, value: '[Workbook.xlsx]!R1C' }
    ]);

    testExpr('[Workbook.xlsx]Sheet1!B$1', 'B2', [
      { type: REF_RANGE, value: '[Workbook.xlsx]Sheet1!R1C' }
    ]);

    testExpr('[Workbook.xlsx]!table[#data]', 'B2', [
      { type: REF_STRUCT, value: '[Workbook.xlsx]!table[#data]' }
    ]);
  });
});

describe('translate works with trimmed ranges', () => {
  function testExpr (expr: string, anchor: string, expected: any[]) {
    const opts = { mergeRefs: true, xlsx: true, r1c1: false };
    expect(translateToR1C1(tokenize(expr, opts), anchor, opts)).toEqual(expected);
  }

  test('trimmed range translation', () => {
    testExpr('Sheet!A1.:.B2*Sheet2!AZ.:.ZZ', 'B2', [
      { type: 'range', value: 'Sheet!R[-1]C[-1].:.RC' },
      { type: 'operator', value: '*' },
      { type: 'range_beam', value: 'Sheet2!C[50].:.C[700]' }
    ]);
  });
});
