import { parseRefCtx, parseRefXlsx } from './parseRef.ts';
import { parseA1Range } from './parseA1Range.ts';
import type { ReferenceA1, ReferenceA1Xlsx, ReferenceName, ReferenceNameXlsx } from './types.ts';

/**
 * Options for {@link parseA1Ref}.
 */
export type OptsParseA1Ref = {
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
 * The sheet scope may name a range of sheets rather than a single one: a 3-D reference
 * (`Jan:Dec!A1`) puts both sheet names in it, as `context: [ 'Jan:Dec' ]`. Resolving that scope
 * against a workbook's sheets therefore needs {@link splitSheetRange} first, or it matches no
 * sheet at all and silently finds nothing. The scope is returned unquoted —
 * `'Sheet 1:Sheet 3'!A1` yields `context: [ 'Sheet 1:Sheet 3' ]` — which is the form
 * {@link splitSheetRange} expects, so pass it on as it comes.
 *
 * A sheet range only ever arrives in front of a cell reference. Measured in Excel, a bare
 * colon-bearing scope in front of a defined name is no sheet range — the colon is the range
 * operator, so `Alpha:Gamma!SomeName` is two operands rather than one reference — and this
 * function returns `undefined` for it, as it does for any expression that is not a single
 * reference. The quoted spelling is the exception: Excel reads `'Alpha:Gamma'!SomeName` as a
 * workbook *file name* with no sheet at all, which _Fx_ has no way to represent, so that one is
 * still returned as a sheet range. See {@link splitSheetRange}.
 *
 * @see {@link OptsParseA1Ref}
 * @see {@link splitSheetRange}
 * @param refString An A1-style reference string.
 * @param options Options.
 * @returns An object representing a valid reference or `undefined` if it is invalid.
 */
export function parseA1Ref (
  refString: string,
  { allowNamed = true, allowTernary = false }: OptsParseA1Ref = {}
): ReferenceA1 | ReferenceName | undefined {
  const d = parseRefCtx(refString, { allowNamed, allowTernary, r1c1: false });
  if (d) {
    if (d.name) {
      return { context: d.context, name: d.name };
    }
    else if (d.r0) {
      const range = parseA1Range(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
      if (range) {
        return { context: d.context, range };
      }
    }
  }
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
 * The `sheetName` may name a range of sheets rather than a single one: a 3-D reference
 * (`Jan:Dec!A1`) puts both sheet names in it, as `sheetName: 'Jan:Dec'`. Resolving it against a
 * workbook's sheets therefore needs {@link splitSheetRange} first, or it matches no sheet at all
 * and silently finds nothing. The name is returned unquoted — `'Sheet 1:Sheet 3'!A1` yields
 * `sheetName: 'Sheet 1:Sheet 3'` — which is the form {@link splitSheetRange} expects, so pass it
 * on as it comes.
 *
 * A sheet range only ever arrives in front of a cell reference. Measured in Excel, a bare
 * colon-bearing scope in front of a defined name is no sheet range — the colon is the range
 * operator, so `Alpha:Gamma!SomeName` is two operands rather than one reference — and this
 * function returns `undefined` for it, as it does for any expression that is not a single
 * reference. The quoted spelling is the exception: Excel reads `'Alpha:Gamma'!SomeName` as a
 * workbook *file name* with no sheet at all, which _Fx_ has no way to represent, so that one is
 * still returned as a sheet range. See {@link splitSheetRange}.
 *
 * @see {@link OptsParseA1Ref}
 * @see {@link splitSheetRange}
 * @param refString An A1-style reference string.
 * @param options Options.
 * @returns An object representing a valid reference or `undefined` if it is invalid.
 */
export function parseA1RefXlsx (
  refString: string,
  { allowNamed = true, allowTernary = false }: OptsParseA1Ref = {}
): ReferenceA1Xlsx | ReferenceNameXlsx | undefined {
  const d = parseRefXlsx(refString, { allowNamed, allowTernary, r1c1: false });
  if (d) {
    if (d.name) {
      return { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name };
    }
    else if (d.r0) {
      if (d.r0) {
        const range = parseA1Range(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
        if (range) {
          return { workbookName: d.workbookName, sheetName: d.sheetName, range };
        }
      }
    }
  }
}
