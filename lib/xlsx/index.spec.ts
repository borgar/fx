import { describe, expectTypeOf, it } from 'vitest';
import * as ctxEntry from '../index.ts';
import * as xlsxEntry from './index.ts';

// What happens when B2:A1 -> should work!
describe('xlsx interface', () => {
  describe('should be the same as default one', () => {
    const keys = Object.keys(ctxEntry);
    for (const key of keys) {
      it(key, () => {
        expectTypeOf(ctxEntry[key]).toEqualTypeOf(xlsxEntry[key]);
      });
    }
  });
});
