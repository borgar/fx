import { describe, test, expect } from 'vitest';
import { splitContextCtx, splitContextXls, splitPrefix } from './parseRef.ts';

describe('parseRef', () => {
  describe('splitPrefix', () => {
    test('fully bracketed references', () => {
      expect(splitPrefix('[foo][bar][baz]')).toEqual([
        { value: 'foo', braced: true },
        { value: 'bar', braced: true },
        { value: 'baz', braced: true }
      ]);

      expect(splitPrefix('[foo][bar]')).toEqual([
        { value: 'foo', braced: true },
        { value: 'bar', braced: true }
      ]);

      expect(splitPrefix('[foo]')).toEqual([
        { value: 'foo', braced: true }
      ]);
    });

    test('mixed bracketed and unbracketed references', () => {
      expect(splitPrefix('foo[bar][baz]')).toEqual([
        { value: 'foo', braced: false },
        { value: 'bar', braced: true },
        { value: 'baz', braced: true }
      ]);

      expect(splitPrefix('[foo]bar[baz]')).toEqual([
        { value: 'foo', braced: true },
        { value: 'bar', braced: false },
        { value: 'baz', braced: true }
      ]);

      expect(splitPrefix('[foo][bar]baz')).toEqual([
        { value: 'foo', braced: true },
        { value: 'bar', braced: true },
        { value: 'baz', braced: false }
      ]);

      expect(splitPrefix('foo[bar]baz')).toEqual([
        { value: 'foo', braced: false },
        { value: 'bar', braced: true },
        { value: 'baz', braced: false }
      ]);

      expect(splitPrefix('[foo]bar')).toEqual([
        { value: 'foo', braced: true },
        { value: 'bar', braced: false }
      ]);

      expect(splitPrefix('foo[bar]')).toEqual([
        { value: 'foo', braced: false },
        { value: 'bar', braced: true }
      ]);
    });

    test('unbracketed references', () => {
      expect(splitPrefix('foo')).toEqual([
        { value: 'foo', braced: false }
      ]);
    });
  });

  test('splitContextXls', () => {
    expect(splitContextXls('Sheet1')).toEqual({ sheetName: 'Sheet1' });
    expect(splitContextXls('Sheet 1')).toEqual({ sheetName: 'Sheet 1' });
    expect(splitContextXls('[Book1.xlsx]Sheet1')).toEqual({ workbookName: 'Book1.xlsx', sheetName: 'Sheet1' });
    expect(splitContextXls('[Book1.xlsx]Sheet 1')).toEqual({ workbookName: 'Book1.xlsx', sheetName: 'Sheet 1' });
    expect(splitContextXls('Sheet1:Sheet1')).toEqual({ sheetName: 'Sheet1' });
    expect(splitContextXls('Sheet1:Sheet2')).toEqual({ sheetName: 'Sheet1:Sheet2' });
    expect(splitContextXls('Sheet 1:Sheet 1')).toEqual({ sheetName: 'Sheet 1' });
    expect(splitContextXls('Sheet 1:Sheet 2')).toEqual({ sheetName: 'Sheet 1:Sheet 2' });
    expect(splitContextXls('[Book1.xlsx]Sheet1:Sheet1')).toEqual({ workbookName: 'Book1.xlsx', sheetName: 'Sheet1' });
    expect(splitContextXls('[Book1.xlsx]Sheet 1:Sheet 1')).toEqual({ workbookName: 'Book1.xlsx', sheetName: 'Sheet 1' });
    expect(splitContextXls('[Book1.xlsx]Sheet 1:Sheet 2')).toEqual({ workbookName: 'Book1.xlsx', sheetName: 'Sheet 1:Sheet 2' });
    expect(splitContextXls('[Book1.xlsx]')).toEqual({ workbookName: 'Book1.xlsx' });
  });

  test('splitContextCtx', () => {
    expect(splitContextCtx('Sheet1')).toEqual([ 'Sheet1' ]);
    expect(splitContextCtx('Sheet 1')).toEqual([ 'Sheet 1' ]);
    expect(splitContextCtx('[Book1.xlsx]Sheet1')).toEqual([ 'Book1.xlsx', 'Sheet1' ]);
    expect(splitContextCtx('[Book1.xlsx]Sheet 1')).toEqual([ 'Book1.xlsx', 'Sheet 1' ]);
    expect(splitContextCtx('Sheet1:Sheet1')).toEqual([ 'Sheet1' ]);
    expect(splitContextCtx('Sheet1:Sheet2')).toEqual([ 'Sheet1:Sheet2' ]);
    expect(splitContextCtx('Sheet 1:Sheet 1')).toEqual([ 'Sheet 1' ]);
    expect(splitContextCtx('Sheet 1:Sheet 2')).toEqual([ 'Sheet 1:Sheet 2' ]);
    expect(splitContextCtx('[Book1.xlsx]Sheet1:Sheet1')).toEqual([ 'Book1.xlsx', 'Sheet1' ]);
    expect(splitContextCtx('[Book1.xlsx]Sheet1:Sheet2')).toEqual([ 'Book1.xlsx', 'Sheet1:Sheet2' ]);
    expect(splitContextCtx('[Book1.xlsx]Sheet 1:Sheet 1')).toEqual([ 'Book1.xlsx', 'Sheet 1' ]);
    expect(splitContextCtx('[Book1.xlsx]Sheet 1:Sheet 2')).toEqual([ 'Book1.xlsx', 'Sheet 1:Sheet 2' ]);
  });
});
