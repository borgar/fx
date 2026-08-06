import { describe, test, expect } from 'vitest';
import { splitSheetRange } from './splitSheetRange.ts';
import { parseA1Ref, parseA1RefXlsx } from './parseA1Ref.ts';
import { parseR1C1Ref, parseR1C1RefXlsx } from './parseR1C1Ref.ts';
import { parseStructRef, parseStructRefXlsx } from './parseStructRef.ts';

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
    // the case this function exists for: the sheet slot contains both names, so a lookup handed
    // it whole matches no sheet at all
    const ref: any = parseA1Ref('Jan:Dec!A1');
    expect(ref.context).toEqual([ 'Jan:Dec' ]);
    expect(splitSheetRange(ref)).toEqual([ 'Jan', 'Dec' ]);
    expect(splitSheetRange(ref.context[ref.context.length - 1])).toEqual([ 'Jan', 'Dec' ]);

    const refX: any = parseA1RefXlsx('[1]Jan:Dec!A1');
    expect(refX.sheetName).toBe('Jan:Dec');
    expect(splitSheetRange(refX)).toEqual([ 'Jan', 'Dec' ]);
    expect(splitSheetRange(refX.sheetName)).toEqual([ 'Jan', 'Dec' ]);

    // ... and an ordinary reference reports no sheet range, so the same code path serves both
    const plain: any = parseA1Ref('Sheet1!A1');
    expect(splitSheetRange(plain)).toBe(undefined);
    expect(splitSheetRange(plain.context[0])).toBe(undefined);

    // a reference with no prefix at all has no sheet slot to read
    expect(splitSheetRange(parseA1Ref('A1'))).toBe(undefined);
    expect(splitSheetRange(parseA1RefXlsx('A1'))).toBe(undefined);

    // the sheet slot is the last scope, so a workbook or path in front of it is passed over
    expect(splitSheetRange(parseA1Ref("'[Book.xlsx]Jan:Dec'!A1"))).toEqual([ 'Jan', 'Dec' ]);
    expect(splitSheetRange(parseR1C1Ref('Jan:Dec!R1C1'))).toEqual([ 'Jan', 'Dec' ]);
    expect(splitSheetRange(parseR1C1RefXlsx('[1]Jan:Dec!R1C1'))).toEqual([ 'Jan', 'Dec' ]);
  });

  test('a colon-bearing scope in front of a name or a table is not a sheet range', () => {
    // In Excel this scope is a workbook *file* name, colon and all, with no sheet in it:
    // `'Jan:Dec'!SomeName` is stored as `[n]!SomeName`. Dividing it would yield two sheets Excel
    // never read there.
    expect(splitSheetRange(parseA1Ref("'Jan:Dec'!SomeName"))).toBe(undefined);
    expect(splitSheetRange(parseA1RefXlsx("'Jan:Dec'!SomeName"))).toBe(undefined);
    expect(splitSheetRange(parseR1C1Ref("'Jan:Dec'!SomeName"))).toBe(undefined);
    expect(splitSheetRange(parseR1C1RefXlsx("'Jan:Dec'!SomeName"))).toBe(undefined);
    expect(splitSheetRange(parseStructRef("'Jan:Dec'!Table1[Col]"))).toBe(undefined);
    expect(splitSheetRange(parseStructRefXlsx("'Jan:Dec'!Table1[Col]"))).toBe(undefined);

    // The scope itself is unchanged, and is what a caller resolves as a workbook.
    expect((parseA1Ref("'Jan:Dec'!SomeName") as any).context).toEqual([ 'Jan:Dec' ]);

    // The string form cannot see the operand, so it still divides whatever it is handed.
    isSplit('Jan:Dec', [ 'Jan', 'Dec' ]);
  });
});
