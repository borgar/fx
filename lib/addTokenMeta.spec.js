import { test, Test } from 'tape';
import { FX_PREFIX, OPERATOR, NUMBER, REF_RANGE, REF_BEAM, FUNCTION, WHITESPACE, REF_STRUCT } from './constants.js';
import { addTokenMeta } from './addTokenMeta.js';
import { tokenize } from './lexer.js';

Test.prototype.isMetaTokens = function isTokens (expr, expect, opts) {
  const actual = addTokenMeta(tokenize(expr), opts);
  if (actual.length === expect.length) {
    actual.forEach((d, i) => {
      const keys = Object.keys(d).concat(Object.keys(expect[i]));
      keys.forEach(key => {
        if (actual[i][key] === expect[i][key]) {
          delete actual[i][key];
          delete expect[i][key];
        }
      });
    });
  }
  this.deepEqual(actual, expect, expr);
};

test('add extra meta to operators', t => {
  // parens should be grouped and tagged with depth
  t.isMetaTokens('=((1)+(1))', [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 1, type: OPERATOR, value: '(', groupId: 'fxg3' },
    { index: 2, depth: 2, type: OPERATOR, value: '(', groupId: 'fxg1' },
    { index: 3, depth: 2, type: NUMBER, value: '1' },
    { index: 4, depth: 2, type: OPERATOR, value: ')', groupId: 'fxg1' },
    { index: 5, depth: 1, type: OPERATOR, value: '+' },
    { index: 6, depth: 2, type: OPERATOR, value: '(', groupId: 'fxg2' },
    { index: 7, depth: 2, type: NUMBER, value: '1' },
    { index: 8, depth: 2, type: OPERATOR, value: ')', groupId: 'fxg2' },
    { index: 9, depth: 1, type: OPERATOR, value: ')', groupId: 'fxg3' }
  ]);

  // don't be fooled by imbalanced parens
  t.isMetaTokens('=)())', [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 0, type: OPERATOR, value: ')', error: true },
    { index: 2, depth: 1, type: OPERATOR, value: '(', groupId: 'fxg1' },
    { index: 3, depth: 1, type: OPERATOR, value: ')', groupId: 'fxg1' },
    { index: 4, depth: 0, type: OPERATOR, value: ')', error: true }
  ]);

  // don't be fooled by nested curlys
  t.isMetaTokens('={{}}', [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 1, type: OPERATOR, value: '{', groupId: 'fxg1' },
    { index: 2, depth: 1, type: OPERATOR, value: '{', error: true },
    { index: 3, depth: 1, type: OPERATOR, value: '}', groupId: 'fxg1' },
    { index: 4, depth: 0, type: OPERATOR, value: '}', error: true }
  ]);

  // group ranges if they are equivalent
  t.isMetaTokens("=B11,B11:B12,'Sheet11'!B11,SHEET1!$B11,sheet1!$b$11,A1:B11,[foo]Sheet1!B11,'[foo]Sheet1'!B11", [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 0, type: REF_RANGE, value: 'B11', groupId: 'fxg1' },
    { index: 2, depth: 0, type: OPERATOR, value: ',' },
    { index: 3, depth: 0, type: REF_RANGE, value: 'B11:B12', groupId: 'fxg2' },
    { index: 4, depth: 0, type: OPERATOR, value: ',' },
    { index: 5, depth: 0, type: REF_RANGE, value: "'Sheet11'!B11", groupId: 'fxg3' },
    { index: 6, depth: 0, type: OPERATOR, value: ',' },
    { index: 7, depth: 0, type: REF_RANGE, value: 'SHEET1!$B11', groupId: 'fxg1' },
    { index: 8, depth: 0, type: OPERATOR, value: ',' },
    { index: 9, depth: 0, type: REF_RANGE, value: 'sheet1!$b$11', groupId: 'fxg1' },
    { index: 10, depth: 0, type: OPERATOR, value: ',' },
    { index: 11, depth: 0, type: REF_RANGE, value: 'A1:B11', groupId: 'fxg4' },
    { index: 12, depth: 0, type: OPERATOR, value: ',' },
    { index: 13, depth: 0, type: REF_RANGE, value: '[foo]Sheet1!B11', groupId: 'fxg1' },
    { index: 14, depth: 0, type: OPERATOR, value: ',' },
    { index: 15, depth: 0, type: REF_RANGE, value: "'[foo]Sheet1'!B11", groupId: 'fxg1' }
  ], { sheetName: 'Sheet1', workbookName: 'foo' });

  t.isMetaTokens('=A:A,1:1,Sheet1!A:A:1:1,[foo]Sheet1!1:1', [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 0, type: REF_BEAM, value: 'A:A', groupId: 'fxg1' },
    { index: 2, depth: 0, type: OPERATOR, value: ',' },
    { index: 3, depth: 0, type: REF_BEAM, value: '1:1', groupId: 'fxg2' },
    { index: 4, depth: 0, type: OPERATOR, value: ',' },
    { index: 5, depth: 0, type: REF_BEAM, value: 'Sheet1!A:A', groupId: 'fxg1' },
    { index: 6, depth: 0, type: OPERATOR, value: ':' },
    { index: 7, depth: 0, type: REF_BEAM, value: '1:1', groupId: 'fxg2' },
    { index: 8, depth: 0, type: OPERATOR, value: ',' },
    { index: 9, depth: 0, type: REF_BEAM, value: '[foo]Sheet1!1:1', groupId: 'fxg2' }
  ], { sheetName: 'Sheet1', workbookName: 'foo' });

  t.isMetaTokens('=SUM((1, 2), {3, 4})', [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 0, type: FUNCTION, value: 'SUM' },
    { index: 2, depth: 1, type: OPERATOR, value: '(', groupId: 'fxg3' },
    { index: 3, depth: 2, type: OPERATOR, value: '(', groupId: 'fxg1' },
    { index: 4, depth: 2, type: NUMBER, value: '1' },
    { index: 5, depth: 2, type: OPERATOR, value: ',' },
    { index: 6, depth: 2, type: WHITESPACE, value: ' ' },
    { index: 7, depth: 2, type: NUMBER, value: '2' },
    { index: 8, depth: 2, type: OPERATOR, value: ')', groupId: 'fxg1' },
    { index: 9, depth: 1, type: OPERATOR, value: ',' },
    { index: 10, depth: 1, type: WHITESPACE, value: ' ' },
    { index: 11, depth: 2, type: OPERATOR, value: '{', groupId: 'fxg2' },
    { index: 12, depth: 2, type: NUMBER, value: '3' },
    { index: 13, depth: 2, type: OPERATOR, value: ',' },
    { index: 14, depth: 2, type: WHITESPACE, value: ' ' },
    { index: 15, depth: 2, type: NUMBER, value: '4' },
    { index: 16, depth: 2, type: OPERATOR, value: '}', groupId: 'fxg2' },
    { index: 17, depth: 1, type: OPERATOR, value: ')', groupId: 'fxg3' }
  ], { sheetName: 'Sheet1', workbookName: 'foo' });

  t.isMetaTokens('=table[#all]+table[foobar]+table[[#All]]', [
    { index: 0, depth: 0, type: FX_PREFIX, value: '=' },
    { index: 1, depth: 0, type: REF_STRUCT, value: 'table[#all]', groupId: 'fxg1' },
    { index: 2, depth: 0, type: OPERATOR, value: '+' },
    { index: 3, depth: 0, type: REF_STRUCT, value: 'table[foobar]', groupId: 'fxg2' },
    { index: 4, depth: 0, type: OPERATOR, value: '+' },
    { index: 5, depth: 0, type: REF_STRUCT, value: 'table[[#All]]', groupId: 'fxg1' }
  ], { sheetName: 'Sheet1', workbookName: 'foo' });

  t.end();
});
