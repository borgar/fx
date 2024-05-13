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

When parsing references in `xlsx` mode, _Fx_ will emit `workbookName` and `sheetName` properties corresponding to the bracketing:

```js
parseA1Ref('[1]!A1', { xlsx: true });
/* ⇒ {
  workbookName: '1',
  sheetName: '',
  range: { ... }
}
*/
```

Inversely, when serializing a reference object, _Fx_ expects the `workbookName` and `sheetName` properties to dictate how to compose the prefix.
