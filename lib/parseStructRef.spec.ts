import { describe, test, expect } from 'vitest';
import { parseStructRef, parseStructRefXlsx } from './parseStructRef.ts';

function isSREqual (expr: string, expected: any, opts?: any) {
  if (expected) {
    expected = opts?.xlsx
      ? {
        workbookName: '',
        sheetName: '',
        table: '',
        columns: [],
        sections: [],
        ...expected
      }
      : {
        context: [],
        table: '',
        columns: [],
        sections: [],
        ...expected
      };
  }
  expect(opts?.xlsx ? parseStructRefXlsx(expr) : parseStructRef(expr)).toEqual(expected);
}

describe('parse structured references', () => {
  test('basic table and column references', () => {
    isSREqual('table[col]', {
      table: 'table',
      columns: [ 'col' ]
    });

    isSREqual('table[]', {
      table: 'table'
    });
  });

  test('section references', () => {
    isSREqual('[#All]', {
      sections: [ 'all' ]
    });
  });

  test('column name references', () => {
    isSREqual('[column name]', {
      columns: [ 'column name' ]
    });

    isSREqual('[[my column]]', {
      columns: [ 'my column' ]
    });
  });

  test('invalid references', () => {
    isSREqual('[column name]!foo', undefined);
    isSREqual('[foo]bar', undefined);
  });

  test('column range references', () => {
    isSREqual('[[my column]:otherColumn]', {
      columns: [ 'my column', 'otherColumn' ]
    });

    isSREqual('[ [my column]:otherColumn ]', {
      columns: [ 'my column', 'otherColumn ' ]
    });

    isSREqual('[ [my column]: otherColumn ]', {
      columns: [ 'my column', ' otherColumn ' ]
    });
  });

  test('this row references', () => {
    isSREqual('[ @[ my column ]: otherColumn ]', {
      columns: [ ' my column ', ' otherColumn ' ],
      sections: [ 'this row' ]
    });
  });

  test('section and column combinations', () => {
    isSREqual('[[#Data], [my column]:otherColumn]', {
      columns: [ 'my column', 'otherColumn' ],
      sections: [ 'data' ]
    });

    isSREqual('[ [#Data], [my column]:[\'@foo] ]', {
      columns: [ 'my column', '@foo' ],
      sections: [ 'data' ]
    });
  });

  test('context-qualified references', () => {
    isSREqual('workbook.xlsx!tableName[ [#Data], [my column]:[\'@foo] ]', {
      columns: [ 'my column', '@foo' ],
      sections: [ 'data' ],
      table: 'tableName',
      context: [ 'workbook.xlsx' ]
    });

    isSREqual("'Sheet'!Table[Column]", {
      columns: [ 'Column' ],
      table: 'Table',
      context: [ 'Sheet' ]
    });

    isSREqual("Sheet1!Table1[foo '[bar']]", {
      columns: [ 'foo [bar]' ],
      table: 'Table1',
      context: [ 'Sheet1' ]
    });

    isSREqual('[myworkbook.xlsx]Sheet1!TMP8w0habhr[#All]', {
      columns: [],
      table: 'TMP8w0habhr',
      context: [ 'myworkbook.xlsx', 'Sheet1' ],
      sections: [ 'all' ]
    });
  });

  test('3-D references', () => {
    // A sheet range stands in front of a cell reference and nowhere else. A bare one in front of
    // a table is the range operator joining a name to a prefixed structured
    // reference: Excel rewrites `Alpha:Gamma!Table1[Col]` to `Alpha:Table1[Col]`, discarding the
    // `Gamma!` as it discards any sheet prefix on a table. So this is two operands, not one
    // structured reference, and there is nothing here to resolve.
    isSREqual('Sheet1:Sheet2!Table[Column]', undefined);
    isSREqual('Sheet1:Sheet2!Table[Column]', undefined, { xlsx: true });

    // Quoted, it is still read as a sheet range: Excel reads that form as a workbook file
    // name with no sheet at all, which fx has no way to represent.
    isSREqual("'Sheet1:Sheet2'!Table[Column]", {
      columns: [ 'Column' ],
      table: 'Table',
      context: [ 'Sheet1:Sheet2' ]
    });

    isSREqual("'Sheet 1:Sheet 2'!Table[Column]", {
      columns: [ 'Column' ],
      table: 'Table',
      context: [ 'Sheet 1:Sheet 2' ]
    });

    isSREqual("'Sheet1:Sheet2'!Table[Column]", {
      sheetName: 'Sheet1:Sheet2',
      columns: [ 'Column' ],
      table: 'Table'
    }, { xlsx: true });
  });

  test('duplicate section handling', () => {
    isSREqual('[[#Data],[#data],[#Data],[#Data],[#Totals],[#Totals],[#Totals],foo]', {
      columns: [ 'foo' ],
      sections: [ 'data', 'totals' ]
    });
  });
});

describe('structured references parse in xlsx mode', () => {
  test('workbook-only references', () => {
    isSREqual('[Workbook.xlsx]!Table[#Data]', {
      workbookName: 'Workbook.xlsx',
      table: 'Table',
      sections: [ 'data' ]
    }, { xlsx: true });
  });

  test('workbook and sheet references', () => {
    isSREqual('[Workbook.xlsx]Sheet1!Table[#Data]', {
      workbookName: 'Workbook.xlsx',
      sheetName: 'Sheet1',
      table: 'Table',
      sections: [ 'data' ]
    }, { xlsx: true });
  });

  test('sheet-only references', () => {
    isSREqual('Sheet1!Table[#Data]', {
      sheetName: 'Sheet1',
      table: 'Table',
      sections: [ 'data' ]
    }, { xlsx: true });
  });
});

describe('longform parse (in xlsx mode)', () => {
  test('thisRow option should have no effect when parsing', () => {
    const expectedResult = {
      table: 'Table2',
      columns: [ 'col1' ],
      sections: [ 'this row' ]
    };

    isSREqual('Table2[[#This Row],[col1]]', expectedResult, { xlsx: true, thisRow: true });
    isSREqual('Table2[[#This Row],[col1]]', expectedResult, { xlsx: true, thisRow: false });
    isSREqual('Table2[[#This Row],[col1]]', expectedResult, { xlsx: false, thisRow: true });
    isSREqual('Table2[[#This Row],[col1]]', expectedResult, { xlsx: false, thisRow: false });
  });
});
