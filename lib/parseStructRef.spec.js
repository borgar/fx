/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import { parseStructRef } from './parseStructRef.js';

Test.prototype.isSREqual = function isSREqual (expr, expect, opts) {
  if (expect) {
    expect = opts?.xlsx
      ? {
        workbookName: '',
        sheetName: '',
        table: '',
        columns: [],
        sections: [],
        ...expect
      }
      : {
        context: [],
        table: '',
        columns: [],
        sections: [],
        ...expect
      };
  }
  this.deepEqual(parseStructRef(expr, opts), expect, expr);
};

test('parse structured references', t => {
  t.isSREqual('table[col]', {
    table: 'table',
    columns: [ 'col' ]
  });

  t.isSREqual('table[]', {
    table: 'table'
  });

  t.isSREqual('[#All]', {
    sections: [ 'all' ]
  });

  t.isSREqual('[column name]', {
    columns: [ 'column name' ]
  });

  t.isSREqual('[column name]!foo', null);
  t.isSREqual('[foo]bar', null);

  t.isSREqual('[[my column]]', {
    columns: [ 'my column' ]
  });

  t.isSREqual('[[my column]:otherColumn]', {
    columns: [ 'my column', 'otherColumn' ]
  });

  t.isSREqual('[ [my column]:otherColumn ]', {
    columns: [ 'my column', 'otherColumn ' ]
  });

  t.isSREqual('[ [my column]: otherColumn ]', {
    columns: [ 'my column', ' otherColumn ' ]
  });

  t.isSREqual('[ @[ my column ]: otherColumn ]', {
    columns: [ ' my column ', ' otherColumn ' ],
    sections: [ 'this row' ]
  });

  t.isSREqual('[[#Data], [my column]:otherColumn]', {
    columns: [ 'my column', 'otherColumn' ],
    sections: [ 'data' ]
  });

  t.isSREqual('[ [#Data], [my column]:[\'@foo] ]', {
    columns: [ 'my column', '@foo' ],
    sections: [ 'data' ]
  });

  t.isSREqual('workbook.xlsx!tableName[ [#Data], [my column]:[\'@foo] ]', {
    columns: [ 'my column', '@foo' ],
    sections: [ 'data' ],
    table: 'tableName',
    context: [ 'workbook.xlsx' ]
  });

  t.isSREqual('[[#Data],[#data],[#Data],[#Data],[#Totals],[#Totals],[#Totals],foo]', {
    columns: [ 'foo' ],
    sections: [ 'data', 'totals' ]
  });

  t.isSREqual("'Sheet'!Table[Column]", {
    columns: [ 'Column' ],
    table: 'Table',
    context: [ 'Sheet' ]
  });

  t.isSREqual("Sheet1!Table1[foo '[bar']]", {
    columns: [ 'foo [bar]' ],
    table: 'Table1',
    context: [ 'Sheet1' ]
  });

  t.isSREqual('[myworkbook.xlsx]Sheet1!TMP8w0habhr[#All]', {
    columns: [],
    table: 'TMP8w0habhr',
    context: [ 'myworkbook.xlsx', 'Sheet1' ],
    sections: [ 'all' ]
  });

  t.end();
});

test('structured references parse in xlsx mode', t => {
  t.isSREqual('[Workbook.xlsx]!Table[#Data]', {
    workbookName: 'Workbook.xlsx',
    table: 'Table',
    sections: [ 'data' ]
  }, { xlsx: true });

  t.isSREqual('[Workbook.xlsx]Sheet1!Table[#Data]', {
    workbookName: 'Workbook.xlsx',
    sheetName: 'Sheet1',
    table: 'Table',
    sections: [ 'data' ]
  }, { xlsx: true });

  t.isSREqual('Sheet1!Table[#Data]', {
    sheetName: 'Sheet1',
    table: 'Table',
    sections: [ 'data' ]
  }, { xlsx: true });

  t.end();
});

test('longform prase (in xlsx mode)', t => {
  // thisRow should have no effect when parsing
  t.isSREqual('Table2[[#This Row],[col1]]', {
    table: 'Table2',
    columns: [ 'col1' ],
    sections: [ 'this row' ]
  }, { xlsx: true, thisRow: true });

  t.isSREqual('Table2[[#This Row],[col1]]', {
    table: 'Table2',
    columns: [ 'col1' ],
    sections: [ 'this row' ]
  }, { xlsx: true, thisRow: false });

  t.isSREqual('Table2[[#This Row],[col1]]', {
    table: 'Table2',
    columns: [ 'col1' ],
    sections: [ 'this row' ]
  }, { xlsx: false, thisRow: true });

  t.isSREqual('Table2[[#This Row],[col1]]', {
    table: 'Table2',
    columns: [ 'col1' ],
    sections: [ 'this row' ]
  }, { xlsx: false, thisRow: false });

  t.end();
});

