# Reference prefix syntax

Observably, Excel has two variants of the reference syntax prefixes. It has one which it uses in it's interface and at runtime in the formula language, and a second one which is used only in XLSX files.

This document explains how the syntaxes work and how _Fx_ treats them. Quoted versions of prefixes are ignored here as they work the same and would only serve to complicate things needlessly.

Although tenuous as Excel terms, we'll work with these:

* `prefix` is the part of the reference syntax that precedes the ! symbol.
* `scope` is any path, workbook, or sheet that the referenced item belongs to.
* `context` is the collection of scopes that a reference has.


## Runtime variant (_Fx_ default)

Excel's reference prefix syntax is observed to follow the rule that given 2 or more items (scopes), the second to last will be wrapped in square brackets. This permits the forms:

* `a!`
* `[a]b!`
* `a[b]c!`

The form `[a]!` is not permitted and will yield a `#REF!` error when used (which might only be through the INDIRECT function).

This of course means that there is no designated seating for scopes other than order. And order it matters because of how Excel has chosen to resolve scopes:

* If there are 3 scopes they are used respectively as path, workbook name, sheet name.
* If there are 2 scopes they are used respectively as workbook name, sheet name.
* If there is only 1 scope Excel first tests if the scope exists as a sheet name in the current workbook (even for names), then attempts to match the scope to a workbook.

This last claim can be verified by opening two Excel workbooks, referencing a cell across them (use `INDIRECT("Other.xlsx!A1")`), and then (in the workbook the reference lives) creating a new sheet with the same name as the external workbook (e.g. `Other.xlsx`). The reference will now point to the new sheet. 

Notably, the form `scope!entity` is ambiguous! A given that a workbook `Workbook.xlsx` is located at `/Users/MyName/Documents/` on your drive, and has single sheet called `Sheet1`, all of the following will resolve to the same thing:

* `A1`
* `Sheet1!A1`
* `Workbook.xlsx!A1`
* `[Workbook.xlsx]Sheet1!A1`
* `'/Users/MyName/Documents/[Workbook.xlsx]Sheet1'!A1`

However, `[Workbook.xlsx]!A1` and `[Sheet]!A1` will yield a #REF! error. This can be verified with the INDIRECT function.

There is no difference in how the syntax works between ranges, names, or tables. And there is no difference in how the syntax works in external references vs. internal ones. Excel just tries hard to normalize references and remove redundancies when a user edits a formula.

When parsing references, _Fx_ will output the scopes in order of appearance:

```js
parseA1Ref('[Workbook.xlsx]Sheet1!A1');
/* ⇒ {
  context: [ 'Workbook.xlsx', 'Sheet1' ],
  range: { ... }
}
*/
```

Inversely, when serializing a reference object, _Fx_ expects the `context` property to have a list of scopes.


## XLSX variant

When Excel saves a workbook to one of its XML formats (most commonly as .xlsx) it uses an alternative syntax for prefixes. In this variant there will at most be two parts to the prefix, and there are no ambiguities: External link indexes are wrapped in square brackets, sheet names are not:

* `a!`
* `[a]!`
* `[a]b!`

Since the XML files only ever emitted with positive integer indexes instead of workbook names, whether the syntax allows anything else is speculative. _Fx_ chooses to be permissive in handling this variant and allows `[Workbook.xlsx]!A1` forms as well as `[1]!A1`.

Why the formula language does not use this unambiguous and somewhat more intuitive variant rather than the above form is a question for Excel historians, likely this later form was introduced with the XML format to eliminate the ambiguity?

When parsing references in `xlsx` mode — which is to say with the methods of the `@borgar/fx/xlsx` entry point, where each one is the xlsx counterpart of its namesake — _Fx_ will emit `workbookName` and `sheetName` properties corresponding to the bracketing:

```js
// from '@borgar/fx/xlsx'
parseA1Ref('[1]!A1');
/* ⇒ {
  workbookName: '1',
  sheetName: '',
  range: { ... }
}
*/
```

Inversely, when serializing a reference object, _Fx_ expects the `workbookName` and `sheetName` properties to dictate how to compose the prefix.


## 3-D references

