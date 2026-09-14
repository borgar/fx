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

  test('3D references', () => {
    testRef({ context: [ 'Jan:Dec' ], range: rangeA1 }, 'Jan:Dec!R[2]C[4]');
    testRef({ context: [ 'Book.xlsx', 'Sheet1:Sheet2' ], range: rangeA1 }, '[Book.xlsx]Sheet1:Sheet2!R[2]C[4]');
    testRef({ context: [ 'Book.xlsx', 'Sheet1' ], range: rangeA1 }, '[Book.xlsx]Sheet1!R[2]C[4]');
    testRef({ context: [ 'Sheet 1:Sheet 2' ], range: rangeA1 }, "'Sheet 1:Sheet 2'!R[2]C[4]");
    testRef({ context: [ 'R1C1:Dec' ], range: rangeA1 }, "'R1C1:Dec'!R[2]C[4]");
    testRef({ context: [ 'RC:Dec' ], range: rangeA1 }, "'RC:Dec'!R[2]C[4]");
    testRef({ context: [ 'Dec:R1C1' ], range: rangeA1 }, "'Dec:R1C1'!R[2]C[4]");
    testRef({ context: [ 'C:D' ], range: rangeA1 }, "'C:D'!R[2]C[4]");
    testRef({ context: [ 'Jan:Dec' ], name: 'foo' }, "'Jan:Dec'!foo");
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

  test('3D references', () => {
    testRef({ workbookName: '', sheetName: 'Jan:Dec', range: rangeA1 }, 'Jan:Dec!R[2]C[4]');
    testRef({ workbookName: 'Book.xlsx', sheetName: 'Sheet1:Sheet2', range: rangeA1 }, '[Book.xlsx]Sheet1:Sheet2!R[2]C[4]');
    testRef({ workbookName: 'Book.xlsx', sheetName: 'Sheet1', range: rangeA1 }, '[Book.xlsx]Sheet1!R[2]C[4]');
    testRef({ workbookName: '', sheetName: 'Sheet 1:Sheet 2', range: rangeA1 }, "'Sheet 1:Sheet 2'!R[2]C[4]");
    testRef({ workbookName: '', sheetName: 'R1C1:Dec', range: rangeA1 }, "'R1C1:Dec'!R[2]C[4]");
    testRef({ workbookName: '', sheetName: 'RC:Dec', range: rangeA1 }, "'RC:Dec'!R[2]C[4]");
    testRef({ workbookName: '', sheetName: 'Dec:R1C1', range: rangeA1 }, "'Dec:R1C1'!R[2]C[4]");
    testRef({ workbookName: '', sheetName: 'C:D', range: rangeA1 }, "'C:D'!R[2]C[4]");
    testRef({ workbookName: 'Jan:Dec', sheetName: '', name: 'foo' }, "'[Jan:Dec]'!foo");
  });

  test('ignores context in XLSX mode', () => {
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, 'R[2]C[4]');
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, 'foo');
  });
});

describe('stringifyR1C1Ref with forceQuotes', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  test('quotes prefixes that would not otherwise be quoted', () => {
    expect(stringifyR1C1Ref({ context: [ 'Sheet1' ], range: rangeA1 }, true)).toBe("'Sheet1'!R[2]C[4]");
    expect(stringifyR1C1Ref({ context: [ 'Sheet1' ], name: 'foo' }, true)).toBe("'Sheet1'!foo");
    expect(stringifyR1C1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, true)).toBe("'[MyFile.xlsx]Sheet1'!R[2]C[4]");
    expect(stringifyR1C1Ref({ context: [ 'Jan:Dec' ], range: rangeA1 }, true)).toBe("'Jan:Dec'!R[2]C[4]");
  });

  test('prefixes that are quoted anyway are unaffected', () => {
    expect(stringifyR1C1Ref({ context: [ 'Sheet 1' ], range: rangeA1 }, true)).toBe("'Sheet 1'!R[2]C[4]");
    expect(stringifyR1C1Ref({ context: [ "O'Neil" ], range: rangeA1 }, true)).toBe("'O''Neil'!R[2]C[4]");
  });

  test('defaults to quoting only when needed', () => {
    expect(stringifyR1C1Ref({ context: [ 'Sheet1' ], range: rangeA1 })).toBe('Sheet1!R[2]C[4]');
    expect(stringifyR1C1Ref({ context: [ 'Sheet1' ], range: rangeA1 }, false)).toBe('Sheet1!R[2]C[4]');
  });

  test('an empty prefix stays empty', () => {
    expect(stringifyR1C1Ref({ range: rangeA1 }, true)).toBe('R[2]C[4]');
    expect(stringifyR1C1Ref({ context: [], range: rangeA1 }, true)).toBe('R[2]C[4]');
    expect(stringifyR1C1Ref({ name: 'foo' }, true)).toBe('foo');
  });
});

describe('stringifyR1C1Ref with forceQuotes in XLSX mode', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  test('quotes prefixes that would not otherwise be quoted', () => {
    expect(stringifyR1C1RefXlsx({ sheetName: 'Sheet1', range: rangeA1 }, true)).toBe("'Sheet1'!R[2]C[4]");
    expect(stringifyR1C1RefXlsx({ sheetName: 'Sheet1', name: 'foo' }, true)).toBe("'Sheet1'!foo");
    expect(stringifyR1C1RefXlsx({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 }, true)).toBe("'[MyFile.xlsx]Sheet1'!R[2]C[4]");
    expect(stringifyR1C1RefXlsx({ workbookName: 'MyFile.xlsx', range: rangeA1 }, true)).toBe("'[MyFile.xlsx]'!R[2]C[4]");
  });

  test('prefixes that are quoted anyway are unaffected', () => {
    expect(stringifyR1C1RefXlsx({ sheetName: 'Sheet 1', range: rangeA1 }, true)).toBe("'Sheet 1'!R[2]C[4]");
  });

  test('defaults to quoting only when needed', () => {
    expect(stringifyR1C1RefXlsx({ sheetName: 'Sheet1', range: rangeA1 })).toBe('Sheet1!R[2]C[4]');
    expect(stringifyR1C1RefXlsx({ sheetName: 'Sheet1', range: rangeA1 }, false)).toBe('Sheet1!R[2]C[4]');
  });

  test('an empty prefix stays empty', () => {
    expect(stringifyR1C1RefXlsx({ range: rangeA1 }, true)).toBe('R[2]C[4]');
    expect(stringifyR1C1RefXlsx({ workbookName: '', sheetName: '', range: rangeA1 }, true)).toBe('R[2]C[4]');
    expect(stringifyR1C1RefXlsx({ name: 'foo' }, true)).toBe('foo');
  });
});
