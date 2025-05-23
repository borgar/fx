import { test } from 'tape';
import { fromCol } from './fromCol.js';

test('fromCol parses column id strings to numbers', t => {
  t.is(fromCol('a'), 0);
  t.is(fromCol('A'), 0);
  t.is(fromCol('AA'), 26);
  t.is(fromCol('zz'), 701);
  t.is(fromCol('ZZZ'), 18277);
  t.end();
});
