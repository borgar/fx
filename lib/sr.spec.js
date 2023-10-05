/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import { parseStructRef, stringifyStructRef } from './sr.js';

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

  t.isSREqual('[ [my column]:otherColumn ]', {
    columns: [ 'my column', 'otherColumn' ]
  });

  t.isSREqual('[ @[my column]:otherColumn ]', {
    columns: [ 'my column', 'otherColumn' ],
    sections: [ 'this row' ]
  });

  t.isSREqual('[ [#Data], [my column]:otherColumn ]', {
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

test('serialize structured references', t => {
  t.is(
    stringifyStructRef({
      columns: [ 'foo' ]
    }),
    '[foo]',
    '[foo]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'foo' ],
      table: 'tableName'
    }),
    'tableName[foo]',
    'tableName[foo]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'lorem ipsum' ],
      table: 'tableName'
    }),
    'tableName[lorem ipsum]',
    'tableName[lorem ipsum]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'foo', 'sævör' ],
      table: 'tableName'
    }),
    'tableName[[foo]:[sævör]]',
    'tableName[[foo]:[sævör]]'
  );

  t.is(
    stringifyStructRef({
      sections: [ 'data' ],
      table: 'tableName'
    }),
    'tableName[#Data]',
    'tableName[#Data]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'lorem ipsum', 'sævör' ],
      table: 'tableName'
    }),
    'tableName[[lorem ipsum]:[sævör]]',
    'tableName[[lorem ipsum]:[sævör]]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'my column', 'fo@o' ],
      sections: [ 'data' ],
      table: 'tableName',
      context: [ 'workbook.xlsx' ]
    }),
    'workbook.xlsx!tableName[[#Data],[my column]:[fo\'@o]]',
    'workbook.xlsx!tableName[[#Data],[my column]:[fo\'@o]]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'bar' ],
      sections: [ 'this row' ],
      table: 'foo'
    }),
    'foo[@bar]',
    'foo[@bar]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'bar', 'baz' ],
      sections: [ 'this row' ],
      table: 'foo'
    }),
    'foo[@[bar]:[baz]]',
    'foo[@[bar]:[baz]]'
  );

  t.is(
    stringifyStructRef({
      columns: [ 'lorem ipsum', 'baz' ],
      sections: [ 'this row' ],
      table: 'foo'
    }),
    'foo[@[lorem ipsum]:[baz]]',
    'foo[@[lorem ipsum]:[baz]]'
  );

  t.is(
    stringifyStructRef({
      sections: [ 'data', 'headers' ],
      table: 'table'
    }),
    'table[[#Data],[#Headers]]',
    'table[[#Data],[#Headers]]'
  );

  t.end();
});

test('structured references parse and serialize in xlsx mode', t => {
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

  t.is(
    stringifyStructRef({
      context: [ 'Lorem', 'Ipsum' ],
      columns: [ 'foo' ]
    }, { xlsx: true }),
    '[foo]',
    'context prop is ignored in xlsx mode'
  );
  t.is(
    stringifyStructRef({
      workbookName: 'Lorem',
      sheetName: 'Ipsum',
      columns: [ 'foo' ]
    }, { xlsx: false }),
    '[foo]',
    'workbookName+sheetName props are ignored in default mode'
  );
  t.is(
    stringifyStructRef({
      workbookName: 'Lorem',
      sheetName: 'Ipsum',
      columns: [ 'foo' ]
    }, { xlsx: true }),
    '[Lorem]Ipsum![foo]',
    'workbookName+sheetName props are rendered correctly'
  );
  t.is(
    stringifyStructRef({
      workbookName: 'Lorem',
      columns: [ 'foo' ]
    }, { xlsx: true }),
    '[Lorem]![foo]',
    'workbookName prop is rendered correctly'
  );
  t.is(
    stringifyStructRef({
      sheetName: 'Ipsum',
      columns: [ 'foo' ]
    }, { xlsx: true }),
    'Ipsum![foo]',
    'sheetName prop is rendered correctly'
  );
  t.end();
});

