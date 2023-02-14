# _fx_

This is a collection utilities to work with Excel formula code, specifically syntax highlighting.

This utility is developed as tooling for [GRID – The new face of spreadsheets](https://grid.is/), to which it owes a debt of gratitude.

## Installing

The library is also provided as an ES6 module in an NPM package:

    $ npm install @borgar/fx

## API

### <a name="tokenize" href="#tokenize">#</a> **tokenize**( _formula [, options]_ )

* `formula` should be a string (an Excel formula).

* `options` are set as an object of keys: `convert(filename, { option: true })`. Supported options are:

  | name | default | effect |
  |- | - | -
  | `allowPartials` | `false` | Enables the recognition of "partial" ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel.
  | `emitRanges` | `false` | Adds offset ranges on the tokens: `{ range: [ start, end ] }`
  | `mergeRanges` | `true` | Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRanges`](#mergeRanges)
  | `negativeNumbers` | `false` | Merges all unary minuses with their immediately following number tokens (`-`,`1`) => `-1`
  | `r1c1` | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.

The returned output will be an array of objects representing the tokens:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: FUNCTION, value: 'SUM' },
  { type: OPERATOR, value: '(' },
  { type: RANGE, value: 'A1:B2' },
  { type: OPERATOR, value: ')' }
]
```

Token types may be found as an Object as the `tokenTypes` export on the package (`import {tokenTypes} from '@borgar/fx';`):

```js
tokenTypes = {
  OPERATOR: "operator",
  BOOLEAN: "bool",
  ERROR: "error",
  NUMBER: "number",
  FUNCTION: "function",
  NEWLINE: "newline",
  WHITESPACE: "whitespace",
  STRING: "string",
  PATH_QUOTE: "path-quote",
  PATH_BRACE: "path-brace",
  PATH_PREFIX: "path-prefix",
  RANGE: "range",
  RANGE_BEAM: "range-beam",
  RANGE_NAMED: "range-named",
  RANGE_PART: "range-part",
  FX_PREFIX: "fx-prefix",
  UNKNOWN: "unknown"
}
```

To support syntax highlighting as you type, `STRING`, `PATH_BRACE`, and `PATH_QUOTE` tokens are allowed to be "unterminated". For example, the incomplete formula `="Hello world` would be tokenized as:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: STRING, value: '"Hello world', unterminated: true },
]
```

### <a name="translateToA1" href="#translateToA1">#</a> **translateToA1**( _formula, anchorCell_ )

Translates ranges in a formula from relative R1C1 syntax to absolute A1 syntax.

* `formula` should be a string (an Excel formula) or a token list.

* `anchorCell` should be a simple string reference to an A1 cell (`AF123` or `$C$5`).

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned (be careful that `mergeRanges` must be false).

```js
translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
// => "=SUM(E10,$E$2,Sheet!$E$3)");
```


### <a name="translateToRC" href="#translateToRC">#</a> **translateToRC**( _formula, anchorCell_ )

Translates ranges in a formula from absolute A1 syntax to relative R1C1 syntax.

* `formula` should be a string (an Excel formula) or a token list.

* `anchorCell` should be a simple string reference to an A1 cell (`AF123` or `$C$5`).

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned (be careful that `mergeRanges` must be false).

```js
translateToRC("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
// => "=SUM(RC[1],R2C5,Sheet!R3C5)");
```


### <a name="addMeta" href="#addMeta">#</a> **addMeta**( _tokenlist [, context]_ )

Runs through a list of tokens and adds extra attributes such as matching parens and ranges.

* `tokenlist` should be a token list (from `tokenize()`).

* `context` should be an object containing default reference attributes: `{ workbookName: 'report.xlsx', sheetName: 'Sheet1' })`. If supplied, these are used to match A1 to "Sheet1A1)

The returned output will be the same array of tokens but the following properties will added to tokens (as applicable):


### <a name="mergeRanges" href="#mergeRanges">#</a> **mergeRanges**( _tokenlist_ )

Given a tokenlist, returns a new list with ranges returned as whole references (`Sheet1!A1:B2`) rather than separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).


### <a name="isRange" href="#isRange">#</a> **isRange**( _token_ )

Returns `true` if the input is a token that has a type of either RANGE (`A1` or `A1:B2`), RANGE_PART (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or RANGE_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.


### <a name="isReference" href="#isReference">#</a> **isReference**( _token_ )

Returns `true` if the input is a token of type RANGE (`A1` or `A1:B2`), RANGE_BEAM (`A:A` or `1:1`), or RANGE_NAMED (`myrange`). In all other cases `false` is returned.


#### Parentheses ( )

Matching parens will be tagged with `.groupId` string identifier as well as a `.depth` number value (indicating the level of nesting).

Closing parens without a counterpart will be tagged with `.error` (boolean true).

#### Curly brackets { }

Matching curly brackets will be tagged with `.groupId` string identifier. These may not be nested in Excel.

Closing curly brackets without a counterpart will be tagged with `.error` (boolean `true`).

#### Ranges (`RANGE` or `RANGE_BEAM` type tokens)

All ranges will be tagged with `.groupId` string identifier regardless of the number of times they occur.

#### Tokens of type `UNKNOWN`

All will be tagged with `.error` (boolean `true`).



### .a1:

An object of methods to interpret and manipulate A1 style references.

#### <a name="a1.parse" href="#a1.parse">#</a> **.parse**( _refString[, { allowNamed: true, allowPartials: true } ]_ )

Parse a string reference into an object representing it.

```js
import { a1 } from '@borgar/fx';
a1.parse('Sheet1!A$1:$B2');
// => {
//   workbookName: '',
//   sheetName: 'Sheet1',
//   range: {
//     top: 0,
//     left: 0,
//     bottom: 1,
//     right: 1
//     $top: true,
//     $left: false,
//     $bottom: false,
//     $right: true
//   }
// }
```

#### <a name="a1.to" href="#a1.to">#</a> **.to**( _columnString_ )

Parse a simple string reference to an A1 range into a range object ([see above](#a1.parse)). Will accept `A1`, `A2`, `A:A`, or `1:1`.

#### <a name="a1.from" href="#a1.from">#</a> **.from**( _rangeObject_ )

Stringify a range object ([see above](#a1.parse)) into A1 syntax.

#### <a name="a1.fromCol" href="#a1.fromCol">#</a> **.fromCol**( _columnString_ )

Convert a column string representation to a 0 based offset number (`"C"` = `2`). The method expects a valid column identifier made up of _only_ A-Z letters, which may be either upper or lower case. Other input will return garbage.

#### <a name="a1.toCol" href="#a1.toCol">#</a> **.toCol**( _columnNumber_ )

Convert a 0 based offset number to a column string representation (`2` = `"C"`). The method expects a number between 0 and 16383. Other input will return garbage.

### .rc:

An object of methods to interpret and manipulate R1C1 style references.

#### <a name="rc.parse" href="#rc.parse">#</a> **.parse**( _refString[, { allowNamed: true, allowPartials: true } ]_ )

Parse a string reference into an object representing it.

```js
import { rc } from '@borgar/fx';
rc.parse('Sheet1!R[9]C9:R[9]C9');
// => {
//   workbookName: '',
//   sheetName: 'Sheet1',
//   range: {
//     r0: 9,
//     c0: 8,
//     r1: 9,
//     c1: 8,
//     $c0: true,
//     $c1: true
//     $r0: false,
//     $r1: false
//   }
// }
```

#### <a name="rc.from" href="#rc.from">#</a> **.from**( _rangeObject_ )

Stringify a range object ([see above](#rc.parse)) into R1C1 syntax.

#### <a name="rc.to" href="#rc.to">#</a> **.to**( _columnString_ )
Parse a simple string reference to an R1C1 range into a range object ([see above](#rc.parse)).


----


## References and Ranges

In Excels spreadsheet formula language terminology, a reference is similar to what is in most programming is called a variable. Spreadsheets do not have variables though, they have cells. The cells can be referenced in formulas, either directly (such as `=SUM(A1)`), or through aliases (such as `=SUM(someName)`).

A range is when a cell, or a set of cells, is referenced directly. Ranges in formulas can come in one of two syntax styles: The commonly known A1 style, as well as R1C1 style where both axes are numerical. Only one style can be used at a time in a formula.

This tokenizer considers there to be three "types" of ranges:

### Ranges (`RANGE`)

The basic type of range will be referencing either:

* A single cell, like `A1` or `AF31`.
* A bounded rectangle of cells, like `A1:B2` or `AF17:AF31`.


### Range partial (`RANGE_PART`)

Partials are essentially rectangles of cells that are unbounded in either bottom or right dimension. They are:

* A rectangle of cells that is unbounded to the bottom, like `A1:A` or `C3:D`.
* A rectangle of cells that is unbounded to the right, like `A1:1` or `F2:5`.

This type of range is not supported in Excel, so it is an opt-in for the tokenizer ([see above](#tokenize)).


### Range beams (`RANGE_BEAM`)

Range beams are rectangles of cells that are unbounded in either left and right, or top and bottom dimensions.

* A rectangle of cells that is unbounded to the top and bottom, like `A:A` or `C:D`.
* A rectangle of cells that is unbounded to the left and right, like `1:1` or `2:5`.


Spreadsheet applications will normalize all of these types when you enter a formula, flipping the left/right and top/bottom coordinates as needed to keep the range top to bottom and left to right.
