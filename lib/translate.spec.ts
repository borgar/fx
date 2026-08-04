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
    okayRoundTrip("=SUM('[Book.xlsx]S1:S3'!A1)", 'C3');
    okayRoundTrip("=SUM('[1]S1:S3'!A1)", 'C3');
  });

  test('3-D references over sheet names that are also R1C1 parts', () => {
    // The sheet range travels verbatim, so the R1C1 leg has to read back as a sheet range what
    // the A1 leg did: "C", "R" and their numbered forms are R1C1 parts, but they are no more
    // cells there than "A1" is, so the colon is still a sheet-range separator. The prefix comes
    // back quoted, which is the spelling Excel stores for these names anyway.
    const rc = translateFormulaToR1C1('=SUM(C:D!A1)', 'C3');
    expect(rc).toBe('=SUM(C:D!R[-2]C[-2])');
    expect(translateFormulaToA1(rc, 'C3')).toBe("=SUM('C:D'!A1)");
    expect(translateFormulaToA1(translateFormulaToR1C1('=R:Q!A1', 'C3'), 'C3')).toBe("='R:Q'!A1");
  });

  test('3-D references over sheet names that are cell addresses in the other notation', () => {
    // A prefix travels verbatim, so a sheet range whose first name is a cell where it lands has to
    // pick up quotes on the way: bare, that end gives the colon to the range operator and the
    // reference is no longer the same one.
    expect(translateFormulaToR1C1('=SUM(RC:Dec!A1)', 'C3')).toBe("=SUM('RC:Dec'!R[-2]C[-2])");
    expect(translateFormulaToR1C1('=R1C1:Dec!A1', 'C3')).toBe("='R1C1:Dec'!R[-2]C[-2]");
    expect(translateFormulaToA1('=A1:Dec!R1C1', 'C3', { mergeRefs: false })).toBe("='A1:Dec'!$A$1");
    // ... including where only the second name arrives quoted, which the whole-prefix quotes
    // replace
    expect(translateFormulaToR1C1("=RC:'Dec'!A1", 'C3')).toBe("='RC:Dec'!R[-2]C[-2]");
    okayRoundTrip("='RC:Dec'!A1", 'C3');
    okayRoundTrip("='A1:Dec'!A1", 'C3');
    // ... and the sheet is what follows the workbook brackets, so a workbook ahead of the pair
    // neither hides the end that is a cell address nor becomes one
    expect(translateFormulaToR1C1('=[1]RC:Dec!A1', 'C3')).toBe("='[1]RC:Dec'!R[-2]C[-2]");
    expect(translateFormulaToA1('=[1]A1:Dec!R1C1', 'C3', { mergeRefs: false })).toBe("='[1]A1:Dec'!$A$1");
  });

  test('3-D references with each end quoted on its own', () => {
    // the A1 leg redistributes the quoting over the whole sheet range, so these do not come
    // back verbatim; they settle on the whole-prefix spelling
    const rc = translateFormulaToR1C1("=foo:'bar'!A1", 'C3');
    expect(rc).toBe("=foo:'bar'!R[-2]C[-2]");
    expect(translateFormulaToA1(rc, 'C3')).toBe('=foo:bar!A1');
    expect(translateFormulaToA1(translateFormulaToR1C1("='foo bar':'baz'!A1", 'C3'), 'C3'))
      .toBe("='foo bar:baz'!A1");
  });

  test('ternary ranges with allowTernary disabled', () => {
    // FIXME: translate needs to be be able to specify allowTernary=false
    okayRoundTrip('=foo:C3:D4', 'A1', { allowTernary: false });
  });
});
