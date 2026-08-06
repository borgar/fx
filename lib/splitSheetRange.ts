/**
 * Splits the sheet scope of a prefix into the two sheet names of a sheet range, if it contains one.
 *
 * A 3-D reference (`Sheet1:Sheet2!A1`) spans every sheet from one named sheet to another. Its two
 * sheet names occupy the single sheet slot of the reference (the last scope of `context`, or
 * `sheetName` in the xlsx variant), which is what this splits apart:
 *
 * ```js
 * splitSheetRange('Jan:Dec');
 * // => [ 'Jan', 'Dec' ]
 * splitSheetRange('Sheet1');
 * // => undefined
 * ```
 *
 * Anything resolving a sheet name in front of a cell reference must split it first. A 3-D
 * reference puts `Jan:Dec` where an ordinary reference puts `Sheet1`, so a lookup handed the slot
 * whole matches no sheet at all, and finds nothing rather than failing.
 *
 * ```js
 * const ref = parseA1Ref('Jan:Dec!A1');
 * const scope = ref.context[ref.context.length - 1];
 * const sheets = splitSheetRange(scope) ?? [ scope ];
 * // => [ 'Jan', 'Dec' ]
 * ```
 *
 * Pass the sheet scope alone, in the form the parsers hand back. `parseA1Ref` and `parseR1C1Ref`
 * have already stripped the surrounding quotes and collapsed doubled apostrophes, so
 * `'It''s:Fine'!A1` arrives here as the scope `It's:Fine`. This function does no unquoting of its
 * own: it splits on the colon and returns the two halves verbatim, ready to match against a
 * workbook's sheets.
 *
 * Handing it a raw quoted prefix instead does not fail at all:
 * `splitSheetRange("'Sheet 1:Sheet 3'")` returns `[ "'Sheet 1", "Sheet 3'" ]`, two names with stray
 * quotes, and no `undefined` to signal it. A whole prefix is wrong for a second reason too: a
 * colon in a path scope is a Windows drive letter and divides no sheet names.
 *
 * One caveat. A sheet range is a sheet range only in front of a cell reference, and _Fx_ reads
 * that as Excel does, so an ordinary colon-bearing scope reaches this function from that one
 * place. The exception is a *quoted* scope in front of a defined name or a table: Excel reads
 * `'Alpha:Gamma'!SomeName` as a workbook file name with no sheet at all, which _Fx_ cannot
 * represent and so still reports as the sheet range `[ 'Alpha', 'Gamma' ]`. A caller resolving
 * sheet names for anything but a cell reference has to allow for that itself. See
 * [Prefixes.md](./Prefixes.md).
 *
 * @param scope The sheet scope of a prefix, unquoted.
 * @returns The two sheet names, unquoted as the scope was, or `undefined` when the scope has no
 * colon, more than one, or an empty half.
 */
export function splitSheetRange (scope: string): [ string, string ] | undefined {
  const colon = scope ? scope.indexOf(':') : -1;
  if (colon < 0) {
    return;
  }
  const from = scope.slice(0, colon);
  const to = scope.slice(colon + 1);
  // Excel forbids ":" in a sheet name, so wherever a sheet range is a reading at all, a colon here
  // separates two of them. A scope that does not divide into exactly two names is no sheet range,
  // and is left to be handled as a (malformed) sheet name.
  return (from && to && !to.includes(':')) ? [ from, to ] : undefined;
}
