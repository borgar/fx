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
import { parseRefCtx, parseRefXlsx, type RefParseDataXls, type RefParseDataCtx } from './parseRef.ts';

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
 * @param refString An R1C1-style reference string
 * @param [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An object representing a valid reference or null if it is invalid.
 */
export function parseR1C1Ref (
  refString: string,
  options: { allowNamed?: boolean; allowTernary?: boolean; xlsx?: boolean; } = {}
): ReferenceR1C1 | ReferenceR1C1Xlsx | ReferenceName | ReferenceNameXlsx | null {
  const {
    allowNamed = true,
    allowTernary = false,
    xlsx = false
  } = options;
  const d = xlsx
    ? parseRefXlsx(refString, { allowNamed, allowTernary, r1c1: true })
    : parseRefCtx(refString, { allowNamed, allowTernary, r1c1: true });
  if (d) {
    if (d.name) {
      return xlsx
        ? {
          workbookName: (d as RefParseDataXls).workbookName,
          sheetName: (d as RefParseDataXls).sheetName,
          name: d.name
        } as ReferenceNameXlsx
        : {
          context: (d as RefParseDataCtx).context,
          name: d.name
        } as ReferenceName;
    }
    else if (d.r0) {
      const range = d.r1
        ? fromR1C1(d.r0 + d.operator + d.r1)
        : fromR1C1(d.r0);
      if (range) {
        return xlsx
          ? {
            workbookName: (d as RefParseDataXls).workbookName,
            sheetName: (d as RefParseDataXls).sheetName,
            range
          } as ReferenceR1C1Xlsx
          : {
            context: (d as RefParseDataCtx).context,
            range
          } as ReferenceR1C1;
      }
    }
  }
  return null;
}
