import { parseRefCtx, parseRefXlsx } from './parseRef.ts';
import { fromA1 } from './fromA1.ts';
import type { ReferenceA1, ReferenceA1Xlsx, ReferenceName, ReferenceNameXlsx } from './types.ts';

export type ParseA1RefOptions = {
  /**
   * Enable parsing names as well as ranges.
   * @defaultValue true
   */
  allowNamed?: boolean,
  /**
   * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`.
   * These are supported by Google Sheets but not Excel. See: [References.md](./References.md).
   * @defaultValue false
   */
  allowTernary?: boolean,
};

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseA1Ref('Sheet1!A$1:$B2');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     top: 0,
 * //     left: 0,
 * //     bottom: 1,
 * //     right: 1
 * //     $top: true,
 * //     $left: false,
 * //     $bottom: false,
 * //     $right: true
 * //   }
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify.
 *
 * @param refString  An A1-style reference string
 * @returns An object representing a valid reference or null if it is invalid.
 */
export function parseA1Ref (
  refString: string,
  { allowNamed = true, allowTernary = false }: ParseA1RefOptions = {}
): ReferenceA1 | ReferenceName | null {
  const d = parseRefCtx(refString, { allowNamed, allowTernary, r1c1: false });
  if (d) {
    if (d.name) {
      return { context: d.context, name: d.name };
    }
    else if (d.r0) {
      const range = fromA1(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
      if (range) {
        return { context: d.context, range };
      }
    }
  }
  return null;
}

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseA1Ref('Sheet1!A$1:$B2');
 * // => {
 * //   workbookName: '',
 * //   sheetName: 'Sheet1',
 * //   range: {
 * //     top: 0,
 * //     left: 0,
 * //     bottom: 1,
 * //     right: 1
 * //     $top: true,
 * //     $left: false,
 * //     $bottom: false,
 * //     $right: true
 * //   }
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify.
 *
 * @param refString  An A1-style reference string
 * @returns An object representing a valid reference or null if it is invalid.
 */
export function parseA1RefXlsx (
  refString: string,
  { allowNamed = true, allowTernary = false }: ParseA1RefOptions = {}
): ReferenceA1Xlsx | ReferenceNameXlsx | null {
  const d = parseRefXlsx(refString, { allowNamed, allowTernary, r1c1: false });
  if (d) {
    if (d.name) {
      return { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name };
    }
    else if (d.r0) {
      if (d.r0) {
        const range = fromA1(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
        if (range) {
          return { workbookName: d.workbookName, sheetName: d.sheetName, range };
        }
      }
    }
  }
  return null;
}
