import { describe, test, expect } from 'vitest';
import { CONTEXT, FUNCTION, FX_PREFIX, OPERATOR, REF_RANGE, REF_BEAM, REF_NAMED, REF_TERNARY, UNKNOWN } from './constants.ts';
import { mergeRefTokens } from './mergeRefTokens.ts';
import { tokenize } from './lexer.ts';

describe('mergeRefTokens', () => {
  test('merges reference tokens and preserves metadata', () => {
    const list = tokenize('=SUM([Wb1]Sheet1!A1:B2)', { mergeRefs: false, withLocation: true });

    expect(list).toEqual([
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
    expect(mergedList).toEqual([
      { type: FX_PREFIX, value: '=', loc: [ 0, 1 ] },
      { type: FUNCTION, value: 'SUM', loc: [ 1, 4 ] },
      { type: OPERATOR, value: '(', loc: [ 4, 5 ] },
      { type: REF_RANGE,
        id: 'id5', // token has the id of the first one
        value: '[Wb1]Sheet1!A1:B2',
        loc: [ 5, 22 ] },
      { type: OPERATOR, value: ')', loc: [ 22, 23 ] }
    ]);
  });

  describe('tokenize with mergeRefs enabled', () => {
    const opts = { mergeRefs: true, allowTernary: true };

    test('basic cell references', () => {
      expect(tokenize('A1', opts)).toEqual([
        { type: REF_RANGE, value: 'A1' }
      ]);

      expect(tokenize('A1:A1', opts)).toEqual([
        { type: REF_RANGE, value: 'A1:A1' }
      ]);
    });

    test('beam references', () => {
      expect(tokenize('A:A', opts)).toEqual([
        { type: REF_BEAM, value: 'A:A' }
      ]);
    });

    test('ternary references', () => {
      expect(tokenize('A1:A', opts)).toEqual([
        { type: REF_TERNARY, value: 'A1:A' }
      ]);
    });

    test('quoted sheet references', () => {
      expect(tokenize('\'Sheet1\'!A1', opts)).toEqual([
        { type: REF_RANGE, value: '\'Sheet1\'!A1' }
      ]);

      expect(tokenize('\'Sheet1\'!A:A', opts)).toEqual([
        { type: REF_BEAM, value: '\'Sheet1\'!A:A' }
      ]);

      expect(tokenize('\'Sheet1\'!A1:A', opts)).toEqual([
        { type: REF_TERNARY, value: '\'Sheet1\'!A1:A' }
      ]);
    });

    test('unquoted sheet references', () => {
      expect(tokenize('Sheet1!A1', opts)).toEqual([
        { type: REF_RANGE, value: 'Sheet1!A1' }
      ]);

      expect(tokenize('Sheet1!A:A', opts)).toEqual([
        { type: REF_BEAM, value: 'Sheet1!A:A' }
      ]);

      expect(tokenize('Sheet1!A1:A', opts)).toEqual([
        { type: REF_TERNARY, value: 'Sheet1!A1:A' }
      ]);
    });

    test('workbook references', () => {
      expect(tokenize('[WB]Sheet1!A1', opts)).toEqual([
        { type: REF_RANGE, value: '[WB]Sheet1!A1' }
      ]);

      expect(tokenize('[WB]Sheet1!A:A', opts)).toEqual([
        { type: REF_BEAM, value: '[WB]Sheet1!A:A' }
      ]);

      expect(tokenize('[WB]Sheet1!A1:A', opts)).toEqual([
        { type: REF_TERNARY, value: '[WB]Sheet1!A1:A' }
      ]);

      expect(tokenize('[WB]Sheet1!A1.:.C3', opts)).toEqual([
        { type: REF_RANGE, value: '[WB]Sheet1!A1.:.C3' }
      ]);
    });

    test('named references', () => {
      expect(tokenize('foo', opts)).toEqual([
        { type: REF_NAMED, value: 'foo' }
      ]);

      expect(tokenize('\'quoted\'!foo', opts)).toEqual([
        { type: REF_NAMED, value: '\'quoted\'!foo' }
      ]);

      expect(tokenize('Sheet1!foo', opts)).toEqual([
        { type: REF_NAMED, value: 'Sheet1!foo' }
      ]);
    });

    test('path references with different formats', () => {
      expect(tokenize('[path]!foo', opts)).toEqual([
        { type: UNKNOWN, value: '[path]' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'foo' }
      ]);

      expect(tokenize('[path]prefix!foo', opts)).toEqual([
        { type: REF_NAMED, value: '[path]prefix!foo' }
      ]);
    });
  });
});
