/* eslint-disable object-property-newline, object-curly-newline */
import { describe, test, expect } from 'vitest';
import { parseStructRef } from './parseStructRef.js';

function isSREqual(expr: string, expected: any, opts?: any) {
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
  expect(parseStructRef(expr, opts)).toEqual(expected);
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
    isSREqual('[column name]!foo', null);
    isSREqual('[foo]bar', null);
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
