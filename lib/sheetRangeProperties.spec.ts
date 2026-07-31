import { describe, test, expect } from 'vitest';
import { describeCase, properties, sweep } from './sheetRangeProperties.ts';

// A slice small enough to run with the suite. The seeds are fixed so that a failure here is
// reproducible; `node scripts/propertySweep.ts <count> <seed>` runs the same properties over as
// much of the grammar as you have patience for, and is the thing to run after changing a lexer
// or the sheet-name grammar.
const COUNT = 4000;
const SEEDS = [ 1, 2, 3 ];

describe('sheet range properties', () => {
  for (const property of properties) {
    test(property.name, () => {
      const failures = SEEDS.flatMap(seed => sweep({ count: COUNT, seed, only: [ property ] }));
      expect(failures.map(d => describeCase(d.case) + '\n    ' + d.message)).toEqual([]);
    });
  }
});
