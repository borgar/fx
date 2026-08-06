import { describe, test, expect } from 'vitest';
import { stringifyStructRef, stringifyStructRefXlsx } from './stringifyStructRef.ts';

describe('serialize structured references', () => {
  test('simple column references', () => {
    expect(stringifyStructRef({
      columns: [ 'foo' ]
    })).toBe('[foo]');

    expect(stringifyStructRef({
      columns: [ 'foo' ],
      table: 'tableName'
    })).toBe('tableName[foo]');

    expect(stringifyStructRef({
      columns: [ 'lorem ipsum' ],
      table: 'tableName'
    })).toBe('tableName[lorem ipsum]');
  });

  test('column range references', () => {
    expect(stringifyStructRef({
      columns: [ 'foo', 'sævör' ],
      table: 'tableName'
    })).toBe('tableName[[foo]:[sævör]]');

    expect(stringifyStructRef({
      columns: [ 'lorem ipsum', 'sævör' ],
      table: 'tableName'
    })).toBe('tableName[[lorem ipsum]:[sævör]]');
  });

  test('section references', () => {
    expect(stringifyStructRef({
      sections: [ 'data' ],
      table: 'tableName'
    })).toBe('tableName[#Data]');

    expect(stringifyStructRef({
      sections: [ 'data', 'headers' ],
      table: 'table'
    })).toBe('table[[#Data],[#Headers]]');
  });

  test('complex references with context', () => {
    expect(stringifyStructRef({
      columns: [ 'my column', 'fo@o' ],
      sections: [ 'data' ],
      table: 'tableName',
      context: [ 'workbook.xlsx' ]
    })).toBe('workbook.xlsx!tableName[[#Data],[my column]:[fo\'@o]]');
  });

  test('a sheet range in front of a table is quoted whatever its ends look like', () => {
    // Without quotes it would not read back as one sheet scope: the colon of a bare sheet range
    // is the range operator unless a cell reference follows the "!", which a table name is not.
    expect(stringifyStructRef({
      columns: [ 'Column' ],
      table: 'Table',
      context: [ 'Sheet1:Sheet2' ]
    })).toBe("'Sheet1:Sheet2'!Table[Column]");

    expect(stringifyStructRef({
      columns: [ 'Column' ],
      table: 'Table',
      context: [ 'Sheet 1:Sheet 2' ]
    })).toBe("'Sheet 1:Sheet 2'!Table[Column]");
  });

  test('this row references', () => {
    expect(stringifyStructRef({
      columns: [ 'bar' ],
      sections: [ 'this row' ],
      table: 'foo'
    })).toBe('foo[@bar]');

    expect(stringifyStructRef({
      columns: [ 'bar', 'baz' ],
      sections: [ 'this row' ],
      table: 'foo'
    })).toBe('foo[@[bar]:[baz]]');

    expect(stringifyStructRef({
      columns: [ 'lorem ipsum', 'baz' ],
      sections: [ 'this row' ],
      table: 'foo'
    })).toBe('foo[@[lorem ipsum]:[baz]]');
  });
});

describe('structured references serialize in xlsx mode', () => {
  test('context vs workbookName/sheetName handling', () => {
    expect(stringifyStructRefXlsx({
      // @ts-expect-error -- this is testing invalid input
      context: [ 'Lorem', 'Ipsum' ],
      columns: [ 'foo' ]
    })).toBe('[foo]');

    expect(stringifyStructRef({
      // @ts-expect-error -- this is testing invalid input
      workbookName: 'Lorem',
      sheetName: 'Ipsum',
      columns: [ 'foo' ]
    })).toBe('[foo]');

    expect(stringifyStructRefXlsx({
      workbookName: 'Lorem',
      sheetName: 'Ipsum',
      columns: [ 'foo' ]
    })).toBe('[Lorem]Ipsum![foo]');
  });

  test('workbook and sheet name handling', () => {
    expect(stringifyStructRefXlsx({
      workbookName: 'Lorem',
      columns: [ 'foo' ]
    })).toBe('[Lorem]![foo]');

    expect(stringifyStructRefXlsx({
      sheetName: 'Ipsum',
      columns: [ 'foo' ]
    })).toBe('Ipsum![foo]');
  });

  test('a sheet range in front of a table is quoted whatever its ends look like', () => {
    // see the non-xlsx twin
    expect(stringifyStructRefXlsx({
      sheetName: 'Sheet1:Sheet2',
      table: 'Table',
      columns: [ 'Column' ]
    })).toBe("'Sheet1:Sheet2'!Table[Column]");

    expect(stringifyStructRefXlsx({
      sheetName: 'Sheet 1:Sheet 2',
      table: 'Table',
      columns: [ 'Column' ]
    })).toBe("'Sheet 1:Sheet 2'!Table[Column]");
  });
});

describe('longform serialize (in xlsx mode)', () => {
  test('thisRow option affects output format', () => {
    expect(stringifyStructRefXlsx({
      table: 'Table2',
      columns: [ 'col1' ],
      sections: [ 'this row' ]
    }, { thisRow: true })).toBe('Table2[[#This row],[col1]]');

    expect(stringifyStructRef({
      table: 'Table2',
      columns: [ 'col1' ],
      sections: [ 'this row' ]
    }, { thisRow: true })).toBe('Table2[[#This row],[col1]]');
  });
});
