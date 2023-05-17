# @borgar/fx API

## Constants

### <a name="nodeTypes" href="#nodeTypes">#</a> nodeTypes ⇒ `Object.<string>`

A dictionary of the types used to identify AST node variants.

**See also:** [parse](#parse).

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| UNARY | `string` | A unary operation (`10%`) |
| BINARY | `string` | A binary operation (`10+10`) |
| REFERENCE | `string` | A range identifier (`A1`) |
| LITERAL | `string` | A literal (number, string, or boolean) (`123`, `"foo"`, `false`) |
| ERROR | `string` | An error literal (`#VALUE!`) |
| CALL | `string` | A function call expression (`SUM(1,2)`) |
| ARRAY | `string` | An array expression (`{1,2;3,4}`) |
| IDENTIFIER | `string` | A function name identifier (`SUM`) |

---

### <a name="tokenTypes" href="#tokenTypes">#</a> tokenTypes ⇒ `Object.<string>`

A dictionary of the types used to identify token variants.

**See also:** [tokenize](#tokenize).

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| OPERATOR | `string` | Newline (`\n`) |
| BOOLEAN | `string` | Boolean literal (`TRUE`) |
| ERROR | `string` | Error literal (`#VALUE!`) |
| NUMBER | `string` | Number literal (`123.4`, `-1.5e+2`) |
| FUNCTION | `string` | Function name (`SUM`) |
| NEWLINE | `string` | Newline character (`\n`) |
| WHITESPACE | `string` | Whitespace character sequence (` `) |
| STRING | `string` | String literal (`"Lorem ipsum"`) |
| CONTEXT | `string` | Reference context ([Workbook.xlsx]Sheet1) |
| CONTEXT_QUOTE | `string` | Quoted reference context (`'[My workbook.xlsx]Sheet1'`) |
| REF_RANGE | `string` | A range identifier (`A1`) |
| REF_BEAM | `string` | A range "beam" identifier (`A:A` or `1:1`) |
| REF_TERNARY | `string` | A ternary range identifier (`B2:B`) |
| REF_NAMED | `string` | A name / named range identifier (`income`) |
| REF_STRUCT | `string` | A structured reference identifier (`table[[Column1]:[Column2]]`) |
| FX_PREFIX | `string` | A leading equals sign at the start of a formula (`=`) |
| UNKNOWN | `string` | Any unidentifiable range of characters. |

## Functions

### <a name="addA1RangeBounds" href="#addA1RangeBounds">#</a> addA1RangeBounds( range ) ⇒ `Object`

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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| range | `Object` | The range part of a reference object. |

#### Returns

`Object` – same range with missing bounds filled in.

---

### <a name="addTokenMeta" href="#addTokenMeta">#</a> addTokenMeta( tokenlist, _[context = `{}`]_ ) ⇒ `Array.<Object>`

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

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| tokenlist | `Array.<Object>` |  | An array of tokens (from `tokenize()`) |
| _[context]_ | `Object` | `{}` | A contest used to match `A1` to `Sheet1!A1`. |
| _[context]_.sheetName | `string` | `""` | An implied sheet name ('Sheet1') |
| _[context]_.workbookName | `string` | `""` | An implied workbook name ('report.xlsx') |

#### Returns

`Array.<Object>` – The input array with the enchanced tokens

---

### <a name="fixRanges" href="#fixRanges">#</a> fixRanges( formula, _[options = `{}`]_ ) ⇒ `string` | `Array.<Object>`

Normalizes A1 style ranges in a formula or list of tokens so that the top and left coordinates of the range are on the left-hand side of a colon operator:

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

Returns the same formula with the ranges updated. If an array of tokens was supplied, then a new array is returned.

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| formula | `string` \| `Array.<Object>` |  | A string (an Excel formula) or a token list that should be adjusted. |
| _[options]_ | `Object` | `{}` | Options |
| _[options]_.addBounds | `boolean` | `false` | Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383. |
| _[options]_.r1c1 | `boolean` | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style. |

#### Returns

`string` | `Array.<Object>` – A formula string or token list (depending on which was input)

---

### <a name="fromCol" href="#fromCol">#</a> fromCol( columnString ) ⇒ `number`

Convert a column string representation to a 0 based offset number (`"C"` = `2`).

The method expects a valid column identifier made up of _only_ A-Z letters, which may be either upper or lower case. Other input will return garbage.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| columnString | `string` | The column string identifier |

#### Returns

`number` – Zero based column index number

---

### <a name="isError" href="#isError">#</a> isError( token ) ⇒ `boolean`

Determines whether the specified token is an error.

Returns `true` if the input is a token of type ERROR (`#VALUE!`). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is error, False otherwise.

---

### <a name="isFunction" href="#isFunction">#</a> isFunction( token ) ⇒ `boolean`

Determines whether the specified token is a function.

Returns `true` if the input is a token of type FUNCTION. In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is function, False otherwise.

---

### <a name="isFxPrefix" href="#isFxPrefix">#</a> isFxPrefix( token ) ⇒ `boolean`

Returns `true` if the input is a token of type FX_PREFIX (leading `=` in formula). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is effects prefix, False otherwise.

---

### <a name="isLiteral" href="#isLiteral">#</a> isLiteral( token ) ⇒ `boolean`

Determines whether the specified token is a literal.

Returns `true` if the input is a token of type BOOLEAN (`TRUE` or `FALSE`), ERROR (`#VALUE!`), NUMBER (123.4), or STRING (`"lorem ipsum"`). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is literal, False otherwise.

---

### <a name="isOperator" href="#isOperator">#</a> isOperator( token ) ⇒ `boolean`

Determines whether the specified token is an operator.

Returns `true` if the input is a token of type OPERATOR (`+` or `:`). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is operator, False otherwise.

---

### <a name="isRange" href="#isRange">#</a> isRange( token ) ⇒ `boolean`

Determines whether the specified token is a range.

Returns `true` if the input is a token that has a type of either REF_RANGE (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or REF_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | A token |

#### Returns

`boolean` – True if the specified token is range, False otherwise.

---

### <a name="isReference" href="#isReference">#</a> isReference( token ) ⇒ `boolean`

Determines whether the specified token is a reference.

Returns `true` if the input is a token of type REF_RANGE (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), REF_BEAM (`A:A` or `1:1`), or REF_NAMED (`myrange`). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is reference, False otherwise.

---

### <a name="isWhitespace" href="#isWhitespace">#</a> isWhitespace( token ) ⇒ `boolean`

Determines whether the specified token is whitespace.

Returns `true` if the input is a token of type WHITESPACE (` `) or NEWLINE (`\n`). In all other cases `false` is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | `Object` | The token |

#### Returns

`boolean` – True if the specified token is whitespace, False otherwise.

---

### <a name="mergeRefTokens" href="#mergeRefTokens">#</a> mergeRefTokens( tokenlist ) ⇒ `Array`

Merges context with reference tokens as possible in a list of tokens.

When given a tokenlist, this function returns a new list with ranges returned as whole references (`Sheet1!A1:B2`) rather than separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenlist | `Array.<Object>` | An array of tokens (from `tokenize()`) |

#### Returns

`Array` – A new list of tokens with range parts merged.

---

### <a name="parse" href="#parse">#</a> parse( formula, _[options = `{}`]_ ) ⇒ `Object`

Parses a string formula or list of tokens into an AST.

The parser requires `mergeRefs` to have been `true` in tokenlist options, because it does not recognize reference context tokens.

The AST Abstract Syntax Tree's format is documented in [AST_format.md][./AST_format.md]

**See also:** [nodeTypes](#nodeTypes).

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| formula | `string` \| `Array.<Object>` |  | An Excel formula string (an Excel expression) or an array of tokens. |
| _[options]_ | `Object` | `{}` | Options |
| _[options]_.allowNamed | `boolean` | `true` | Enable parsing names as well as ranges. |
| _[options]_.allowTernary | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |
| _[options]_.negativeNumbers | `boolean` | `true` | Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree). |
| _[options]_.permitArrayRanges | `boolean` | `false` | Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it. |
| _[options]_.permitArrayCalls | `boolean` | `false` | Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it. |
| _[options]_.r1c1 | `boolean` | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style. |
| _[options]_.withLocation | `boolean` | `true` | Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }` |

#### Returns

`Object` – An AST of nodes

---

### <a name="parseA1Ref" href="#parseA1Ref">#</a> parseA1Ref( refString, _[options = `{}`]_ ) ⇒ `Object` | `null`

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

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| refString | `string` |  | An A1-style reference string |
| _[options]_ | `Object` | `{}` | Options |
| _[options]_.allowNamed | `boolean` | `true` | Enable parsing names as well as ranges. |
| _[options]_.allowTernary | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |

#### Returns

`Object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a name="parseR1C1Ref" href="#parseR1C1Ref">#</a> parseR1C1Ref( refString, _[options = `{}`]_ ) ⇒ `Object` | `null`

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

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| refString | `string` |  | An R1C1-style reference string |
| _[options]_ | `Object` | `{}` | Options |
| _[options]_.allowNamed | `boolean` | `true` | Enable parsing names as well as ranges. |
| _[options]_.allowTernary | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |

#### Returns

`Object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a name="parseStructRef" href="#parseStructRef">#</a> parseStructRef( ref, _[options = `{}`]_ ) ⇒ `Object` | `null`

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

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| ref | `string` |  | A structured reference string |
| _[options]_ | `Object` | `{}` | Options |

#### Returns

`Object` | `null` – An object representing a valid reference or null if it is invalid.

---

### <a name="stringifyA1Ref" href="#stringifyA1Ref">#</a> stringifyA1Ref( refObject ) ⇒ `Object`

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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| refObject | `Object` | A reference object |

#### Returns

`Object` – The reference in A1-style string format

---

### <a name="stringifyR1C1Ref" href="#stringifyR1C1Ref">#</a> stringifyR1C1Ref( refObject ) ⇒ `Object`

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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| refObject | `Object` | A reference object |

#### Returns

`Object` – The reference in R1C1-style string format

---

### <a name="stringifyStructRef" href="#stringifyStructRef">#</a> stringifyStructRef( refObject ) ⇒ `Object`

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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| refObject | `Object` | A structured reference object |

#### Returns

`Object` – The structured reference in string format

---

### <a name="toCol" href="#toCol">#</a> toCol( columnIndex ) ⇒ `string`

Convert a 0 based offset number to a column string representation (`2` = `"C"`).

The method expects a number between 0 and 16383. Other input will return garbage.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| columnIndex | `number` | Zero based column index number |

#### Returns

`string` – The column string identifier

---

### <a name="tokenize" href="#tokenize">#</a> tokenize( formula, _[options = `{}`]_ ) ⇒ `Array.<Object>`

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

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| formula | `string` |  | An Excel formula string (an Excel expression) or an array of tokens. |
| _[options]_ | `Object` | `{}` | Options |
| _[options]_.allowTernary | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |
| _[options]_.negativeNumbers | `boolean` | `true` | Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree). |
| _[options]_.r1c1 | `boolean` | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style. |
| _[options]_.withLocation | `boolean` | `true` | Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }` |
| _[options]_.mergeRefs | `boolean` | `true` | Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens) |

#### Returns

`Array.<Object>` – An AST of nodes

---

### <a name="translateToA1" href="#translateToA1">#</a> translateToA1( formula, anchorCell, _[options = `{}`]_ ) ⇒ `string` | `Array.<Object>`

Translates ranges in a formula or list of tokens from relative R1C1 syntax to absolute A1 syntax.

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned (be careful that `mergeRefs` *must* be `false`).

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

#### Parameters

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| formula | `string` \| `Array.<Object>` |  | A string (an Excel formula) or a token list that should be adjusted. |
| anchorCell | `string` |  | A simple string reference to an A1 cell ID (`AF123` or`$C$5`). |
| _[options]_ | `Object` | `{}` | The options |
| _[options]_.wrapEdges | `boolean` | `true` | Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors |
| _[options]_.mergeRefs | `boolean` | `true` | Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). |

#### Returns

`string` | `Array.<Object>` – A formula string or token list (depending on which was input)

---

### <a name="translateToR1C1" href="#translateToR1C1">#</a> translateToR1C1( formula, anchorCell ) ⇒ `string` | `Array.<Object>`

Translates ranges in a formula or list of tokens from absolute A1 syntax to relative R1C1 syntax.

Returns the same formula with the ranges translated. If an array of tokens was supplied, then the same array is returned (be careful that `mergeRefs` *must* be `false`).

```js
translateToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
// => "=SUM(RC[1],R2C5,Sheet!R3C5)");
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| formula | `string` \| `Array.<Object>` | A string (an Excel formula) or a token list that should be adjusted. |
| anchorCell | `string` | A simple string reference to an A1 cell ID (`AF123` or`$C$5`). |

#### Returns

`string` | `Array.<Object>` – A formula string or token list (depending on which was input)

