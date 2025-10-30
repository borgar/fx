import { describe, test, expect } from 'vitest';
import { stringifyA1Ref, stringifyA1RefXlsx } from './stringifyA1Ref.ts';

describe('stringifyA1Ref', () => {
  const rangeA1 = { top: 0, bottom: 0, left: 0, right: 0 };

  test('basic stringification', () => {
    expect(stringifyA1Ref({ range: rangeA1 })).toBe('A1');
    expect(stringifyA1Ref({ context: [ 'Sheet1' ], range: rangeA1 })).toBe('Sheet1!A1');
    expect(stringifyA1Ref({ context: [ 'Sheet 1' ], range: rangeA1 })).toBe("'Sheet 1'!A1");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 })).toBe('[MyFile.xlsx]Sheet1!A1');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx', 'Sheet1' ], range: rangeA1 })).toBe("'[My File.xlsx]Sheet1'!A1");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx' ], range: rangeA1 })).toBe('MyFile.xlsx!A1');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx' ], range: rangeA1 })).toBe("'My File.xlsx'!A1");
  });

  test('named ranges', () => {
    expect(stringifyA1Ref({ name: 'foo' })).toBe('foo');
    expect(stringifyA1Ref({ context: [ 'Sheet1' ], name: 'foo' })).toBe('Sheet1!foo');
    expect(stringifyA1Ref({ context: [ 'Sheet 1' ], name: 'foo' })).toBe("'Sheet 1'!foo");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' })).toBe('[MyFile.xlsx]Sheet1!foo');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx', 'Sheet1' ], name: 'foo' })).toBe("'[My File.xlsx]Sheet1'!foo");
    expect(stringifyA1Ref({ context: [ 'MyFile.xlsx' ], name: 'foo' })).toBe('MyFile.xlsx!foo');
    expect(stringifyA1Ref({ context: [ 'My File.xlsx' ], name: 'foo' })).toBe("'My File.xlsx'!foo");
  });

  test('ignore workbookName/sheetName in non-XLSX mode', () => {
    // @ts-expect-error -- testing invalid input
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 })).toBe('A1');
    // @ts-expect-error -- testing invalid input
    expect(stringifyA1Ref({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' })).toBe('foo');
  });
});

describe('stringifyA1Ref in XLSX mode', () => {
  const rangeA1 = { top: 0, bottom: 0, left: 0, right: 0 };

  test('basic stringification', () => {
    expect(stringifyA1RefXlsx({ range: rangeA1 })).toBe('A1');
    expect(stringifyA1RefXlsx({ sheetName: 'Sheet1', range: rangeA1 })).toBe('Sheet1!A1');
    expect(stringifyA1RefXlsx({ sheetName: 'Sheet 1', range: rangeA1 })).toBe("'Sheet 1'!A1");
    expect(stringifyA1RefXlsx({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', range: rangeA1 })).toBe('[MyFile.xlsx]Sheet1!A1');
    expect(stringifyA1RefXlsx({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', range: rangeA1 })).toBe("'[My File.xlsx]Sheet1'!A1");
    expect(stringifyA1RefXlsx({ workbookName: 'MyFile.xlsx', range: rangeA1 })).toBe('[MyFile.xlsx]!A1');
    expect(stringifyA1RefXlsx({ workbookName: 'My File.xlsx', range: rangeA1 })).toBe("'[My File.xlsx]'!A1");
  });

  test('named ranges', () => {
    expect(stringifyA1RefXlsx({ name: 'foo' })).toBe('foo');
    expect(stringifyA1RefXlsx({ sheetName: 'Sheet1', name: 'foo' })).toBe('Sheet1!foo');
    expect(stringifyA1RefXlsx({ sheetName: 'Sheet 1', name: 'foo' })).toBe("'Sheet 1'!foo");
    expect(stringifyA1RefXlsx({ workbookName: 'MyFile.xlsx', sheetName: 'Sheet1', name: 'foo' })).toBe('[MyFile.xlsx]Sheet1!foo');
    expect(stringifyA1RefXlsx({ workbookName: 'My File.xlsx', sheetName: 'Sheet1', name: 'foo' })).toBe("'[My File.xlsx]Sheet1'!foo");
    expect(stringifyA1RefXlsx({ workbookName: 'MyFile.xlsx', name: 'foo' })).toBe('[MyFile.xlsx]!foo');
    expect(stringifyA1RefXlsx({ workbookName: 'My File.xlsx', name: 'foo' })).toBe("'[My File.xlsx]'!foo");
  });

  test('ignore context in XLSX mode', () => {
    // @ts-expect-error -- testing invalid input
    expect(stringifyA1RefXlsx({ context: [ 'MyFile.xlsx', 'Sheet1' ], range: rangeA1 })).toBe('A1');
    // @ts-expect-error -- testing invalid input
    expect(stringifyA1RefXlsx({ context: [ 'MyFile.xlsx', 'Sheet1' ], name: 'foo' })).toBe('foo');
  });
});
