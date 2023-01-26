import { test } from 'tape';
import { mergeRefTokens } from './mergeRefTokens.js';
import { tokenize } from './lexer.js';

test('mergeRefTokens', t => {
  const list = tokenize('=SUM([Wb1]Sheet1!A1:B2)', { mergeRanges: false, emitRanges: true });

  t.deepEqual(list, [
    { type: 'fx-prefix', value: '=', range: [ 0, 1 ] },
    { type: 'function', value: 'SUM', range: [ 1, 4 ] },
    { type: 'operator', value: '(', range: [ 4, 5 ] },

    { type: 'path-brace', value: '[Wb1]', range: [ 5, 10 ] },
    { type: 'path-prefix', value: 'Sheet1', range: [ 10, 16 ] },
    { type: 'operator', value: '!', range: [ 16, 17 ] },
    { type: 'range', value: 'A1', range: [ 17, 19 ] },
    { type: 'operator', value: ':', range: [ 19, 20 ] },
    { type: 'range', value: 'B2', range: [ 20, 22 ] },

    { type: 'operator', value: ')', range: [ 22, 23 ] }
  ]);

  // set IDs on all tokens about to be joined
  list[3].id = 'id1';
  list[4].id = 'id2';
  list[5].id = 'id3';
  list[6].id = 'id4';
  list[7].id = 'id5';
  list[8].id = 'id6';

  const mergedList = mergeRefTokens(list);
  t.deepEqual(mergedList, [
    { type: 'fx-prefix', value: '=', range: [ 0, 1 ] },
    { type: 'function', value: 'SUM', range: [ 1, 4 ] },
    { type: 'operator', value: '(', range: [ 4, 5 ] },
    { type: 'range',
      id: 'id6', // token has the id of the first one
      value: '[Wb1]Sheet1!A1:B2',
      range: [ 5, 22 ] },
    { type: 'operator', value: ')', range: [ 22, 23 ] }
  ]);

  t.end();
});
