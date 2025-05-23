import { test } from 'tape';
import { toCol } from './toCol.js';

// What happens when B2:A1 -> should work!
test('toCol converts integers to column ids', t => {
  t.is(toCol(0), 'A');
  t.is(toCol(26), 'AA');
  t.is(toCol(701), 'ZZ');
  t.is(toCol(18277), 'ZZZ');
  t.end();
});
