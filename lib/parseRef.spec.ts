import { describe, test, expect } from 'vitest';
import { splitPrefix } from './parseRef.js';

function testStr(str: string, opt: boolean, expected: any) {
  expect(splitPrefix(str, opt)).toEqual(expected);
}

describe('splitPrefix', () => {
  describe('with simple mode (opt = true)', () => {
    test('fully bracketed references', () => {
      testStr('[foo][bar][baz]', true, [ 'foo', 'bar', 'baz' ]);
      testStr('[foo][bar]', true, [ 'foo', 'bar' ]);
      testStr('[foo]', true, [ 'foo' ]);
    });

    test('mixed bracketed and unbracketed references', () => {
      testStr('foo[bar][baz]', true, [ 'foo', 'bar', 'baz' ]);
      testStr('[foo]bar[baz]', true, [ 'foo', 'bar', 'baz' ]);
      testStr('[foo][bar]baz', true, [ 'foo', 'bar', 'baz' ]);
      testStr('foo[bar]baz', true, [ 'foo', 'bar', 'baz' ]);
      testStr('[foo]bar', true, [ 'foo', 'bar' ]);
      testStr('foo[bar]', true, [ 'foo', 'bar' ]);
    });

    test('unbracketed references', () => {
      testStr('foo', true, [ 'foo' ]);
    });
  });

  describe('with detailed mode (opt = false)', () => {
    test('fully bracketed references', () => {
      testStr('[foo][bar][baz]', false, [
        { value: 'foo', braced: true },
        { value: 'bar', braced: true },
        { value: 'baz', braced: true }
      ]);

      testStr('[foo][bar]', false, [
        { value: 'foo', braced: true },
        { value: 'bar', braced: true }
      ]);

      testStr('[foo]', false, [
        { value: 'foo', braced: true }
      ]);
    });

    test('mixed bracketed and unbracketed references', () => {
      testStr('foo[bar][baz]', false, [
        { value: 'foo', braced: false },
        { value: 'bar', braced: true },
        { value: 'baz', braced: true }
      ]);

      testStr('[foo]bar[baz]', false, [
        { value: 'foo', braced: true },
        { value: 'bar', braced: false },
        { value: 'baz', braced: true }
      ]);

      testStr('[foo][bar]baz', false, [
        { value: 'foo', braced: true },
        { value: 'bar', braced: true },
        { value: 'baz', braced: false }
      ]);

      testStr('foo[bar]baz', false, [
        { value: 'foo', braced: false },
        { value: 'bar', braced: true },
        { value: 'baz', braced: false }
      ]);

      testStr('[foo]bar', false, [
        { value: 'foo', braced: true },
        { value: 'bar', braced: false }
      ]);

      testStr('foo[bar]', false, [
        { value: 'foo', braced: false },
        { value: 'bar', braced: true }
      ]);
    });

    test('unbracketed references', () => {
      testStr('foo', false, [
        { value: 'foo', braced: false }
      ]);
    });
  });
});
