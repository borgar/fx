/**
 * Splits the sheet scope of a prefix into the two sheet names of a sheet range, if it holds one.
 *
 * A 3-D reference (`Sheet1:Sheet2!A1`) spans every sheet from one named sheet to another. Its two
 * sheet names occupy the single sheet slot of the reference — `context` (the last scope) or
 * `sheetName` in the xlsx variant — which is what this splits apart:
 *
 * ```js
 * splitSheetRange('Jan:Dec');
 * // => [ 'Jan', 'Dec' ]
 * splitSheetRange('Sheet1');
 * // => undefined
 * ```
 *
 * Anything resolving a sheet name against a workbook must split it first. A 3-D reference puts
 * `Jan:Dec` where an ordinary reference puts `Sheet1`, so a lookup that is handed the slot whole
 * matches no sheet at all, and silently finds nothing rather than failing.
 *
 * ```js
 * const ref = parseA1Ref('Jan:Dec!A1');
 * const scope = ref.context[ref.context.length - 1];
 * const sheets = splitSheetRange(scope) ?? [ scope ];
 * // => [ 'Jan', 'Dec' ]
 * ```
 *
 * Pass only the sheet scope. A path scope may hold a colon of its own — a Windows drive letter —
 * without that colon dividing it into two names, and a workbook is not a sheet.
 *
 * @param scope The sheet scope of a prefix.
 * @returns The two sheet names, or `undefined` if the scope does not divide into exactly two.
 */
export function splitSheetRange (scope: string): [ string, string ] | undefined {
  const colon = scope ? scope.indexOf(':') : -1;
  if (colon < 0) {
    return;
  }
  const from = scope.slice(0, colon);
  const to = scope.slice(colon + 1);
  // Excel forbids ":" in a sheet name, so a colon here can only be separating two of them. A
  // scope that does not divide into exactly two names is not a sheet range, and is left to be
  // handled as a (malformed) sheet name.
  return (from && to && !to.includes(':')) ? [ from, to ] : undefined;
}
