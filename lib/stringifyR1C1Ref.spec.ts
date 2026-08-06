import { describe, test, expect } from 'vitest';
import { stringifyR1C1Ref, stringifyR1C1RefXlsx } from './stringifyR1C1Ref.ts';

describe('stringifyR1C1Ref', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  function testRef (ref: any, expected: string) {
    expect(stringifyR1C1Ref(ref)).toBe(expected);
  }

  test('basic stringification', () => {
    testRef({ range: rangeA1 }, 'R[2]C[4]');
    testRef({ context: [ 'Sheet1' ], range: rangeA1 }, 'Sheet1!R[2]C[4]');
    testRef({ context: [ 'Sheet 1' ], range: rangeA1 }, "'Sheet 1'!R[2]C[4]");
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, '[MyFile.xlsx]Sheet1!R[2]C[4]');
    testRef({ context: [ 'My File.xlsx', 'Sheet1' ], range: rangeA1 }, "'[My File.xlsx]Sheet1'!R[2]C[4]");
    testRef({ context: [ 'MyFile.xlsx' ], range: rangeA1 }, 'MyFile.xlsx!R[2]C[4]');
    testRef({ context: [ 'My File.xlsx' ], range: rangeA1 }, "'My File.xlsx'!R[2]C[4]");
  });

  test('named ranges', () => {
    testRef({ name: 'foo' }, 'foo');
    testRef({ context: [ 'Sheet1' ], name: 'foo' }, 'Sheet1!foo');
    testRef({ context: [ 'Sheet 1' ], name: 'foo' }, "'Sheet 1'!foo");
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
    testRef({ context: [ 'My File.xlsx', 'Sheet1' ], name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
    testRef({ context: [ 'MyFile.xlsx' ], name: 'foo' }, 'MyFile.xlsx!foo');
    testRef({ context: [ 'My File.xlsx' ], name: 'foo' }, "'My File.xlsx'!foo");
  });

  test('3-D references', () => {
    testRef({ context: [ 'Jan:Dec' ], range: rangeA1 }, 'Jan:Dec!R[2]C[4]');
    // a workbook qualifier changes nothing about the quoting: the endpoint names alone decide
    testRef({ context: [ 'Book.xlsx', 'Sheet1:Sheet2' ], range: rangeA1 }, '[Book.xlsx]Sheet1:Sheet2!R[2]C[4]');
    testRef({ context: [ 'Book.xlsx', 'Sheet1' ], range: rangeA1 }, '[Book.xlsx]Sheet1!R[2]C[4]');
    testRef({ context: [ 'Sheet 1:Sheet 2' ], range: rangeA1 }, "'Sheet 1:Sheet 2'!R[2]C[4]");
    // A sheet range in front of a name is quoted whatever its ends look like, because without
    // quotes it would not read back as one: the colon of a bare sheet range is the range operator
    // unless a cell reference follows the "!".
    testRef({ context: [ 'Jan:Dec' ], name: 'foo' }, "'Jan:Dec'!foo");
    // a first sheet name that is also a cell address in this notation would give the colon to
    // the range operator
    testRef({ context: [ 'R1C1:Dec' ], range: rangeA1 }, "'R1C1:Dec'!R[2]C[4]");
    testRef({ context: [ 'RC:Dec' ], range: rangeA1 }, "'RC:Dec'!R[2]C[4]");
    // ... but only the first sheet name decides, and "C" is a part rather than a cell
    testRef({ context: [ 'Dec:R1C1' ], range: rangeA1 }, 'Dec:R1C1!R[2]C[4]');
    testRef({ context: [ 'C:D' ], range: rangeA1 }, "'C:D'!R[2]C[4]");
  });
});

describe('stringifyR1C1Ref in XLSX mode', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  function testRef (ref: any, expected: string) {
    expect(stringifyR1C1RefXlsx(ref)).toBe(expected);
  }

  test('basic stringification', () => {
    testRef({ range: rangeA1 }, 'R[2]C[4]');
    testRef({ sheetName: 'Sheet1', range: rangeA1 }, 'Sheet1!R[2]C[4]');
    testRef({ sheetName: 'Sheet 1', range: rangeA1 }, "'Sheet 1'!R[2]C[4]");
    testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 }, '[MyFile.xlsx]Sheet1!R[2]C[4]');
    testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', range: rangeA1 }, "'[My File.xlsx]Sheet1'!R[2]C[4]");
    testRef({ workbookName: 'MyFile.xlsx', range: rangeA1 }, '[MyFile.xlsx]!R[2]C[4]');
    testRef({ workbookName: 'My File.xlsx', range: rangeA1 }, "'[My File.xlsx]'!R[2]C[4]");
  });

  test('named ranges', () => {
    testRef({ name: 'foo' }, 'foo');
    testRef({ sheetName: 'Sheet1', name: 'foo' }, 'Sheet1!foo');
    testRef({ sheetName: 'Sheet 1', name: 'foo' }, "'Sheet 1'!foo");
    testRef({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' }, '[MyFile.xlsx]Sheet1!foo');
    testRef({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', name: 'foo' }, "'[My File.xlsx]Sheet1'!foo");
    testRef({ workbookName: 'MyFile.xlsx', name: 'foo' }, '[MyFile.xlsx]!foo');
    testRef({ workbookName: 'My File.xlsx', name: 'foo' }, "'[My File.xlsx]'!foo");
  });

  test('3-D references', () => {
    testRef({ sheetName: 'Jan:Dec', range: rangeA1 }, 'Jan:Dec!R[2]C[4]');
    testRef({ sheetName: 'Sheet 1:Sheet 2', range: rangeA1 }, "'Sheet 1:Sheet 2'!R[2]C[4]");
    // the quotes here come from the digit-leading workbook name, not from the sheet range
    testRef({ workbookName: '1', sheetName: 'Sheet1:Sheet2', range: rangeA1 }, "'[1]Sheet1:Sheet2'!R[2]C[4]");
    // see the non-xlsx twin: in front of a name the colon has to be quoted to read back
    testRef({ sheetName: 'Jan:Dec', name: 'foo' }, "'Jan:Dec'!foo");
    testRef({ sheetName: 'R1C1:Dec', range: rangeA1 }, "'R1C1:Dec'!R[2]C[4]");
    testRef({ sheetName: 'Dec:R1C1', range: rangeA1 }, 'Dec:R1C1!R[2]C[4]');
  });

  test('ignores context in XLSX mode', () => {
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, 'R[2]C[4]');
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, 'foo');
  });
});
