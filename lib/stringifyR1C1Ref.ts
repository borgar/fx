/*
** RC notation works differently from A1 in that we can't merge static
** references joined by `:`. Merging can only work between references
** that are relative/absolute on the same axes, so:
** - R1C1:R2C2 will work,
** - R[1]C1:R[2]C2 will also work, but
** - R[1]C[1]:R2C2 doesn't have a direct rectangle represention without context.
*/
import type { ReferenceName, ReferenceNameXlsx, ReferenceR1C1, ReferenceR1C1Xlsx } from './types.ts';
import { stringifyPrefix, stringifyPrefixXlsx } from './stringifyPrefix.ts';
import { stringifyR1C1Range } from './stringifyR1C1Range.ts';

/**
 * Get an R1C1-style string representation of a reference object.
 *
 * ```js
 * stringifyR1C1Ref({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     r0: 9,
 *     c0: 8,
 *     r1: 9,
 *     c1: 8,
 *     $c0: true,
 *     $c1: true
 *     $r0: false,
 *     $r1: false
 *   }
 * });
 * // => 'Sheet1!R[9]C9:R[9]C9'
 * ```
 *
 * @param refObject A reference object
 * @param [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns The reference in R1C1-style string format
 */
export function stringifyR1C1Ref (
  refObject: ReferenceR1C1 | ReferenceR1C1Xlsx | ReferenceName | ReferenceNameXlsx,
  { xlsx = false }: { xlsx?: boolean; } = {}
): string {
  const prefix = xlsx
    ? stringifyPrefixXlsx(refObject as ReferenceR1C1Xlsx)
    : stringifyPrefix(refObject as ReferenceR1C1);
  return prefix + (
    // @ts-expect-error -- We want speed, not type infrencecing here.
    refObject.name
      ? (refObject as ReferenceName).name
      : stringifyR1C1Range((refObject as ReferenceR1C1).range)
  );
}
