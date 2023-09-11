# _Fx_ API

**Functions**

- [addA1RangeBounds( range )](#addA1RangeBounds)
- [addTokenMeta( tokenlist, _\[context\]_ )](#addTokenMeta)
- [fixRanges( formula, _\[options\]_ )](#fixRanges)
- [fromA1( rangeString )](#fromA1)
- [fromCol( columnString )](#fromCol)
- [fromR1C1( rangeString )](#fromR1C1)
- [isError( token )](#isError)
- [isFunction( token )](#isFunction)
- [isFxPrefix( token )](#isFxPrefix)
- [isLiteral( token )](#isLiteral)
- [isOperator( token )](#isOperator)
- [isRange( token )](#isRange)
- [isReference( token )](#isReference)
- [isWhitespace( token )](#isWhitespace)
- [mergeRefTokens( tokenlist )](#mergeRefTokens)
- [parse( formula, _\[options\]_ )](#parse)
- [parseA1Ref( refString, _\[options\]_ )](#parseA1Ref)
- [parseR1C1Ref( refString, _\[options\]_ )](#parseR1C1Ref)
- [parseStructRef( ref, _\[options\]_ )](#parseStructRef)
- [stringifyA1Ref( refObject, _\[options\]_ )](#stringifyA1Ref)
- [stringifyR1C1Ref( refObject, _\[options\]_ )](#stringifyR1C1Ref)
- [stringifyStructRef( refObject, _\[options\]_ )](#stringifyStructRef)
- [toA1( range )](#toA1)
- [toCol( columnIndex )](#toCol)
- [toR1C1( range )](#toR1C1)
- [tokenize( formula, _\[options\]_ )](#tokenize)
- [translateToA1( formula, anchorCell, _\[options\]_ )](#translateToA1)
- [translateToR1C1( formula, anchorCell, _\[options\]_ )](#translateToR1C1)

**Constants**

- [nodeTypes](#nodeTypes)
- [tokenTypes](#tokenTypes)

## Functions

### <a id="addA1RangeBounds" href="#addA1RangeBounds">#</a> addA1RangeBounds( range ) ⇒ `object`

Fill the any missing bounds in range objects. Top will be set to 0, bottom to 1048575, left to 0, and right to 16383, if they are `null` or `undefined`.

```js
addA1RangeBounds({
  context: [ 'Sheet1' ],
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
//   context: [ 'Sheet1' ],
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

##### Parameters

| Name  | Type     | Description                           |
| ----- | -------- | ------------------------------------- |
| range | `object` | The range part of a reference object. |

##### Returns

`object` – same range with missing bounds filled in.

---

### <a id="addTokenMeta" href="#addTokenMeta">#</a> addTokenMeta( tokenlist, _[context = `{}`]_ ) ⇒ `Array<object>`

Runs through a list of tokens and adds extra attributes such as matching parens and ranges.

The `context` parameter defines default reference attributes: `{ workbookName: 'report.xlsx', sheetName: 'Sheet1' }`. If supplied, these are used to match `A1` to `Sheet1!A1`.

All tokens will be tagged with a `.depth` number value to indicating the level of nesting in parentheses as well as an `.index` number indicating their zero based position in the list.

The returned output will be the same array of tokens but the following properties will added to tokens (as applicable):

#### Parentheses ( )

Matching parens will be tagged with `.groupId` string identifier as well as a `.depth` number value (indicating the level of nesting).

Closing parens without a counterpart will be tagged with `.error` (boolean true).

#### Curly brackets { }

Matching curly brackets will be tagged with `.groupId` string identifier. These may not be nested in Excel.

Closing curly brackets without a counterpart will be tagged with `.error` (boolean `true`).

#### Ranges (`REF_RANGE` or `REF_BEAM` type tokens)

All ranges will be tagged with `.groupId` string identifier regardless of the number of times they occur.

#### Tokens of type `UNKNOWN`

All will be tagged with `.error` (boolean `true`).

##### Parameters

| Name                   | Type            | Default | Description                                  |
| ---------------------- | --------------- | ------- | -------------------------------------------- |
| tokenlist              | `Array<object>` |         | An array of tokens (from `tokenize()`)       |
| [context]              | `object`        | `{}`    | A contest used to match `A1` to `Sheet1!A1`. |
| [context].sheetName    | `string`        | `""`    | An implied sheet name ('Sheet1')             |
| [context].workbookName | `string`        | `""`    | An implied workbook name ('report.xlsx')     |

##### Returns

`Array<object>` – The input array with the enchanced tokens

---

### <a id="fixRanges" href="#fixRanges">#</a> fixRanges( formula, _[options = `{}`]_ ) ⇒ `string` | `Array<object>`

Normalizes A1 style ranges and structured references in a formula or list of tokens.

It ensures that that the top and left coordinates of an A1 range are on the left-hand side of a colon operator:

`B2:A1` → `A1:B2`  
`1:A1` → `A1:1`  
`A:A1` → `A1:A`  
`B:A` → `A:B`  
`2:1` → `1:2`  
`A1:A1` → `A1`  

When `{ addBounds: true }` is passed as an option, the missing bounds are also added. This can be done to ensure Excel compatible ranges. The fixes then additionally include:

`1:A1` → `A1:1` → `1:1`  
`A:A1` → `A1:A` → `A:A`  
`A1:A` → `A:A`  
`A1:1` → `A:1`  
`B2:B` → `B2:1048576`  
`B2:2` → `B2:XFD2`  

Structured ranges are normalized cleaned up to have consistent order and capitalization of sections as well as removing redundant ones.

Returns the same formula with the ranges updated. If an array of tokens was supplied, then a new array is returned.

##### Parameters

| Name                | Type                        | Default | Description                                                                                                               |
| ------------------- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| formula             | `string` \| `Array<object>` |         | A string (an Excel formula) or a token list that should be adjusted.                                                      |
| [options]           | `object`                    | `{}`    | Options                                                                                                                   |
| [options].addBounds | `boolean`                   | `false` | Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383.                |
| [options].xlsx      | `boolean`                   | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) |

##### Returns

`string` | `Array<object>` – A formula string or token list (depending on which was input)

---

### <a id="fromA1" href="#fromA1">#</a> fromA1( rangeString ) ⇒ `object` | `null`

Parse a simple string reference to an A1 range into a range object. Will accept `A1`, `A2`, `A:A`, or `1:1`.

**See also:** [parseA1Ref](#parseA1Ref).

##### Parameters

| Name        | Type     | Description    |
| ----------- | -------- | -------------- |
| rangeString | `string` | A range string |

##### Returns

`object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a id="fromCol" href="#fromCol">#</a> fromCol( columnString ) ⇒ `number`

Convert a column string representation to a 0 based offset number (`"C"` = `2`).

The method expects a valid column identifier made up of _only_ A-Z letters, which may be either upper or lower case. Other input will return garbage.

##### Parameters

| Name         | Type     | Description                  |
| ------------ | -------- | ---------------------------- |
| columnString | `string` | The column string identifier |

##### Returns

`number` – Zero based column index number

---

### <a id="fromR1C1" href="#fromR1C1">#</a> fromR1C1( rangeString ) ⇒ `object` | `null`

Parse a simple string reference to an R1C1 range into a range object.

**See also:** [parseA1Ref](#parseA1Ref).

##### Parameters

| Name        | Type     | Description    |
| ----------- | -------- | -------------- |
| rangeString | `string` | A range string |

##### Returns

`object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a id="isError" href="#isError">#</a> isError( token ) ⇒ `boolean`

Determines whether the specified token is an error.

Returns `true` if the input is a token of type ERROR (`#VALUE!`). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is error, False otherwise.

---

### <a id="isFunction" href="#isFunction">#</a> isFunction( token ) ⇒ `boolean`

Determines whether the specified token is a function.

Returns `true` if the input is a token of type FUNCTION. In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is function, False otherwise.

---

### <a id="isFxPrefix" href="#isFxPrefix">#</a> isFxPrefix( token ) ⇒ `boolean`

Returns `true` if the input is a token of type FX_PREFIX (leading `=` in formula). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is effects prefix, False otherwise.

---

### <a id="isLiteral" href="#isLiteral">#</a> isLiteral( token ) ⇒ `boolean`

Determines whether the specified token is a literal.

Returns `true` if the input is a token of type BOOLEAN (`TRUE` or `FALSE`), ERROR (`#VALUE!`), NUMBER (123.4), or STRING (`"lorem ipsum"`). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is literal, False otherwise.

---

### <a id="isOperator" href="#isOperator">#</a> isOperator( token ) ⇒ `boolean`

Determines whether the specified token is an operator.

Returns `true` if the input is a token of type OPERATOR (`+` or `:`). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is operator, False otherwise.

---

### <a id="isRange" href="#isRange">#</a> isRange( token ) ⇒ `boolean`

Determines whether the specified token is a range.

Returns `true` if the input is a token that has a type of either REF_RANGE (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or REF_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | A token     |

##### Returns

`boolean` – True if the specified token is range, False otherwise.

---

### <a id="isReference" href="#isReference">#</a> isReference( token ) ⇒ `boolean`

Determines whether the specified token is a reference.

Returns `true` if the input is a token of type REF_RANGE (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), REF_BEAM (`A:A` or `1:1`), or REF_NAMED (`myrange`). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is reference, False otherwise.

---

### <a id="isWhitespace" href="#isWhitespace">#</a> isWhitespace( token ) ⇒ `boolean`

Determines whether the specified token is whitespace.

Returns `true` if the input is a token of type WHITESPACE (` `) or NEWLINE (`\n`). In all other cases `false` is returned.

##### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| token | `object` | The token   |

##### Returns

`boolean` – True if the specified token is whitespace, False otherwise.

---

### <a id="mergeRefTokens" href="#mergeRefTokens">#</a> mergeRefTokens( tokenlist ) ⇒ `Array<any>`

Merges context with reference tokens as possible in a list of tokens.

When given a tokenlist, this function returns a new list with ranges returned as whole references (`Sheet1!A1:B2`) rather than separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).

##### Parameters

| Name      | Type            | Description                            |
| --------- | --------------- | -------------------------------------- |
| tokenlist | `Array<object>` | An array of tokens (from `tokenize()`) |

##### Returns

`Array<any>` – A new list of tokens with range parts merged.

---

### <a id="parse" href="#parse">#</a> parse( formula, _[options = `{}`]_ ) ⇒ `object`

Parses a string formula or list of tokens into an AST.

The parser requires `mergeRefs` to have been `true` in tokenlist options, because it does not recognize reference context tokens.

The AST Abstract Syntax Tree's format is documented in [AST_format.md](./AST_format.md)

**See also:** [nodeTypes](#nodeTypes).

##### Parameters

| Name                        | Type                        | Default | Description                                                                                                                                         |
| --------------------------- | --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| formula                     | `string` \| `Array<object>` |         | An Excel formula string (an Excel expression) or an array of tokens.                                                                                |
| [options]                   | `object`                    | `{}`    | Options                                                                                                                                             |
| [options].allowNamed        | `boolean`                   | `true`  | Enable parsing names as well as ranges.                                                                                                             |
| [options].allowTernary      | `boolean`                   | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |
| [options].negativeNumbers   | `boolean`                   | `true`  | Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).   |
| [options].permitArrayCalls  | `boolean`                   | `false` | Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.                                 |
| [options].permitArrayRanges | `boolean`                   | `false` | Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.                                         |
| [options].r1c1              | `boolean`                   | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.                                                           |
| [options].withLocation      | `boolean`                   | `false` | Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`                                                                 |
| [options].xlsx              | `boolean`                   | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)                           |

##### Returns

`object` – An AST of nodes

---

### <a id="parseA1Ref" href="#parseA1Ref">#</a> parseA1Ref( refString, _[options = `{}`]_ ) ⇒ `object` | `null`

Parse a string reference into an object representing it.

```js
parseA1Ref('Sheet1!A$1:$B2');
// => {
//   context: [ 'Sheet1' ],
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

For A:A or A1:A style ranges, `null` will be used for any dimensions that the syntax does not specify:

##### Parameters

| Name                   | Type      | Default | Description                                                                                                                                         |
| ---------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| refString              | `string`  |         | An A1-style reference string                                                                                                                        |
| [options]              | `object`  | `{}`    | Options                                                                                                                                             |
| [options].allowNamed   | `boolean` | `true`  | Enable parsing names as well as ranges.                                                                                                             |
| [options].allowTernary | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |
| [options].xlsx         | `boolean` | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)                           |

##### Returns

`object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a id="parseR1C1Ref" href="#parseR1C1Ref">#</a> parseR1C1Ref( refString, _[options = `{}`]_ ) ⇒ `object` | `null`

Parse a string reference into an object representing it.

```js
parseR1C1Ref('Sheet1!R[9]C9:R[9]C9');
// => {
//   context: [ 'Sheet1' ],
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

##### Parameters

| Name                   | Type      | Default | Description                                                                                                                                         |
| ---------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| refString              | `string`  |         | An R1C1-style reference string                                                                                                                      |
| [options]              | `object`  | `{}`    | Options                                                                                                                                             |
| [options].allowNamed   | `boolean` | `true`  | Enable parsing names as well as ranges.                                                                                                             |
| [options].allowTernary | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |
| [options].xlsx         | `boolean` | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)                           |

##### Returns

`object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a id="parseStructRef" href="#parseStructRef">#</a> parseStructRef( ref, _[options = `{}`]_ ) ⇒ `object` | `null`

Parse a structured reference string into an object representing it.

```js
parseStructRef('workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]');
// => {
//   context: [ 'workbook.xlsx' ],
//   sections: [ 'data' ],
//   columns: [ 'my column', '@foo' ],
//   table: 'tableName',
// }
```

For A:A or A1:A style ranges, `null` will be used for any dimensions that the syntax does not specify:

##### Parameters

| Name           | Type      | Default | Description                                                                                                               |
| -------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| ref            | `string`  |         | A structured reference string                                                                                             |
| [options]      | `object`  | `{}`    | Options                                                                                                                   |
| [options].xlsx | `boolean` | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) |

##### Returns

`object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a id="stringifyA1Ref" href="#stringifyA1Ref">#</a> stringifyA1Ref( refObject, _[options = `{}`]_ ) ⇒ `object`

Get an A1-style string representation of a reference object.

```js
stringifyA1Ref({
  context: [ 'Sheet1' ],
  range: {
    top: 0,
    left: 0,
    bottom: 1,
    right: 1,
    $top: true,
    $left: false,
    $bottom: false,
    $right: true
  }
});
// => 'Sheet1!A$1:$B2'
```

##### Parameters

| Name           | Type      | Default | Description                                                                                                               |
| -------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| refObject      | `object`  |         | A reference object                                                                                                        |
| [options]      | `object`  | `{}`    | Options                                                                                                                   |
| [options].xlsx | `boolean` | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) |

##### Returns

`object` – The reference in A1-style string format

---

### <a id="stringifyR1C1Ref" href="#stringifyR1C1Ref">#</a> stringifyR1C1Ref( refObject, _[options = `{}`]_ ) ⇒ `object`

Get an R1C1-style string representation of a reference object.

```js
stringifyR1C1Ref({
  context: [ 'Sheet1' ],
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

##### Parameters

| Name           | Type      | Default | Description                                                                                                               |
| -------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| refObject      | `object`  |         | A reference object                                                                                                        |
| [options]      | `object`  | `{}`    | Options                                                                                                                   |
| [options].xlsx | `boolean` | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) |

##### Returns

`object` – The reference in R1C1-style string format

---

### <a id="stringifyStructRef" href="#stringifyStructRef">#</a> stringifyStructRef( refObject, _[options = `{}`]_ ) ⇒ `object`

Get a string representation of a structured reference object.

```js
stringifyStructRef({
  context: [ 'workbook.xlsx' ],
  sections: [ 'data' ],
  columns: [ 'my column', '@foo' ],
  table: 'tableName',
});
// => 'workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]'
```

##### Parameters

| Name           | Type      | Default | Description                                                                                                               |
| -------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| refObject      | `object`  |         | A structured reference object                                                                                             |
| [options]      | `object`  | `{}`    | Options                                                                                                                   |
| [options].xlsx | `boolean` | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) |

##### Returns

`object` – The structured reference in string format

---

### <a id="toA1" href="#toA1">#</a> toA1( range ) ⇒ `string`

Stringify a range object into A1 syntax.

**See also:** [parseA1Ref](#parseA1Ref).

##### Parameters

| Name  | Type     | Description    |
| ----- | -------- | -------------- |
| range | `object` | A range object |

##### Returns

`string` – An A1-style string represenation of a range

---

### <a id="toCol" href="#toCol">#</a> toCol( columnIndex ) ⇒ `string`

Convert a 0 based offset number to a column string representation (`2` = `"C"`).

The method expects a number between 0 and 16383. Other input will return garbage.

##### Parameters

| Name        | Type     | Description                    |
| ----------- | -------- | ------------------------------ |
| columnIndex | `number` | Zero based column index number |

##### Returns

`string` – The column string identifier

---

### <a id="toR1C1" href="#toR1C1">#</a> toR1C1( range ) ⇒ `string`

Stringify a range object into R1C1 syntax.

**See also:** [parseR1C1Ref](#parseR1C1Ref).

##### Parameters

| Name  | Type     | Description    |
| ----- | -------- | -------------- |
| range | `object` | A range object |

##### Returns

`string` – An R1C1-style string represenation of a range

---

### <a id="tokenize" href="#tokenize">#</a> tokenize( formula, _[options = `{}`]_ ) ⇒ `Array<object>`

Breaks a string formula into a list of tokens.

The returned output will be an array of objects representing the tokens:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: FUNCTION, value: 'SUM' },
  { type: OPERATOR, value: '(' },
  { type: REF_RANGE, value: 'A1:B2' },
  { type: OPERATOR, value: ')' }
]
```

Token types may be found as an Object as the [`tokenTypes` export](#tokenTypes) on the package (`import {tokenTypes} from '@borgar/fx';`).

To support syntax highlighting as you type, `STRING` tokens are allowed to be "unterminated". For example, the incomplete formula `="Hello world` would be tokenized as:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: STRING, value: '"Hello world', unterminated: true },
]
```

**See also:** [tokenTypes](#tokenTypes).

##### Parameters

| Name                      | Type      | Default | Description                                                                                                                                                                                       |
| ------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| formula                   | `string`  |         | An Excel formula string (an Excel expression) or an array of tokens.                                                                                                                              |
| [options]                 | `object`  | `{}`    | Options                                                                                                                                                                                           |
| [options].allowTernary    | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.                                               |
| [options].mergeRefs       | `boolean` | `true`  | Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens) |
| [options].negativeNumbers | `boolean` | `true`  | Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).                                                 |
| [options].r1c1            | `boolean` | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.                                                                                                         |
| [options].withLocation    | `boolean` | `true`  | Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`                                                                                                               |
| [options].xlsx            | `boolean` | `false` | Enables a `[1]Sheet1!A1` or `[1]!name` syntax form for external workbooks found only in XLSX files.                                                                                               |

##### Returns

`Array<object>` – An AST of nodes

---

### <a id="translateToA1" href="#translateToA1">#</a> translateToA1( formula, anchorCell, _[options = `{}`]_ ) ⇒ `string` | `Array<object>`

Translates ranges in a formula or list of tokens from relative R1C1 syntax to absolute A1 syntax.

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned.

```js
translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
// => "=SUM(E10,$E$2,Sheet!$E$3)");
```

If an input range is -1,-1 relative rows/columns and the anchor is A1, the resulting range will (by default) wrap around to the bottom of the sheet resulting in the range XFD1048576. This may not be what you want so may set `wrapEdges` to false which will instead turn the range into a `#REF!` error.

```js
translateToA1("=R[-1]C[-1]", "A1");
// => "=XFD1048576");

translateToA1("=R[-1]C[-1]", "A1", { wrapEdges: false });
// => "=#REF!");
```

Note that if you are passing in a list of tokens that was not created using `mergeRefs` and you disable edge wrapping (or you simply set both options to false), you can end up with a formula such as `=#REF!:B2` or `=Sheet3!#REF!:F3`. These are valid formulas in the Excel formula language and Excel will accept them, but they are not supported in Google Sheets.

##### Parameters

| Name                | Type                        | Default | Description                                                                                                                      |
| ------------------- | --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| formula             | `string` \| `Array<object>` |         | A string (an Excel formula) or a token list that should be adjusted.                                                             |
| anchorCell          | `string`                    |         | A simple string reference to an A1 cell ID (`AF123` or`$C$5`).                                                                   |
| [options]           | `object`                    | `{}`    | The options                                                                                                                      |
| [options].mergeRefs | `boolean`                   | `true`  | Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). |
| [options].wrapEdges | `boolean`                   | `true`  | Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors                                            |
| [options].xlsx      | `boolean`                   | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)        |

##### Returns

`string` | `Array<object>` – A formula string or token list (depending on which was input)

---

### <a id="translateToR1C1" href="#translateToR1C1">#</a> translateToR1C1( formula, anchorCell, _[options = `{}`]_ ) ⇒ `string` | `Array<object>`

Translates ranges in a formula or list of tokens from absolute A1 syntax to relative R1C1 syntax.

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned.

```js
translateToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
// => "=SUM(RC[1],R2C5,Sheet!R3C5)");
```

##### Parameters

| Name           | Type                        | Default | Description                                                                                                               |
| -------------- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| formula        | `string` \| `Array<object>` |         | A string (an Excel formula) or a token list that should be adjusted.                                                      |
| anchorCell     | `string`                    |         | A simple string reference to an A1 cell ID (`AF123` or`$C$5`).                                                            |
| [options]      | `object`                    | `{}`    | The options                                                                                                               |
| [options].xlsx | `boolean`                   | `false` | Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) |

##### Returns

`string` | `Array<object>` – A formula string or token list (depending on which was input)

---

## Constants

### <a id="nodeTypes" href="#nodeTypes">#</a> nodeTypes = `Readonly<Record<string, string>>`

A dictionary of the types used to identify AST node variants.

**See also:** [parse](#parse).

##### Properties

| Name       | Type     | Description                                                      |
| ---------- | -------- | ---------------------------------------------------------------- |
| ARRAY      | `string` | An array expression (`{1,2;3,4}`)                                |
| BINARY     | `string` | A binary operation (`10+10`)                                     |
| CALL       | `string` | A function call expression (`SUM(1,2)`)                          |
| ERROR      | `string` | An error literal (`#VALUE!`)                                     |
| IDENTIFIER | `string` | A function name identifier (`SUM`)                               |
| LITERAL    | `string` | A literal (number, string, or boolean) (`123`, `"foo"`, `false`) |
| REFERENCE  | `string` | A range identifier (`A1`)                                        |
| UNARY      | `string` | A unary operation (`10%`)                                        |

---

### <a id="tokenTypes" href="#tokenTypes">#</a> tokenTypes = `Readonly<Record<string, string>>`

A dictionary of the types used to identify token variants.

**See also:** [tokenize](#tokenize).

##### Properties

| Name          | Type     | Description                                                      |
| ------------- | -------- | ---------------------------------------------------------------- |
| BOOLEAN       | `string` | Boolean literal (`TRUE`)                                         |
| CONTEXT       | `string` | Reference context ([Workbook.xlsx]Sheet1)                        |
| CONTEXT_QUOTE | `string` | Quoted reference context (`'[My workbook.xlsx]Sheet1'`)          |
| ERROR         | `string` | Error literal (`#VALUE!`)                                        |
| FUNCTION      | `string` | Function name (`SUM`)                                            |
| FX_PREFIX     | `string` | A leading equals sign at the start of a formula (`=`)            |
| NEWLINE       | `string` | Newline character (`\n`)                                         |
| NUMBER        | `string` | Number literal (`123.4`, `-1.5e+2`)                              |
| OPERATOR      | `string` | Newline (`\n`)                                                   |
| REF_BEAM      | `string` | A range "beam" identifier (`A:A` or `1:1`)                       |
| REF_NAMED     | `string` | A name / named range identifier (`income`)                       |
| REF_RANGE     | `string` | A range identifier (`A1`)                                        |
| REF_STRUCT    | `string` | A structured reference identifier (`table[[Column1]:[Column2]]`) |
| REF_TERNARY   | `string` | A ternary range identifier (`B2:B`)                              |
| STRING        | `string` | String literal (`"Lorem ipsum"`)                                 |
| UNKNOWN       | `string` | Any unidentifiable range of characters.                          |
| WHITESPACE    | `string` | Whitespace character sequence (` `)                              |

---


