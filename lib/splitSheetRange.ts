import type { AnyReference } from './types.ts';

function sheetScopeOf (ref: AnyReference): string | undefined {
  if ('context' in ref) {
    const context = ref.context;
    return context ? context[context.length - 1] : undefined;
  }
  if ('sheetName' in ref) {
    return ref.sheetName;
  }
}

function splitScope (scope: string): [ string, string ] | undefined {
  const colon = scope ? scope.indexOf(':') : -1;
  if (colon < 0) {
    return;
  }
  const from = scope.slice(0, colon);
  const to = scope.slice(colon + 1);
  // Excel forbids ":" in a sheet name, so wherever a sheet range is a reading at all, a colon here
  // separates two of them. A scope that does not divide into exactly two names is not a sheet
  // range, and is left to be handled as a (malformed) sheet name.
  return (from && to && !to.includes(':')) ? [ from, to ] : undefined;
}

/**
 * Splits the sheet scope of a reference into the two sheet names of a sheet range, if it has one.
 *
 * A 3-D reference (`Sheet1:Sheet2!A1`) spans every sheet from one named sheet to another. Its two
 * sheet names occupy the single sheet slot of the reference (the last scope of `context`, or
 * `sheetName` in the xlsx variant), which is what this splits apart:
 *
 * ```js
 * splitSheetRange(parseA1Ref('Jan:Dec!A1'));
 * // => [ 'Jan', 'Dec' ]
 * splitSheetRange(parseA1Ref('Sheet1!A1'));
 * // => undefined
 * ```
 *
 * A failed parse yields `undefined`, which this accepts and passes through, so the composition
 * needs no guard between the two calls.
 *
 * Anything resolving a sheet name in front of a cell reference must split it first. A 3-D
 * reference puts `Jan:Dec` where an ordinary reference puts `Sheet1`, so a lookup handed the slot
 * whole matches no sheet at all, and finds nothing rather than failing.
 *
 * ```js
 * const ref = parseA1Ref(refString);
 * const scope = ref.context[ref.context.length - 1];
 * const sheets = splitSheetRange(ref) ?? [ scope ];
 * ```
 *
 * This reads a whole reference because the colon divides two sheet names only in front of a cell
 * reference, and the scope alone does not say what follows it. In front of a defined name or a
 * table, Excel reads a colon-bearing prefix as the range operator (`Alpha:Gamma!SomeName` joins a
 * name `Alpha` to `Gamma!SomeName`) or, quoted, as a workbook *file name*, colon and all
 * (`'Alpha:Gamma'!SomeName` is stored as `[n]!SomeName`, with no sheet in it at all).
 *
 * _Fx_ reads those as Excel does. The bare forms never reach here, because the parsers yield no
 * single reference for them; the quoted ones do reach it and get `undefined`, leaving the scope to
 * be resolved whole, which reaches the workbook on its own. See [Prefixes.md](./Prefixes.md).
 *
 * A scope may also be passed on its own, as a string. That form cannot see what follows the `!`,
 * so it divides any colon-bearing scope handed to it; establishing that a cell reference follows
 * is then the caller's business:
 *
 * ```js
 * splitSheetRange('Jan:Dec');
 * // => [ 'Jan', 'Dec' ]
 * ```
 *
 * Pass that scope in the form the parsers hand back: without surrounding quotes and with doubled
 * apostrophes collapsed, so that `'It''s:Fine'!A1` arrives as the scope `It's:Fine`, ready to match
 * against a workbook's sheets. This function does no unquoting of its own, and a raw prefix handed
 * to it returns two names with stray quotes rather than `undefined`:
 * `splitSheetRange("'Sheet 1:Sheet 3'")` returns `[ "'Sheet 1", "Sheet 3'" ]`. A path scope divides
 * on the colon of a Windows drive letter, which separates no sheet names either. Passing the whole
 * reference avoids both, since only its sheet scope is ever read.
 *
 * @param ref A parsed reference, or the sheet scope of one, unquoted.
 * @returns The two sheet names, unquoted as the scope was, or `undefined` when there is no sheet
 * range: when the scope has no colon, more than one, or an empty half, or when what follows the
 * prefix is not a cell reference.
 */
export function splitSheetRange (ref: string | AnyReference): [ string, string ] | undefined {
  if (!ref) {
    return;
  }
  if (typeof ref === 'string') {
    return splitScope(ref);
  }
  // A sheet range is one only in front of a cell reference, so a scope reached through a reference
  // to a name or a table divides into nothing, whatever it holds.
  if (!('range' in ref)) {
    return;
  }
  const scope = sheetScopeOf(ref);
  return scope ? splitScope(scope) : undefined;
}
