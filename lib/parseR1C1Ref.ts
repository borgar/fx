/*
** RC notation works differently from A1 in that we can't merge static
** references joined by `:`. Merging can only work between references
** that are relative/absolute on the same axes, so:
** - R1C1:R2C2 will work,
** - R[1]C1:R[2]C2 will also work, but
** - R[1]C[1]:R2C2 doesn't have a direct rectangle represention without context.
*/
import type { ReferenceName, ReferenceNameXlsx, ReferenceR1C1, ReferenceR1C1Xlsx } from './types.ts';
import { fromR1C1 } from './fromR1C1.ts';
import { parseRefCtx, parseRefXlsx } from './parseRef.ts';

/**
 * Options for {@link parseR1C1Ref}.
 */
export type OptsParseR1C1Ref = {
  /**
   * Enable parsing names as well as ranges.
   * @defaultValue true
   */
  allowNamed?: boolean;
  /**
   * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`.
   * These are supported by Google Sheets but not Excel.
   * See: [References.md](./References.md).
   * @defaultValue false
   */
  allowTernary?: boolean;
};

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseR1C1Ref('Sheet1!R[9]C9:R[9]C9');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     r0: 9,
 * //     c0: 8,
 * //     r1: 9,
 * //     c1: 8,
 * //     $c0: true,
 * //     $c1: true
 * //     $r0: false,
 * //     $r1: false
 * //   }
 * // }
 * ```
 *
 * @param refString An R1C1-style reference string.
 * @param [options] Options.
 * @returns An object representing a valid reference or `undefined` if it is invalid.
 */
export function parseR1C1Ref (
  refString: string,
  options: OptsParseR1C1Ref = {}
): ReferenceR1C1 | ReferenceName | undefined {
  const {
    allowNamed = true,
    allowTernary = false
  } = options;
  const d = parseRefCtx(refString, { allowNamed, allowTernary, r1c1: true });
  if (d) {
    if (d.name) {
      return { context: d.context, name: d.name } as ReferenceName;
    }
    else if (d.r0) {
      const range = d.r1
        ? fromR1C1(d.r0 + d.operator + d.r1)
        : fromR1C1(d.r0);
      if (range) {
        return { context: d.context, range } as ReferenceR1C1;
      }
    }
  }
}

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseR1C1Ref('Sheet1!R[9]C9:R[9]C9');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     r0: 9,
 * //     c0: 8,
 * //     r1: 9,
 * //     c1: 8,
 * //     $c0: true,
 * //     $c1: true
 * //     $r0: false,
 * //     $r1: false
 * //   }
 * // }
 * ```
 *
 * @param refString An R1C1-style reference string.
 * @param [options] Options.
 * @returns An object representing a valid reference or `undefined` if it is invalid.
 */
export function parseR1C1RefXlsx (
  refString: string,
  options: OptsParseR1C1Ref = {}
): ReferenceR1C1Xlsx | ReferenceNameXlsx | undefined {
  const {
    allowNamed = true,
    allowTernary = false
  } = options;
  const d = parseRefXlsx(refString, { allowNamed, allowTernary, r1c1: true });
  if (d) {
    if (d.name && allowNamed) {
      return { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name } as ReferenceNameXlsx;
    }
    else if (d.r0) {
      const range = d.r1
        ? fromR1C1(d.r0 + d.operator + d.r1)
        : fromR1C1(d.r0);
      if (range) {
        return { workbookName: (d).workbookName, sheetName: (d).sheetName, range } as ReferenceR1C1Xlsx;
      }
    }
  }
}
