import { test } from 'tape';
import { splitPrefix } from './parseRef.js';

test('splitPrefix', t => {
  const testStr = (str, opt, expected) => {
    t.deepEqual(splitPrefix(str, opt), expected, str);
  };

  testStr('[foo][bar][baz]', true, [ 'foo', 'bar', 'baz' ]);
  testStr('foo[bar][baz]', true, [ 'foo', 'bar', 'baz' ]);
  testStr('[foo]bar[baz]', true, [ 'foo', 'bar', 'baz' ]);
  testStr('[foo][bar]baz', true, [ 'foo', 'bar', 'baz' ]);
  testStr('foo[bar]baz', true, [ 'foo', 'bar', 'baz' ]);
  testStr('[foo]bar[baz]', true, [ 'foo', 'bar', 'baz' ]);
  testStr('[foo]bar', true, [ 'foo', 'bar' ]);
  testStr('foo[bar]', true, [ 'foo', 'bar' ]);
  testStr('[foo][bar]', true, [ 'foo', 'bar' ]);
  testStr('[foo]', true, [ 'foo' ]);
  testStr('foo', true, [ 'foo' ]);

  testStr('[foo][bar][baz]', false, [
    { value: 'foo', braced: true },
    { value: 'bar', braced: true },
    { value: 'baz', braced: true } ]);
  testStr('foo[bar][baz]', false, [
    { value: 'foo', braced: false },
    { value: 'bar', braced: true },
    { value: 'baz', braced: true } ]);
  testStr('[foo]bar[baz]', false, [
    { value: 'foo', braced: true },
    { value: 'bar', braced: false },
    { value: 'baz', braced: true } ]);
  testStr('[foo][bar]baz', false, [
    { value: 'foo', braced: true },
    { value: 'bar', braced: true },
    { value: 'baz', braced: false } ]);
  testStr('foo[bar]baz', false, [
    { value: 'foo', braced: false },
    { value: 'bar', braced: true },
    { value: 'baz', braced: false } ]);
  testStr('[foo]bar[baz]', false, [
    { value: 'foo', braced: true },
    { value: 'bar', braced: false },
    { value: 'baz', braced: true } ]);
  testStr('[foo]bar', false, [
    { value: 'foo', braced: true },
    { value: 'bar', braced: false } ]);
  testStr('foo[bar]', false, [
    { value: 'foo', braced: false },
    { value: 'bar', braced: true } ]);
  testStr('[foo][bar]', false, [
    { value: 'foo', braced: true },
    { value: 'bar', braced: true } ]);
  testStr('[foo]', false, [
    { value: 'foo', braced: true } ]);
  testStr('foo', false, [
    { value: 'foo', braced: false } ]);

  t.end();
});
