import { test } from 'tape';

import {
  addA1RangeBounds,
  addTokenMeta,
  fixRanges,
  fromCol,
  isError,
  isFunction,
  isFxPrefix,
  isLiteral,
  isOperator,
  isRange,
  isReference,
  isWhitespace,
  mergeRefTokens,
  nodeTypes,
  parse,
  parseA1Ref,
  parseR1C1Ref,
  parseStructRef,
  stringifyA1Ref,
  stringifyR1C1Ref,
  stringifyStructRef,
  toCol,
  tokenize,
  tokenTypes,
  translateToA1,
  translateToR1C1
} from './index.js';

// What happens when B2:A1 -> should work!
test('fx main interface', t => {
  t.ok(typeof addA1RangeBounds === 'function', 'addA1RangeBounds exists');
  t.ok(typeof addTokenMeta === 'function', 'addTokenMeta exists');
  t.ok(typeof fixRanges === 'function', 'fixRanges exists');

  t.ok(typeof fromCol === 'function', 'fromCol exists');

  t.ok(typeof isError === 'function', 'isError exists');
  t.ok(typeof isFunction === 'function', 'isFunction exists');
  t.ok(typeof isFxPrefix === 'function', 'isFxPrefix exists');
  t.ok(typeof isLiteral === 'function', 'isLiteral exists');
  t.ok(typeof isOperator === 'function', 'isOperator exists');
  t.ok(typeof isRange === 'function', 'isRange exists');
  t.ok(typeof isReference === 'function', 'isReference exists');
  t.ok(typeof isWhitespace === 'function', 'isWhitespace exists');

  t.ok(typeof mergeRefTokens === 'function', 'mergeRefTokens exists');
  t.ok(typeof parse === 'function', 'parse exists');
  t.ok(typeof parseA1Ref === 'function', 'parseA1Ref exists');
  t.ok(typeof parseR1C1Ref === 'function', 'parseR1C1Ref exists');
  t.ok(typeof parseStructRef === 'function', 'parseStructRef exists');
  t.ok(typeof stringifyA1Ref === 'function', 'stringifyA1Ref exists');
  t.ok(typeof stringifyR1C1Ref === 'function', 'stringifyR1C1Ref exists');
  t.ok(typeof stringifyStructRef === 'function', 'stringifyStructRef exists');
  t.ok(typeof toCol === 'function', 'toCol exists');
  t.ok(typeof tokenize === 'function', 'tokenize exists');
  t.ok(typeof translateToA1 === 'function', 'translateToA1 exists');
  t.ok(typeof translateToR1C1 === 'function', 'translateToR1C1 exists');

  t.ok(typeof nodeTypes === 'object', 'nodeTypes exists');
  t.ok(typeof tokenTypes === 'object', 'tokenTypes exists');

  t.end();
});

