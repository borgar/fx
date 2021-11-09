import { test, Test } from 'tape';
import { FX_PREFIX, OPERATOR, NUMBER, RANGE, RANGE_BEAM } from './constants.js';
import { addMeta } from './addMeta.js';
import { tokenize } from './lexer.js';

Test.prototype.isMetaTokens = function isTokens (expr, result, opts) {
  this.deepEqual(addMeta(tokenize(expr), opts), result, expr);
};

test('add extra meta to operators', t => {
  // parens should be grouped and tagged with depth
  t.isMetaTokens('=((1)+(1))', [
    { type: FX_PREFIX, value: '=' },
    { type: OPERATOR, value: '(', depth: 0, groupId: 'fxg3' },
    { type: OPERATOR, value: '(', depth: 1, groupId: 'fxg1' },
    { type: NUMBER, value: '1' },
    { type: OPERATOR, value: ')', depth: 1, groupId: 'fxg1' },
    { type: OPERATOR, value: '+' },
    { type: OPERATOR, value: '(', depth: 1, groupId: 'fxg2' },
    { type: NUMBER, value: '1' },
    { type: OPERATOR, value: ')', depth: 1, groupId: 'fxg2' },
    { type: OPERATOR, value: ')', depth: 0, groupId: 'fxg3' }
  ]);

  // don't be fooled by imbalanced parens
  t.isMetaTokens('=)())', [
    { type: FX_PREFIX, value: '=' },
    { type: OPERATOR, value: ')', error: true },
    { type: OPERATOR, value: '(', depth: 0, groupId: 'fxg1' },
    { type: OPERATOR, value: ')', depth: 0, groupId: 'fxg1' },
    { type: OPERATOR, value: ')', error: true }
  ]);

  // don't be fooled by nested curlys
  t.isMetaTokens('={{}}', [
    { type: FX_PREFIX, value: '=' },
    { type: OPERATOR, value: '{', groupId: 'fxg1' },
    { type: OPERATOR, value: '{', error: true },
    { type: OPERATOR, value: '}', groupId: 'fxg1' },
    { type: OPERATOR, value: '}', error: true }
  ]);

  // group ranges if they are equivalent
  t.isMetaTokens("=B11,B11:B12,'Sheet11'!B11,SHEET1!$B11,sheet1!$b$11,A1:B11,[foo]Sheet1!B11,'[foo]Sheet1'!B11", [
    { type: FX_PREFIX, value: '=' },
    { type: RANGE, value: 'B11', groupId: 'fxg1' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: 'B11:B12', groupId: 'fxg2' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: "'Sheet11'!B11", groupId: 'fxg3' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: 'SHEET1!$B11', groupId: 'fxg1' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: 'sheet1!$b$11', groupId: 'fxg1' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: 'A1:B11', groupId: 'fxg4' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: '[foo]Sheet1!B11', groupId: 'fxg1' },
    { type: OPERATOR, value: ',' },
    { type: RANGE, value: "'[foo]Sheet1'!B11", groupId: 'fxg1' }
  ], { sheetName: 'Sheet1', workbookName: 'foo' });

  t.isMetaTokens('=A:A,1:1,Sheet1!A:A:1:1,[foo]Sheet1!1:1', [
    { type: FX_PREFIX, value: '=' },
    { type: RANGE_BEAM, value: 'A:A', groupId: 'fxg1' },
    { type: OPERATOR, value: ',' },
    { type: RANGE_BEAM, value: '1:1', groupId: 'fxg2' },
    { type: OPERATOR, value: ',' },
    { type: RANGE_BEAM, value: 'Sheet1!A:A', groupId: 'fxg1' },
    { type: OPERATOR, value: ':' },
    { type: RANGE_BEAM, value: '1:1', groupId: 'fxg2' },
    { type: OPERATOR, value: ',' },
    { type: RANGE_BEAM, value: '[foo]Sheet1!1:1', groupId: 'fxg2' }
  ], { sheetName: 'Sheet1', workbookName: 'foo' });

  t.end();
});
