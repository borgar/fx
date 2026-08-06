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
    // much as a range-like one does, at either end of a sheet range as well as on its own
    expect(stringifyA1Ref({ context: [ 'TRUE' ], range: rangeA1 })).toBe("'TRUE'!A1");
    expect(stringifyA1Ref({ context: [ 'False' ], range: rangeA1 })).toBe("'False'!A1");
    expect(stringifyA1Ref({ context: [ 'False:Jan' ], range: rangeA1 })).toBe("'False:Jan'!A1");
    expect(stringifyA1Ref({ context: [ 'Jan:true' ], range: rangeA1 })).toBe("'Jan:true'!A1");
    // ... while a name that merely starts with one is no boolean
    expect(stringifyA1Ref({ context: [ 'Truer' ], range: rangeA1 })).toBe('Truer!A1');
  });

  test('3-D references are quoted per endpoint', () => {
    expect(stringifyA1Ref({ context: [ 'Jan:Dec' ], range: rangeA1 })).toBe('Jan:Dec!A1');
    // A sheet range in front of a name is quoted whatever its ends look like, because bare it
    // would not read back as one: the colon of a bare sheet range is the range operator unless a
    // cell reference follows the "!".
    expect(stringifyA1Ref({ context: [ 'Sales:Marketing' ], name: 'foo' })).toBe("'Sales:Marketing'!foo");
    expect(stringifyA1Ref({ context: [ 'Sheet 1:Sheet 2' ], range: rangeA1 })).toBe("'Sheet 1:Sheet 2'!A1");
    expect(stringifyA1Ref({ context: [ 'Sheet1:Sheet 2' ], range: rangeA1 })).toBe("'Sheet1:Sheet 2'!A1");
    expect(stringifyA1Ref({ context: [ 'Sheet 1:Sheet2' ], range: rangeA1 })).toBe("'Sheet 1:Sheet2'!A1");
    expect(stringifyA1Ref({ context: [ '1:5' ], range: rangeA1 })).toBe("'1:5'!A1");
    expect(stringifyA1Ref({ context: [ 'A1:B2' ], range: rangeA1 })).toBe("'A1:B2'!A1");
    // the trigger is the name and not the range: "C" on its own reads as an R1C1 column,
    // wherever it appears, while "B" and "AB" never call for quotes
    expect(stringifyA1Ref({ context: [ 'A:C' ], range: rangeA1 })).toBe("'A:C'!A1");
    expect(stringifyA1Ref({ context: [ 'B:C' ], range: rangeA1 })).toBe("'B:C'!A1");
    expect(stringifyA1Ref({ context: [ 'C:D' ], range: rangeA1 })).toBe("'C:D'!A1");
    expect(stringifyA1Ref({ context: [ 'A:B' ], range: rangeA1 })).toBe('A:B!A1');
    expect(stringifyA1Ref({ context: [ 'AA:AB' ], range: rangeA1 })).toBe('AA:AB!A1');
    expect(stringifyA1Ref({ context: [ 'A:AB' ], range: rangeA1 })).toBe('A:AB!A1');
  });

  test('a workbook qualifier changes nothing about the quoting', () => {
    // Measured in Excel: bare "[ExtSrc3.xlsx]Alpha:Gamma!A1" stays bare on entry, and the quoted
    // form has its needless quotes removed, exactly as a single external sheet does.
    expect(stringifyA1Ref({ context: [ 'Book.xlsx', 'Sheet1:Sheet2' ], range: rangeA1 }))
      .toBe('[Book.xlsx]Sheet1:Sheet2!A1');
    expect(stringifyA1Ref({ context: [ 'Book.xlsx', 'Sheet1' ], range: rangeA1 }))
      .toBe('[Book.xlsx]Sheet1!A1');
    // ... while an endpoint that needs quotes anywhere needs them here too ("S1" is a cell
    // address), as does a path scope, "/" not being a character an unquoted scope may hold
    expect(stringifyA1Ref({ context: [ '/Docs/', 'Book.xlsx', 'S1:S3' ], range: rangeA1 }))
      .toBe("'/Docs/[Book.xlsx]S1:S3'!A1");
    expect(stringifyA1Ref({ context: [ 'Book.xlsx', 'Sheet1:Sheet2' ], name: 'foo' }))
      .toBe("'[Book.xlsx]Sheet1:Sheet2'!foo");
  });

  test('only the sheet scope is split on ":"', () => {
    // a path scope may contain a colon of its own (a Windows drive letter) without it dividing
    // the scope into two sheet names, so only the last scope is treated as a possible sheet range
    expect(stringifyA1Ref({ context: [ 'a:b', 'Book.xlsx', 'Sheet1' ], range: rangeA1 }))
      .toBe("'a:b[Book.xlsx]Sheet1'!A1");
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

  test('3-D references are quoted per endpoint', () => {
    expect(stringifyA1RefXlsx({ sheetName: 'Jan:Dec', range: rangeA1 })).toBe('Jan:Dec!A1');
    // see the non-xlsx twin: in front of a name the colon has to be quoted to read back
    expect(stringifyA1RefXlsx({ sheetName: 'Jan:Dec', name: 'foo' })).toBe("'Jan:Dec'!foo");
    expect(stringifyA1RefXlsx({ sheetName: 'Sheet 1:Sheet 2', range: rangeA1 })).toBe("'Sheet 1:Sheet 2'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'Sheet1:Sheet 2', range: rangeA1 })).toBe("'Sheet1:Sheet 2'!A1");
    expect(stringifyA1RefXlsx({ sheetName: '1:5', range: rangeA1 })).toBe("'1:5'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'A1:B2', range: rangeA1 })).toBe("'A1:B2'!A1");
    // a workbook name is never split on ":" — only sheet names are
    expect(stringifyA1RefXlsx({ workbookName: 'a:b', sheetName: 'Sheet1', range: rangeA1 }))
      .toBe("'[a:b]Sheet1'!A1");
  });

  test('a workbook qualifier changes nothing about the quoting', () => {
    // see the non-xlsx twin: the endpoint names alone decide
    expect(stringifyA1RefXlsx({ workbookName: 'Book.xlsx', sheetName: 'Sheet1:Sheet2', range: rangeA1 }))
      .toBe('[Book.xlsx]Sheet1:Sheet2!A1');
    expect(stringifyA1RefXlsx({ workbookName: '1', sheetName: 'S1:S3', range: rangeA1 }))
      .toBe("'[1]S1:S3'!A1");
    expect(stringifyA1RefXlsx({ workbookName: '1', sheetName: 'S1:S3', name: 'foo' }))
      .toBe("'[1]S1:S3'!foo");
    expect(stringifyA1RefXlsx({ workbookName: 'Book.xlsx', sheetName: 'Sheet1', range: rangeA1 }))
      .toBe('[Book.xlsx]Sheet1!A1');
  });

  test('sheet names that read as booleans are quoted', () => {
    expect(stringifyA1RefXlsx({ sheetName: 'TRUE', range: rangeA1 })).toBe("'TRUE'!A1");
    expect(stringifyA1RefXlsx({ sheetName: 'False:Jan', range: rangeA1 })).toBe("'False:Jan'!A1");
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
