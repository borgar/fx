import type { ReferenceStruct, ReferenceStructXlsx } from './types.ts';
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
 * See [References.md](./References.md).
 *
 * @param ref A structured reference string
 * @returns An object representing a valid reference or `undefined` if it is invalid.
 */
export function parseStructRef (ref: string): ReferenceStruct | undefined {
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

/**
 * Parse a structured reference string into an object representing it.
 *
 * ```js
 * parseStructRef('[workbook.xlsx]!tableName[[#Data],[Column1]:[Column2]]');
 * // => {
 * //   workbookName: 'workbook.xlsx',
 * //   sections: [ 'data' ],
 * //   columns: [ 'my column', '@foo' ],
 * //   table: 'tableName',
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * See [References.md](./References.md).
 *
 * @param ref A structured reference string
 * @returns An object representing a valid reference or null if it is invalid.
 */
export function parseStructRefXlsx (ref: string): ReferenceStructXlsx | undefined {
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
