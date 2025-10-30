import { describe, expect, expectTypeOf, it } from 'vitest';
import * as ctxEntry from '../index.ts';
import * as xlsxEntry from './index.ts';

// What happens when B2:A1 -> should work!
describe('xlsx interface', () => {
  describe('should be the same as default one', () => {
    const keys = new Set([ ...Object.keys(ctxEntry), ...Object.keys(xlsxEntry) ]);
    for (const key of keys) {
      it(key, () => {
        // addTokenMeta is only exposed on the xlsx side
        if (key === 'addTokenMeta') {
          expect(typeof ctxEntry[key]).toBe('undefined');
          expect(typeof xlsxEntry[key]).toBe('function');
        }
        else {
          expectTypeOf(ctxEntry[key]).toEqualTypeOf(xlsxEntry[key]);
        }
      });
    }
  });

  it('addTokenMeta exists', () => {
    expect(typeof xlsxEntry.addTokenMeta === 'function').toBeTruthy();
  });
});

