import { describe, test, expect } from 'vitest';
import { translateFormulaToR1C1 } from './translateToR1C1.ts';
import { translateFormulaToA1 } from './translateToA1.ts';

function okayRoundTrip (expr: string, anchor: string, options?: any) {
  const rc = translateFormulaToR1C1(expr, anchor, options);
  const a1 = translateFormulaToA1(rc, anchor, options);
  expect(a1).toBe(expr);
}

describe('translate absolute cells from A1 to RC', () => {
  test('sheet qualified ranges', () => {
    okayRoundTrip('=Sheet1!$1:$1048576', 'A1');
  });

  test('mixed absolute ranges', () => {
    okayRoundTrip('=D$1:$BJ$1048576', 'A1');
  });

  test('function calls with ranges', () => {
    okayRoundTrip('=VLOOKUP(C7,Röðun,4,0)', 'A1');
    okayRoundTrip('=COUNTIF(B$1442:B$1048576,$G1442)', 'A1');
  });

  test('complex expressions', () => {
    okayRoundTrip('=IF(p2m<=D5,10,0)*scene_spend', 'A1');
    okayRoundTrip('=(kwh_used_daily*kwhbtu*co2btu)/1000000', 'A1');
    okayRoundTrip('=NOPLATT1+g1_+ROIC1+WACC+G1+g1_+G130+ROIC2+WACC+g2_+WACC+N', 'A1');
  });

  test('3-D references', () => {
    okayRoundTrip('=Jan:Dec!A1', 'C3');
    okayRoundTrip('=SUM(Sales:Marketing!B3)', 'C3');
    okayRoundTrip('=Sheet1:Sheet2!A1:B2', 'C3');
    okayRoundTrip("=SUM('Sheet 1:Sheet 2'!A1:B2)", 'C3');
    okayRoundTrip('=[Book.xlsx]Sheet1:Sheet2!A1', 'C3');
  });

  test('ternary ranges with allowTernary disabled', () => {
    // FIXME: translate needs to be be able to specify allowTernary=false
    okayRoundTrip('=foo:C3:D4', 'A1', { allowTernary: false });
  });
});
