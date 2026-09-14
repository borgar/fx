import { stringifyPrefix, stringifyPrefixXlsx } from './stringifyPrefix.ts';
import type { ReferenceA1, ReferenceA1Xlsx, ReferenceName, ReferenceNameXlsx } from './types.ts';
import { stringifyA1Range } from './stringifyA1Range.ts';

/**
 * Get an A1-style string representation of a reference object.
 *
 * ```js
 * stringifyA1Ref({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     top: 0,
 *     left: 0,
 *     bottom: 1,
 *     right: 1,
 *     $top: true,
 *     $left: false,
 *     $bottom: false,
 *     $right: true
 *   }
 * });
 * // => 'Sheet1!A$1:$B2'
 * ```
 *
 * @param refObject A reference object.
 * @param [forceQuotes] Force the prefix to have single quotes around it.
 * @returns The reference in A1-style string format.
 */
export function stringifyA1Ref (refObject: ReferenceA1 | ReferenceName, forceQuotes = false): string {
  const prefix = stringifyPrefix(refObject, forceQuotes);
  return prefix + ('name' in refObject ? refObject.name : stringifyA1Range(refObject.range));
}

/**
 * Get an A1-style string representation of a reference object.
 *
 * ```js
 * stringifyA1Ref({
 *   sheetName: 'Sheet1',
 *   range: {
 *     top: 0,
 *     left: 0,
 *     bottom: 1,
 *     right: 1,
 *     $top: true,
 *     $left: false,
 *     $bottom: false,
 *     $right: true
 *   }
 * });
 * // => 'Sheet1!A$1:$B2'
 * ```
 *
 * @param refObject A reference object.
 * @param [forceQuotes] Force the prefix to have single quotes around it.
 * @returns The reference in A1-style string format.
 */
export function stringifyA1RefXlsx (refObject: ReferenceA1Xlsx | ReferenceNameXlsx, forceQuotes = false): string {
  const prefix = stringifyPrefixXlsx(refObject, forceQuotes);
  return prefix + ('name' in refObject ? refObject.name : stringifyA1Range(refObject.range));
}
