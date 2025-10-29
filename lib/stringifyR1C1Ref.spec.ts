import { describe, test, expect } from 'vitest';
import { stringifyR1C1Ref } from './stringifyR1C1Ref.ts';

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
});

describe('stringifyR1C1Ref in XLSX mode', () => {
  const rangeA1 = { r0: 2, c0: 4, r1: 2, c1: 4 };

  function testRef (ref: any, expected: string) {
    expect(stringifyR1C1Ref(ref, { xlsx: true })).toBe(expected);
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

  test('ignores context in XLSX mode', () => {
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 }, 'R[2]C[4]');
    testRef({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' }, 'foo');
  });
});
