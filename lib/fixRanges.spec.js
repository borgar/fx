import { test, Test } from 'tape';
import { tokenize } from './lexer.js';
import { addMeta } from './addMeta.js';
import { fixRanges } from './fixRanges.js';

Test.prototype.isFixed = function (expr, expected, options = {}) {
  const result = fixRanges(expr, options);
  this.is(result, expected, expr + ' → ' + expected);
};

test('fixRanges basics', t => {
  const fx = '=SUM([wb]Sheet1!B2:A1)';
  t.throws(() => fixRanges(123), 'throws on non arrays (number)');
  t.throws(() => fixRanges(null), 'throws on non arrays (null)');
  const tokens = addMeta(tokenize(fx, { mergeRanges: true }));
  tokens[3].foo = 'bar';
  const fixedTokens = fixRanges(tokens, { debug: 0 });
  t.ok(tokens !== fixedTokens, 'emits a new array instance');
  t.ok(tokens[3] !== fixedTokens[3], 'does not mutate existing range tokens');
  t.deepEqual(tokens[3], {
    type: 'range',
    value: '[wb]Sheet1!B2:A1',
    index: 3,
    depth: 1,
    groupId: 'fxg1',
    foo: 'bar'
  }, 'keeps meta (pre-fix range token)');
  t.deepEqual(fixedTokens[3], {
    type: 'range',
    value: '[wb]Sheet1!A1:B2',
    index: 3,
    depth: 1,
    groupId: 'fxg1',
    foo: 'bar'
  }, 'keeps meta (post-fix range token)');
  // fixes all range meta
  t.end();
});

test('fixRanges A1', t => {
  const opt = { allowPartials: true };
  // doesn't mess with things that it doesn't have to
  t.isFixed('=A1', '=A1', opt);
  t.isFixed('=ZZ123', '=ZZ123', opt);
  t.isFixed('=A1:B2', '=A1:B2', opt);
  t.isFixed('=B3:OFFSET(A1,10,10)', '=B3:OFFSET(A1,10,10)', opt);
  t.isFixed('=A:B', '=A:B', opt);
  t.isFixed('=C:C', '=C:C', opt);
  t.isFixed('=3:6', '=3:6', opt);
  t.isFixed('=3:3', '=3:3', opt);
  // redundancy
  t.isFixed('=A1:$A$1', '=A1:$A$1', opt);
  t.isFixed('=A1:A1', '=A1', opt);
  // lowercase to uppercase
  t.isFixed('=a1', '=A1', opt);
  t.isFixed('=zz123', '=ZZ123', opt);
  t.isFixed('=a1:b2', '=A1:B2', opt);
  // flipped rects
  t.isFixed('=B2:A1', '=A1:B2', opt);
  t.isFixed('=$B$2:$A$1', '=$A$1:$B$2', opt);
  // flipped beams
  t.isFixed('=C:A', '=A:C', opt);
  t.isFixed('=$D:B', '=B:$D', opt);
  t.isFixed('=10:1', '=1:10', opt);
  t.isFixed('=$5:3', '=3:$5', opt);
  // flipped partials - bottom
  t.isFixed('=A:A1', '=A1:A', opt);
  t.isFixed('=A:A$1', '=A$1:A', opt);
  // flipped partials - right
  t.isFixed('=1:A1', '=A1:1', opt);
  // $1:$A1 is rather counter intuitive case:
  //   This range is parsed as { left=null, top=$1, right=$A, bottom=1 } but,
  //   because left is null, right and left are flipped around, making this
  //   end up as { left=$A, top=$1, right=null, bottom=1 } which serializes
  //   as $A$1:1
  t.isFixed('=$1:$A1', '=$A$1:1', opt);
  t.end();
});

test('fixRanges A1 addBounds', t => {
  const opt = { allowPartials: true, addBounds: true };
  t.isFixed('=B3:OFFSET(A1,10,10)', '=B3:OFFSET(A1,10,10)', opt);
  t.isFixed('=A:A', '=A:A', opt);
  t.isFixed('=A:A1', '=A:A', opt);
  t.isFixed('=A:A$1', '=A:A', opt);
  t.isFixed('=A:$A$1', '=A:$A', opt);
  // partials - bottom
  t.isFixed('=A1:A', '=A:A', opt);
  t.isFixed('=A1:Z', '=A:Z', opt);
  t.isFixed('=A:A1', '=A:A', opt);
  t.isFixed('=$A1:A', '=$A:A', opt);
  t.isFixed('=A$1:A', '=A:A', opt);
  t.isFixed('=A1:$A', '=A:$A', opt);
  t.isFixed('=A2:A', '=A2:A1048576', opt);
  t.isFixed('=B2:B', '=B2:B1048576', opt);
  t.isFixed('=A:A2', '=A2:A1048576', opt);
  t.isFixed('=B:B2', '=B2:B1048576', opt);
  // flipped partials - bottom
  t.isFixed('=A1:1', '=1:1', opt);
  t.isFixed('=A1:4', '=1:4', opt);
  t.isFixed('=1:A1', '=1:1', opt);
  t.isFixed('=$A1:1', '=1:1', opt);
  t.isFixed('=A$1:1', '=$1:1', opt);
  t.isFixed('=A1:$1', '=1:$1', opt);
  t.isFixed('=B1:1', '=B1:XFD1', opt);
  t.isFixed('=1:B1', '=B1:XFD1', opt);
  t.isFixed('=B2:20', '=B2:XFD20', opt);
  t.isFixed('=2:B20', '=B2:XFD20', opt);
  t.end();
});
