import { CONTEXT, FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, UNKNOWN } from './constants.js';
import { test } from 'tape';
import { mergeRefTokens } from './mergeRefTokens.js';
import { tokenize } from './lexer.js';

test('mergeRefTokens basics', t => {
  const list = tokenize('=SUM([Wb1]Sheet1!A1:B2)', { mergeRefs: false, withLocation: true });

  t.deepEqual(list, [
    { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
    { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ] },
    { type: OPERATOR, value: '(', loc: [ 4, 5 ] },

    { type: CONTEXT, value: '[Wb1]Sheet1', loc: [ 5, 16 ] },
    { type: OPERATOR, value: '!', loc: [ 16, 17 ] },
    { type: REF_RANGE, value: 'A1', loc: [ 17, 19 ] },
    { type: OPERATOR, value: ':', loc: [ 19, 20 ] },
    { type: REF_RANGE, value: 'B2', loc: [ 20, 22 ] },

    { type: OPERATOR, value: ')', loc: [ 22, 23 ] }
  ]);

  // set IDs on all tokens about to be joined
  list[3].id = 'id1';
  list[4].id = 'id2';
  list[5].id = 'id3';
  list[6].id = 'id4';
  list[7].id = 'id5';

  const mergedList = mergeRefTokens(list);
  t.deepEqual(mergedList, [
    { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
    { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ] },
    { type: OPERATOR, value: '(', loc: [ 4, 5 ] },
    { type: REF_RANGE,
      id: 'id5', // token has the id of the first one
      value: '[Wb1]Sheet1!A1:B2',
      loc: [ 5, 22 ] },
    { type: OPERATOR, value: ')', loc: [ 22, 23 ] }
  ]);

  t.end();
});

test('mergeRefTokens cases', t => {
  const opts = { mergeRefs: true, allowTernary: true };
  t.deepEqual(tokenize('A1', opts), [
    { type: REF_RANGE, value: 'A1' }
  ]);
  t.deepEqual(tokenize('A1:A1', opts), [
    { type: REF_RANGE, value: 'A1:A1' }
  ]);
  t.deepEqual(tokenize('A:A', opts), [
    { type: REF_BEAM, value: 'A:A' }
  ]);
  t.deepEqual(tokenize('A1:A', opts), [
    { type: REF_TERNARY, value: 'A1:A' }
  ]);

  t.deepEqual(tokenize('\'Sheet1\'!A1', opts), [
    { type: REF_RANGE, value: '\'Sheet1\'!A1' }
  ]);
  t.deepEqual(tokenize('\'Sheet1\'!A:A', opts), [
    { type: REF_BEAM, value: '\'Sheet1\'!A:A' }
  ]);
  t.deepEqual(tokenize('\'Sheet1\'!A1:A', opts), [
    { type: REF_TERNARY, value: '\'Sheet1\'!A1:A' }
  ]);
  t.deepEqual(tokenize('\'Sheet1\'!A1:A', opts), [
    { type: REF_TERNARY, value: '\'Sheet1\'!A1:A' }
  ]);

  t.deepEqual(tokenize('Sheet1!A1', opts), [
    { type: REF_RANGE, value: 'Sheet1!A1' }
  ]);
  t.deepEqual(tokenize('Sheet1!A:A', opts), [
    { type: REF_BEAM, value: 'Sheet1!A:A' }
  ]);
  t.deepEqual(tokenize('Sheet1!A1:A', opts), [
    { type: REF_TERNARY, value: 'Sheet1!A1:A' }
  ]);
  t.deepEqual(tokenize('Sheet1!A1:A', opts), [
    { type: REF_TERNARY, value: 'Sheet1!A1:A' }
  ]);

  t.deepEqual(tokenize('[WB]Sheet1!A1', opts), [
    { type: REF_RANGE, value: '[WB]Sheet1!A1' }
  ]);
  t.deepEqual(tokenize('[WB]Sheet1!A:A', opts), [
    { type: REF_BEAM, value: '[WB]Sheet1!A:A' }
  ]);
  t.deepEqual(tokenize('[WB]Sheet1!A1:A', opts), [
    { type: REF_TERNARY, value: '[WB]Sheet1!A1:A' }
  ]);
  t.deepEqual(tokenize('[WB]Sheet1!A1:A', opts), [
    { type: REF_TERNARY, value: '[WB]Sheet1!A1:A' }
  ]);
  t.deepEqual(tokenize('[WB]Sheet1!A1.:.C3', opts), [
    { type: REF_RANGE, value: '[WB]Sheet1!A1.:.C3' }
  ]);

  t.deepEqual(tokenize('foo', opts), [
    { type: REF_NAMED, value: 'foo' }
  ]);
  t.deepEqual(tokenize('\'quoted\'!foo', opts), [
    { type: REF_NAMED, value: '\'quoted\'!foo' }
  ]);
  t.deepEqual(tokenize('Sheet1!foo', opts), [
    { type: REF_NAMED, value: 'Sheet1!foo' }
  ]);
  t.deepEqual(tokenize('[path]!foo', opts), [
    { type: UNKNOWN, value: '[path]' },
    { type: OPERATOR, value: '!' },
    { type: REF_NAMED, value: 'foo' }
  ]);
  t.deepEqual(tokenize('[path]prefix!foo', opts), [
    { type: REF_NAMED, value: '[path]prefix!foo' }
  ]);

  t.end();
});