A prefix may name a range of sheets rather than a single one — `Sheet1:Sheet2!A1` refers to cell `A1` on every sheet from `Sheet1` to `Sheet2`. Excel calls these 3-D references.

The sheet range occupies the sheet slot of the prefix, as a single compound name:

```js
parseA1Ref('Jan:Dec!A1');
/* ⇒ {
  context: [ 'Jan:Dec' ],
  range: { ... }
}
*/

// from '@borgar/fx/xlsx'
parseA1Ref('[1]Sheet1:Sheet2!A1');
/* ⇒ {
  workbookName: '1',
  sheetName: 'Sheet1:Sheet2',
  range: { ... }
}
*/
```

There is no ambiguity to resolve inside the sheet scope: `:` is one of the characters Excel forbids in a sheet name, so a colon there can only be separating two of them. A colon elsewhere in the prefix is something else — a Windows drive letter in a path, or a colon in a workbook file name — which is why the split below is scoped rather than applied to the prefix as a whole.

**Anything that resolves a sheet name must split that slot first.** A 3-D reference puts `Jan:Dec` exactly where an ordinary reference puts `Sheet1`, and nothing but the colon inside the name distinguishes them. Code that looks a sheet name up against the workbook's sheets and is handed the slot whole will match no sheet at all — and, since a lookup that finds nothing usually reads as "no such sheet" rather than as an error, will do so silently. Use `splitSheetRange`, which returns the two sheet names, or `undefined` for an ordinary single-sheet scope:

```js
const ref = parseA1Ref(refString);
const scope = ref.context[ref.context.length - 1];
const sheets = splitSheetRange(scope) ?? [ scope ];
```

Pass it only the sheet scope. A path scope may contain a colon of its own — a Windows drive letter — without that colon dividing it into two names.

Because the colon separates two names rather than belonging to either, the quoting rules are applied to each end on its own, and the whole prefix is quoted as one unit if either end calls for it. So `=SUM(Sales:Marketing!B3)` needs no quotes, while `'Sheet1:Sheet 2'!A1` does — the same as Excel.

What calls for the quotes is a *name*, not the sheet range as a whole: a name Excel quotes standing alone quotes the whole range it is an end of, and how long the two names are has nothing to do with it. Measured in Excel on a workbook with sheets `A`, `B`, `C`, `D`, `AA` and `AB`, `=SUM(A:B!A1)`, `=SUM(AA:AB!A1)` and `=SUM(A:AB!A1)` are all stored as typed, while `=SUM(B:C!A1)` and `=SUM(C:D!A1)` gain quotes: `C` is R1C1 shorthand, and Excel quotes it wherever it names a sheet. `R` measures the same way, and _Fx_ quotes `RC` on the same footing. Names that are also cell addresses, and names made only of digits, go the same way, so serializing the sheet ranges `A1:B2` and `1:5` yields `'A1:B2'!A1` and `'1:5'!A1`. _Fx_ quotes one more: a name that reads as a boolean literal, `TRUE` or `FALSE`, since a bare `TRUE!A1` is the boolean joined to a reference and not a prefix at all.

There is one exception, which Excel applies on entry and _Fx_ follows on output: a sheet range that a workbook or path qualifies is quoted as a whole, whatever its two ends look like. Excel normalizes `=SUM([Book.xlsx]S1:S3!A1)` to `=SUM('[Book.xlsx]S1:S3'!A1)`. Note the asymmetry with a single sheet, where Excel instead *removes* the needless quotes: `'[Book.xlsx]Sheet1'!A1` becomes `[Book.xlsx]Sheet1!A1`. This is an entry rule rather than an invariant of what a file may contain: a stored formula Excel never took from the formula bar may contain the bare spelling, `[1]One:Three!A1`, and _Fx_ reads that as the same sheet range.

A 3-D reference is not the same thing as a range whose two ends are on different sheets (`Sheet1!A1:Sheet2!B2`), and the two are told apart by where the `!` is relative to the `:`. They come out of _Fx_ differently:

* `Jan:Dec!A1` is one `REF_RANGE` token and parses to one `ReferenceIdentifier` node. `parseA1Ref` resolves it.
* `Sheet1!A1:Sheet2!B2` is three tokens — two `REF_RANGE` either side of a `:` operator — and parses to a `BinaryExpression` joining two `ReferenceIdentifier` nodes. `parseA1Ref` does not resolve it, and returns `undefined`.

