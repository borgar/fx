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

  test('digit-leading sheet names are quoted', () => {
    expect(stringifyA1Ref({ context: [ '1040' ], range: rangeA1 })).toBe("'1040'!A1");
    expect(stringifyA1Ref({ context: [ '1', '1040' ], range: rangeA1 })).toBe("'[1]1040'!A1");
    expect(stringifyA1Ref({ context: [ '2024Budget' ], range: rangeA1 })).toBe("'2024Budget'!A1");
  });

  test('digit-leading prefixes are quoted for named references', () => {
    expect(stringifyA1Ref({ context: [ '1040' ], name: 'foo' })).toBe("'1040'!foo");
    expect(stringifyA1Ref({ context: [ '2024Budget' ], name: 'foo' })).toBe("'2024Budget'!foo");
    expect(stringifyA1Ref({ context: [ '1', '1040' ], name: 'foo' })).toBe("'[1]1040'!foo");
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

  test('should quote prefixes that look like A1 ranges', () => {
    expect(stringifyA1Ref({ context: [ 'Ab12' ], range: rangeA1 })).toBe("'Ab12'!A1");
    expect(stringifyA1Ref({ context: [ 'Sch1' ], range: rangeA1 })).toBe("'Sch1'!A1");
    expect(stringifyA1Ref({ context: [ 'Foo12345' ], range: rangeA1 })).toBe("'Foo12345'!A1");
  });

  test('should quote prefixes that read as booleans', () => {
    // bare "TRUE!A1" lexes as the boolean joined to a reference, so the name needs its quotes as
    // much as a range-like one does
    expect(stringifyA1Ref({ context: [ 'TRUE' ], range: rangeA1 })).toBe("'TRUE'!A1");
    expect(stringifyA1Ref({ context: [ 'False' ], range: rangeA1 })).toBe("'False'!A1");
    // the rest are unmoved by the boolean rule: a ":" name is already quoted as a banned
    // character, and a name that merely starts with a literal is not read as one
    expect(stringifyA1Ref({ context: [ 'False:Jan' ], range: rangeA1 })).toBe("'False:Jan'!A1");
    expect(stringifyA1Ref({ context: [ 'Jan:true' ], range: rangeA1 })).toBe("'Jan:true'!A1");
    expect(stringifyA1Ref({ context: [ 'Truer' ], range: rangeA1 })).toBe('Truer!A1');
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

  test('should quote prefixes that look like ranges', () => {
    expect(stringifyA1RefXlsx({ sheetName: 'C', range: rangeA1 })).toBe("'C'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'R', range: rangeA1 })).toBe("'R'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'RC', range: rangeA1 })).toBe("'RC'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'Ab12', range: rangeA1 })).toBe("'Ab12'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'Sch1', range: rangeA1 })).toBe("'Sch1'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'Foo12345', range: rangeA1 })).toBe("'Foo12345'!A1");
    expect(stringifyA1RefXlsx({ workbookName: 'Ab12', range: rangeA1 })).toBe("'[Ab12]'!A1");
    expect(stringifyA1RefXlsx({ workbookName: 'Sch1', range: rangeA1 })).toBe("'[Sch1]'!A1");
    expect(stringifyA1RefXlsx({ workbookName: 'Foo12345', range: rangeA1 })).toBe("'[Foo12345]'!A1");
  });

  test('sheet and workbook names that read as booleans are quoted', () => {
    expect(stringifyA1RefXlsx({ sheetName: 'TRUE', range: rangeA1 })).toBe("'TRUE'!A1");
    // unmoved by the boolean rule: ":" is a banned character, boolean endpoints or not
    expect(stringifyA1RefXlsx({ sheetName: 'False:Jan', range: rangeA1 })).toBe("'False:Jan'!A1");
    // the brackets leave a workbook name unambiguous, but fx over-quotes it here as it does a
    // digit-leading or range-like one
    expect(stringifyA1RefXlsx({ workbookName: 'TRUE', range: rangeA1 })).toBe("'[TRUE]'!A1");
  });

  test('digit-leading sheet and workbook names are quoted', () => {
    expect(stringifyA1RefXlsx({ sheetName: '1040', range: rangeA1 })).toBe("'1040'!A1");
    expect(stringifyA1RefXlsx({ sheetName: '2024Budget', range: rangeA1 })).toBe("'2024Budget'!A1");
    expect(stringifyA1RefXlsx({ workbookName: '1040.xlsx', range: rangeA1 })).toBe("'[1040.xlsx]'!A1");
    expect(stringifyA1RefXlsx({ workbookName: '1040.xlsx', sheetName: 'Sheet1', range: rangeA1 })).toBe("'[1040.xlsx]Sheet1'!A1");
    expect(stringifyA1RefXlsx({ workbookName: '1040.xlsx', name: 'foo' })).toBe("'[1040.xlsx]'!foo");
    expect(stringifyA1RefXlsx({ sheetName: '1040', name: 'foo' })).toBe("'1040'!foo");
  });
});
