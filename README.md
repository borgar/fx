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
  |- |- |-
  | `allowTernary` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
  | `emitRanges` | `false` | Adds offset ranges on the tokens: `{ range: [ start, end ] }`
  | `mergeRanges` | `true` | Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRanges`](#mergeRanges)
  | `negativeNumbers` | `true` | Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1`
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
  CONTEXT_QUOTE: "context-quote",
  CONTEXT: "context",
  RANGE: "range",
  RANGE_BEAM: "range-beam",
  RANGE_NAMED: "range-named",
  RANGE_TERNARY: "range-ternary",
  FX_PREFIX: "fx-prefix",
  UNKNOWN: "unknown"
}
```

To support syntax highlighting as you type, `STRING` tokens are allowed to be "unterminated". For example, the incomplete formula `="Hello world` would be tokenized as:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: STRING, value: '"Hello world', unterminated: true },
]
```

### <a name="translateToA1" href="#translateToA1">#</a> **translateToA1**( _formula, anchorCell_ )

Translates ranges in a formula or list of tokens from relative R1C1 syntax to absolute A1 syntax.

* `formula` should be a string (an Excel formula) or a token list.

* `anchorCell` should be a simple string reference to an A1 cell (`AF123` or `$C$5`).

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned (be careful that `mergeRanges` must be false).

```js
translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
// => "=SUM(E10,$E$2,Sheet!$E$3)");
```


### <a name="translateToRC" href="#translateToRC">#</a> **translateToRC**( _formula, anchorCell_ )

Translates ranges in a formula or list of tokens from absolute A1 syntax to relative R1C1 syntax.

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

* `context` should be an object containing default reference attributes: `{ workbookName: 'report.xlsx', sheetName: 'Sheet1' }`. If supplied, these are used to match `A1` to `Sheet1!A1`)

All tokens will be tagged with a `.depth` number value to indicating the level of nesting in parentheses as well as an `.index` number indicating their zero based position in the list.

The returned output will be the same array of tokens but the following properties will added to tokens (as applicable):

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


### <a name="mergeRanges" href="#mergeRanges">#</a> **mergeRanges**( _tokenlist_ )

Given a tokenlist, returns a new list with ranges returned as whole references (`Sheet1!A1:B2`) rather than separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).


### <a name="fixRanges" href="#fixRanges">#</a> **fixRanges**( _formula[, { addBounds: true } ]_ )

Normalizes A1 style ranges in a formula or list of tokens so that the top and left coordinates of the range are on the left-hand side of a colon operator:

* `B2:A1` → `A1:B2`
* `1:A1` → `A1:1`
* `A:A1` → `A1:A`
* `B:A` → `A:B`
* `2:1` → `1:2`
* `A1:A1` → `A1`

When `{ addBounds: true }` is passed as an option, the missing bounds are also added. This can be done to ensure Excel compatible ranges. The fixes then additionally include:

* `1:A1` → `A1:1` → `1:1`
* `A:A1` → `A1:A` → `A:A`
* `A1:A` → `A:A`
* `A1:1` → `A:1`
* `B2:B` → `B2:1048576`
* `B2:2` → `B2:XFD2`

Returns the same formula with the ranges updated. If an array of tokens was supplied, then a new array is returned.

### <a name="isRange" href="#isRange">#</a> **isRange**( _token_ )

Returns `true` if the input is a token that has a type of either RANGE (`A1` or `A1:B2`), RANGE_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or RANGE_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.


### <a name="isReference" href="#isReference">#</a> **isReference**( _token_ )

Returns `true` if the input is a token of type RANGE (`A1` or `A1:B2`), RANGE_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), RANGE_BEAM (`A:A` or `1:1`), or RANGE_NAMED (`myrange`). In all other cases `false` is returned.


### .a1:

An object of methods to interpret and manipulate A1 style references.

#### <a name="a1.parse" href="#a1.parse">#</a> **.parse**( _refString[, { allowNamed: true, allowTernary: true } ]_ )

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

For A:A or A1:A style ranges, null will be used for any dimensions that the syntax does not specify:

#### <a name="a1.stringify" href="#a1.stringify">#</a> **.stringify**( _refObject_ )

Get a string representation of a reference object.

```js
import { a1 } from '@borgar/fx';
a1.stringify({
  workbookName: '',
  sheetName: 'Sheet1',
  range: {
    top: 0,
    left: 0,
    bottom: 1,
    right: 1
    $top: true,
    $left: false,
    $bottom: false,
    $right: true
  }
});
// => 'Sheet1!A$1:$B2'
```

#### <a name="a1.addBounds" href="#a1.addBounds">#</a> **.addBounds**( _refObject_ )

Fill the any missing bounds in range objects. Top will be set to 0, bottom to 1048575, left to 0, and right to 16383, if they are `null` or `undefined`.

```js
import { a1 } from '@borgar/fx';
a1.stringify({
  workbookName: '',
  sheetName: 'Sheet1',
  range: {
    top: 0,
    left: 0,
    bottom: 1,
    $top: true,
    $left: false,
    $bottom: false,
  }
});
// => {
//   workbookName: '',
//   sheetName: 'Sheet1',
//   range: {
//     top: 0,
//     left: 0,
//     bottom: 1,
//     right: 16383,
//     $top: true,
//     $left: false,
//     $bottom: false,
//     $right: false
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

#### <a name="rc.parse" href="#rc.parse">#</a> **.parse**( _refString[, { allowNamed: true, allowTernary: true } ]_ )

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

#### <a name="rc.stringify" href="#rc.stringify">#</a> **.stringify**( _refObject_ )

Get a string representation of a reference object.

```js
import { a1 } from '@borgar/fx';
a1.stringify({
  workbookName: '',
  sheetName: 'Sheet1',
  range: {
    r0: 9,
    c0: 8,
    r1: 9,
    c1: 8,
    $c0: true,
    $c1: true
    $r0: false,
    $r1: false
  }
});
// => 'Sheet1!R[9]C9:R[9]C9'
```


#### <a name="rc.from" href="#rc.from">#</a> **.from**( _rangeObject_ )

Stringify a range object ([see above](#rc.parse)) into R1C1 syntax.

#### <a name="rc.to" href="#rc.to">#</a> **.to**( _columnString_ )
Parse a simple string reference to an R1C1 range into a range object ([see above](#rc.parse)).

