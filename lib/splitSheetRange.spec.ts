import { describe, test, expect } from 'vitest';
import { splitSheetRange } from './splitSheetRange.ts';
import { parseA1Ref, parseA1RefXlsx } from './parseA1Ref.ts';

describe('splitSheetRange', () => {
  function isSplit (scope: string, expected: [ string, string ] | undefined) {
    expect(splitSheetRange(scope)).toEqual(expected);
  }

  test('splits a sheet range into its two sheet names', () => {
    isSplit('Jan:Dec', [ 'Jan', 'Dec' ]);
    isSplit('Sheet1:Sheet2', [ 'Sheet1', 'Sheet2' ]);
    isSplit('Sheet 1:Sheet 2', [ 'Sheet 1', 'Sheet 2' ]);
    isSplit('A:C', [ 'A', 'C' ]);
    isSplit('1:5', [ '1', '5' ]);
    // a degenerate sheet range still names two sheets, fx not being the one to collapse it
    isSplit('Jan:Jan', [ 'Jan', 'Jan' ]);
    isSplit('Dec:Jan', [ 'Dec', 'Jan' ]);
  });

  test('a single sheet name is not a sheet range', () => {
    isSplit('Sheet1', undefined);
    isSplit('Jan', undefined);
    isSplit('', undefined);
  });

  test('a scope that is not two names is not a sheet range', () => {
    isSplit(':', undefined);
    isSplit(':Sheet2', undefined);
    isSplit('Sheet1:', undefined);
    isSplit('a:b:c', undefined);
  });

  test('reads the sheet slot of a parsed reference', () => {
    // the hazard this exists for: the sheet slot contains both names, so a lookup handed it whole
    // matches no sheet at all
    const ref: any = parseA1Ref('Jan:Dec!A1');
    expect(ref.context).toEqual([ 'Jan:Dec' ]);
    expect(splitSheetRange(ref.context[ref.context.length - 1])).toEqual([ 'Jan', 'Dec' ]);

    const refX: any = parseA1RefXlsx('[1]Jan:Dec!A1');
    expect(refX.sheetName).toBe('Jan:Dec');
    expect(splitSheetRange(refX.sheetName)).toEqual([ 'Jan', 'Dec' ]);

    // ... and an ordinary reference reports no sheet range, so the same code path serves both
    const plain: any = parseA1Ref('Sheet1!A1');
    expect(splitSheetRange(plain.context[0])).toBe(undefined);
  });
});
