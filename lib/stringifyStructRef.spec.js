/* eslint-disable object-property-newline, object-curly-newline */
import { test } from 'tape';
import { stringifyStructRef } from './stringifyStructRef.js';

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

test('structured references serialize in xlsx mode', t => {
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

test('longform serialize (in xlsx mode)', t => {
  // thisRow should mean we don't see @'s in output
  t.is(
    stringifyStructRef({
      table: 'Table2',
      columns: [ 'col1' ],
      sections: [ 'this row' ]
    }, { xlsx: true, thisRow: true }),
    'Table2[[#This row],[col1]]',
    'Table2[[#This row],[col1]] (xlsx mode)'
  );

  t.is(
    stringifyStructRef({
      table: 'Table2',
      columns: [ 'col1' ],
      sections: [ 'this row' ]
    }, { xlsx: false, thisRow: true }),
    'Table2[[#This row],[col1]]',
    'Table2[[#This row],[col1]] (non xlsx mode)'
  );

  t.end();
});

