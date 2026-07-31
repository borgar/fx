/**
 * A large property sweep over sheet ranges. Not part of `npm run check` — the suite runs a small
 * fast slice of the same properties (see `lib/sheetRangeProperties.spec.ts`); this is the long
 * version, for when the grammar or the lexers change.
 *
 * ```
 * node scripts/propertySweep.ts [count] [seed]
 * ```
 */
import { describeCase, sweep } from '../lib/sheetRangeProperties.ts';

const count = Number(process.argv[2] || 200000);
const seed = Number(process.argv[3] || 1);

const started = Date.now();
const failures = sweep({ count, seed, maxFailures: 40 });
const elapsed = ((Date.now() - started) / 1000).toFixed(1);

console.log(`${count} cases, seed ${seed}, ${elapsed}s`);
if (!failures.length) {
  console.log('all properties hold');
}
for (const failure of failures) {
  console.log('\n' + failure.property);
  console.log('  case: ' + describeCase(failure.case));
  console.log('  ' + failure.message);
}
process.exitCode = failures.length ? 1 : 0;