Note that being one token is not what makes a 3-D reference special: a plain `A1:B2` is one `REF_RANGE` token too. What distinguishes the cross-sheet range is that its `:` is the range operator of an expression rather than part of a reference.

Where a sheet name is also a valid cell address, the colon goes to the range operator and is not read as a sheet-range separator: Excel reads `=SUM(A1:B2!C3)` as cell `A1` joined to `'B2'!C3` (yielding `#VALUE!`), and stores it that way. A name that is only a column letter is not taken that way, so `=SUM(A:C!A1)` and `=SUM(Jan:Mar!A1)` are sheet ranges. To reference sheets named `A1` and `B2`, quote the prefix: `=SUM('A1:B2'!C3)`.

Which names count as cell addresses is decided in the notation the cell part uses, so the same two sheet names read oppositely in the two notations. With Excel set to the R1C1 reference style, `=SUM(A1:B2!R3C3)` *is* a sheet range and sums `R3C3` across sheets `A1` through `B2`, where the A1-notation `=SUM(A1:B2!C3)` is `#VALUE!` — `A1` is not a cell address in R1C1 notation, so nothing there competes with the colon. Inverted, the R1C1 cell addresses go to the range operator exactly as the A1 ones do: `=SUM(R1C1:R2C2!R3C3)` in R1C1 mode is cell `R1C1` joined to `'R2C2'!R3C3`. The stored `<f>` is A1 notation whichever style the interface displays, so this belongs to the notation a formula is written in and not to the file. _Fx_ follows: with `{ r1c1: true }`, `A1:B2!R3C3` parses as the sheet range `A1:B2` and `R1C1:R2C2!R3C3` is not one reference at all.

A prefix is normally either quoted whole or not at all, but _Fx_ also accepts the two ends being quoted separately: `foo:'bar'!A1`, `'foo':'bar baz'!A1`. Both read as the same sheet range as any other spelling, and serializing redistributes the quoting over the whole prefix, so `'foo':'bar baz'!A1` comes back out as `'foo:bar baz'!A1`. A separately-quoted end may contain no colon of its own — Excel forbids one in a sheet name, and the colon dividing the two ends is behind it — so `Jan:'a:b'!A1` is no sheet range.

_Fx_ accepts that to be forgiving of other producers; it is not a spelling of Excel's. Excel does not read a separately-quoted pair as a sheet range at all: it stores `=SUM(plain:'has space'!A1)` as typed and evaluates it to `#NAME?`. Excel does *write* that spelling, though, for a sheet range that has lost an end — the surviving end picks up quotes, and a missing second end is bound to a manufactured external-workbook link. `Nope:'Mar'!A1` is a sheet range whose first end no longer names a sheet, and `Jan:'[1]Nope'!A1` one whose second end does not. _Fx_ refuses the second, a workbook being nameable only ahead of the whole prefix, but reads the first as the sheet range `Nope:Mar`.

A `$` may not appear on an unquoted sheet name. Excel refuses `=SUM($Jan:$Mar!A1)` on entry, and a file containing one does not open at all. `$` is a legal character in a sheet name, so the quoted spelling `'$Jan:$Mar'!A1` is a valid sheet range.

Excel normalizes a sheet range three ways on entry, none of which _Fx_ does:

* **Order.** `=SUM(Mar:Jan!A1)` is rewritten to `=SUM(Jan:Mar!A1)`, and a `<definedName>` containing `Three:One!$A$1` to `One:Three!$A$1`.
* **Degenerate ranges.** `=SUM(Jan:Jan!A1)` collapses to `=SUM(Jan!A1)`.
* **Case.** `jan:mar` is corrected to `Jan:Mar`, matching the actual sheet names.

Each of the three needs the workbook's sheet names, in order — to know which end comes first, whether the two ends are the same sheet, and how each is really spelled. _Fx_ works on formula text alone and has none of that, so it leaves all three alone. The un-normalized spellings are valid input; `fixFormulaRanges` will normalize the range of a 3-D reference but never its sheet range, so `Sheet2:Sheet1!B2:A1` becomes `Sheet2:Sheet1!A1:B2` and no further.
