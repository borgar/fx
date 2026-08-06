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
 * A failed parse hands back `undefined`, which is accepted and returned as `undefined`, so this
 * composition needs no guard between the two calls.
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
 * This reads a whole reference because a sheet range is a sheet range only in front of a cell
 * reference: the colon means one thing there and another in front of anything Excel reaches by
 * name, and the scope itself does not say which. A colon-bearing scope in front of a defined name
 * or a structured reference is never a sheet range in Excel. Unquoted, the colon is the range
 * operator, so `Alpha:Gamma!SomeName` joins a name `Alpha` to `Gamma!SomeName`, and
 * `Alpha:Gamma!Table1[Col]` is stored as `Alpha:Table1[Col]`. Quoted, the scope is a workbook
 * *file name*, colon and all, so `'Alpha:Gamma'!SomeName` is stored as `[n]!SomeName`, with no
 * sheet in it at all.
 *
 * _Fx_ reads the bare forms as Excel does: the parsers hand back no single reference for them,
 * so no scope arrives here to be split. The quoted ones do arrive, and this returns `undefined`
 * for them, leaving the scope to be resolved whole. That resolution reaches the workbook on its
 * own: Excel tests a lone scope as a sheet name first and matches it against a workbook second,
 * and a colon-bearing scope can only fail the sheet test, since `:` is a character no sheet name
 * may hold. See [Prefixes.md](./Prefixes.md).
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
 * Pass that scope in the form the parsers hand back. `parseA1Ref` and `parseR1C1Ref` have already
 * stripped the surrounding quotes and collapsed doubled apostrophes, so `'It''s:Fine'!A1` arrives
 * as the scope `It's:Fine`. This function does no unquoting of its own: it splits on the colon
 * and returns the two halves verbatim, ready to match against a workbook's sheets.
 *
 * Handing it a raw quoted prefix instead does not fail at all:
 * `splitSheetRange("'Sheet 1:Sheet 3'")` returns `[ "'Sheet 1", "Sheet 3'" ]`, two names with stray
 * quotes, and no `undefined` to signal it. A whole prefix is wrong for a second reason too: a colon
 * in a path scope is a Windows drive letter and divides no sheet names. A reference passed whole
 * avoids both, since its scopes are already unquoted and only its sheet scope is ever read.
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
