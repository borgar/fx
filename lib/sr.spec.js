/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import { parseStructRef, stringifyStructRef } from './sr.js';

Test.prototype.isSREqual = function isSREqual (expr, expect, opts) {
  if (expect) {
    expect = {
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

