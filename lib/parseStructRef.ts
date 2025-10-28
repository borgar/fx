import type { ReferenceStruct, ReferenceStructXlsx } from './extraTypes.ts';
import { parseRefCtx, parseRefXlsx } from './parseRef.ts';
import { parseSRange } from './parseSRange.ts';

/**
 * Parse a structured reference string into an object representing it.
 *
 * ```js
 * parseStructRef('workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]');
 * // => {
 * //   context: [ 'workbook.xlsx' ],
 * //   sections: [ 'data' ],
 * //   columns: [ 'my column', '@foo' ],
 * //   table: 'tableName',
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * See [References.md](./References.md)
 *
 * @param ref  A structured reference string
 * @param [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An object representing a valid reference or null if it is invalid.
 */
export function parseStructRef (ref: string): ReferenceStruct | null;
export function parseStructRef (ref: string, options: { xlsx?: false; }): ReferenceStruct | null;
export function parseStructRef (ref: string, options: { xlsx: true; }): ReferenceStructXlsx | null;
export function parseStructRef (ref: string, options: { xlsx: boolean; }): ReferenceStruct | ReferenceStructXlsx | null;
export function parseStructRef (
  ref: string,
  options: { xlsx?: boolean; } = { xlsx: false }
): ReferenceStruct | ReferenceStructXlsx | null {
  if (options.xlsx) {
    const r = parseRefXlsx(ref);
    if (r && r.struct) {
      const structData = parseSRange(r.struct);
      if (structData && structData.length === r.struct.length) {
        return {
          workbookName: r.workbookName,
          sheetName: r.sheetName,
          table: r.name,
          columns: structData.columns,
          sections: structData.sections
        };
      }
    }
  }
  else {
    const r = parseRefCtx(ref);
    if (r && r.struct) {
      const structData = parseSRange(r.struct);
      if (structData && structData.length === r.struct.length) {
        return {
          context: r.context,
          table: r.name,
          columns: structData.columns,
          sections: structData.sections
        };
      }
    }
  }
  return null;
}
