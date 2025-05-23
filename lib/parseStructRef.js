import { parseRef } from './parseRef.js';
import { parseSRange } from './parseSRange.js';

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
 * @tutorial References.md
 * @param {string} ref  A structured reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceStruct|null)} An object representing a valid reference or null if it is invalid.
 */
export function parseStructRef (ref, options = { xlsx: false }) {
  const r = parseRef(ref, options);
  if (r && r.struct) {
    const structData = parseSRange(r.struct);
    if (structData && structData.length === r.struct.length) {
      return options.xlsx
        ? {
          workbookName: r.workbookName,
          sheetName: r.sheetName,
          table: r.name,
          columns: structData.columns,
          sections: structData.sections
        }
        : {
          context: r.context,
          table: r.name,
          columns: structData.columns,
          sections: structData.sections
        };
    }
  }
  return null;
}
