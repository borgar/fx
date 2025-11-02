
<a name="readmemd"></a>

# @borgar/fx

## Modules

- [fx](#fxreadmemd)
- [fx/xlsx](#fxxlsxreadmemd)


<a name="fxreadmemd"></a>

# fx

A tokenizer, parser, and other utilities to work with Excel formula code.

The base entry-point methods expect and return the variant of references that uses contexts.
If you are using xlsx files or otherwise want to work with the xlsx-file variant of references
you should use the [fx/xlsx](#fxxlsxreadmemd) variant methods.

See [Prefixes.md](./Prefixes.md) for documentation on how scopes work in Fx.

## Type Aliases

- [ArrayExpression](#fxtype-aliasesarrayexpressionmd)
- [AstExpression](#fxtype-aliasesastexpressionmd)
- [BinaryExpression](#fxtype-aliasesbinaryexpressionmd)
- [BinaryOperator](#fxtype-aliasesbinaryoperatormd)
- [CallExpression](#fxtype-aliasescallexpressionmd)
- [ErrorLiteral](#fxtype-aliaseserrorliteralmd)
- [Identifier](#fxtype-aliasesidentifiermd)
- [LambdaExpression](#fxtype-aliaseslambdaexpressionmd)
- [LetDeclarator](#fxtype-aliasesletdeclaratormd)
- [LetExpression](#fxtype-aliasesletexpressionmd)
- [Literal](#fxtype-aliasesliteralmd)
- [Node](#fxtype-aliasesnodemd)
- [OptsFixRanges](#fxtype-aliasesoptsfixrangesmd)
- [OptsParse](#fxtype-aliasesoptsparsemd)
- [OptsParseA1Ref](#fxtype-aliasesoptsparsea1refmd)
- [OptsParseR1C1Ref](#fxtype-aliasesoptsparser1c1refmd)
- [OptsStringifyStructRef](#fxtype-aliasesoptsstringifystructrefmd)
- [OptsTokenize](#fxtype-aliasesoptstokenizemd)
- [OptsTranslateFormulaToA1](#fxtype-aliasesoptstranslateformulatoa1md)
- [OptsTranslateTokensToA1](#fxtype-aliasesoptstranslatetokenstoa1md)
- [OptsTranslateToR1C1](#fxtype-aliasesoptstranslatetor1c1md)
- [RangeA1](#fxtype-aliasesrangea1md)
- [RangeR1C1](#fxtype-aliasesranger1c1md)
- [ReferenceA1](#fxtype-aliasesreferencea1md)
- [ReferenceA1Xlsx](#fxtype-aliasesreferencea1xlsxmd)
- [ReferenceIdentifier](#fxtype-aliasesreferenceidentifiermd)
- [ReferenceName](#fxtype-aliasesreferencenamemd)
- [ReferenceNameXlsx](#fxtype-aliasesreferencenamexlsxmd)
- [ReferenceR1C1](#fxtype-aliasesreferencer1c1md)
- [ReferenceR1C1Xlsx](#fxtype-aliasesreferencer1c1xlsxmd)
- [ReferenceStruct](#fxtype-aliasesreferencestructmd)
- [ReferenceStructXlsx](#fxtype-aliasesreferencestructxlsxmd)
- [SourceLocation](#fxtype-aliasessourcelocationmd)
- [Token](#fxtype-aliasestokenmd)
- [TokenEnhanced](#fxtype-aliasestokenenhancedmd)
- [UnaryExpression](#fxtype-aliasesunaryexpressionmd)
- [UnaryOperator](#fxtype-aliasesunaryoperatormd)

## Variables

- [MAX\_COLS](#fxvariablesmax_colsmd)
- [MAX\_ROWS](#fxvariablesmax_rowsmd)
- [nodeTypes](#fxvariablesnodetypesmd)
- [tokenTypes](#fxvariablestokentypesmd)

## Functions

- [addA1RangeBounds](#fxfunctionsadda1rangeboundsmd)
- [fixFormulaRanges](#fxfunctionsfixformularangesmd)
- [fixTokenRanges](#fxfunctionsfixtokenrangesmd)
- [fromCol](#fxfunctionsfromcolmd)
- [isArrayNode](#fxfunctionsisarraynodemd)
- [isBinaryNode](#fxfunctionsisbinarynodemd)
- [isCallNode](#fxfunctionsiscallnodemd)
- [isError](#fxfunctionsiserrormd)
- [isErrorNode](#fxfunctionsiserrornodemd)
- [isExpressionNode](#fxfunctionsisexpressionnodemd)
- [isFunction](#fxfunctionsisfunctionmd)
- [isFxPrefix](#fxfunctionsisfxprefixmd)
- [isIdentifierNode](#fxfunctionsisidentifiernodemd)
- [isLambdaNode](#fxfunctionsislambdanodemd)
- [isLetDeclaratorNode](#fxfunctionsisletdeclaratornodemd)
- [isLetNode](#fxfunctionsisletnodemd)
- [isLiteral](#fxfunctionsisliteralmd)
- [isLiteralNode](#fxfunctionsisliteralnodemd)
- [isOperator](#fxfunctionsisoperatormd)
- [isRange](#fxfunctionsisrangemd)
- [isReference](#fxfunctionsisreferencemd)
- [isReferenceNode](#fxfunctionsisreferencenodemd)
- [isUnaryNode](#fxfunctionsisunarynodemd)
- [isWhitespace](#fxfunctionsiswhitespacemd)
- [mergeRefTokens](#fxfunctionsmergereftokensmd)
- [parse](#fxfunctionsparsemd)
- [parseA1Range](#fxfunctionsparsea1rangemd)
- [parseA1Ref](#fxfunctionsparsea1refmd)
- [parseR1C1Range](#fxfunctionsparser1c1rangemd)
- [parseR1C1Ref](#fxfunctionsparser1c1refmd)
- [parseStructRef](#fxfunctionsparsestructrefmd)
- [stringifyA1Ref](#fxfunctionsstringifya1refmd)
- [stringifyR1C1Ref](#fxfunctionsstringifyr1c1refmd)
- [stringifyStructRef](#fxfunctionsstringifystructrefmd)
- [stringifyTokens](#fxfunctionsstringifytokensmd)
- [toCol](#fxfunctionstocolmd)
- [tokenize](#fxfunctionstokenizemd)
- [translateFormulaToA1](#fxfunctionstranslateformulatoa1md)
- [translateFormulaToR1C1](#fxfunctionstranslateformulator1c1md)
- [translateTokensToA1](#fxfunctionstranslatetokenstoa1md)
- [translateTokensToR1C1](#fxfunctionstranslatetokenstor1c1md)


<a name="fxfunctionsadda1rangeboundsmd"></a>

# addA1RangeBounds()

```ts
function addA1RangeBounds(range: RangeA1): RangeA1;
```

Fill the any missing bounds in range objects. Top will be set to 0, bottom to
1048575, left to 0, and right to 16383, if they are `null` or `undefined`.

```js
addA1RangeBounds({
  top: 0,
  left: 0,
  bottom: 1,
  $top: true,
  $left: false,
  $bottom: false,
});
// => {
//   top: 0,
//   left: 0,
//   bottom: 1,
//   right: 16383,  // ← Added
//   $top: true,
//   $left: false,
//   $bottom: false,
//   $right: false  // ← Added
// }
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `range` | [`RangeA1`](#fxtype-aliasesrangea1md) | The range part of a reference object. |

## Returns

[`RangeA1`](#fxtype-aliasesrangea1md)

The same range with missing bounds filled in.


<a name="fxfunctionsfixformularangesmd"></a>

# fixFormulaRanges()

```ts
function fixFormulaRanges(formula: string, options?: OptsFixRanges & OptsTokenize): string;
```

Normalizes A1 style ranges and structured references in a formula.

Internally it uses [fixTokenRanges](#fxfunctionsfixtokenrangesmd) so see it's documentation for details.

Returns the same formula with the ranges updated. If an array of tokens was
supplied, then a new array is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formula` | `string` | A string (an Excel formula) or a token list that should be adjusted. |
| `options?` | [`OptsFixRanges`](#fxtype-aliasesoptsfixrangesmd) & [`OptsTokenize`](#fxtype-aliasesoptstokenizemd) | Options |

## Returns

`string`

A formula string with ranges adjusted

## See

[OptsFixRanges](#fxtype-aliasesoptsfixrangesmd) & [OptsTokenize](#fxtype-aliasesoptstokenizemd)


<a name="fxfunctionsfixtokenrangesmd"></a>

# fixTokenRanges()

```ts
function fixTokenRanges(tokens: Token[], options?: OptsFixRanges): Token[];
```

Normalizes A1 style ranges and structured references in a list of tokens.

It ensures that that the top and left coordinates of an A1 range are on the
left-hand side of a colon operator:

```
B2:A1 → A1:B2
1:A1 → A1:1
A:A1 → A1:A
B:A → A:B
2:1 → 1:2
A1:A1 → A1
```

When `{ addBounds }` option is set to true, the missing bounds are also added.
This can be done to ensure Excel compatible ranges. The fixes then additionally include:

```
1:A1 → A1:1 → 1:1
A:A1 → A1:A → A:A
A1:A → A:A
A1:1 → A:1
B2:B → B2:1048576
B2:2 → B2:XFD2
```

Structured ranges are normalized to have consistent order and capitalization
of sections as well as removing redundant ones.

Returns a new array of tokens with values and position data updated.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | [`Token`](#fxtype-aliasestokenmd)[] | A list of tokens to be adjusted. |
| `options?` | [`OptsFixRanges`](#fxtype-aliasesoptsfixrangesmd) | Options. |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

A token list with ranges adjusted.

## See

[OptsFixRanges](#fxtype-aliasesoptsfixrangesmd)


<a name="fxfunctionsfromcolmd"></a>

# fromCol()

```ts
function fromCol(columnString: string): number;
```

Convert a column string representation to a 0 based
offset number (`"C"` = `2`).

The method expects a valid column identifier made up of _only_
A-Z letters, which may be either upper or lower case. Other input will
return garbage.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `columnString` | `string` | The column string identifier |

## Returns

`number`

Zero based column index number


<a name="fxfunctionsisarraynodemd"></a>

# isArrayNode()

```ts
function isArrayNode(node?: Node): node is ArrayExpression;
```

Determines whether the specified node is a ArrayExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is ArrayExpression`

True if the specified token is a ArrayExpression, False otherwise.


<a name="fxfunctionsisbinarynodemd"></a>

# isBinaryNode()

```ts
function isBinaryNode(node?: Node): node is BinaryExpression;
```

Determines whether the specified node is a BinaryExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is BinaryExpression`

True if the specified token is a BinaryExpression, False otherwise.


<a name="fxfunctionsiscallnodemd"></a>

# isCallNode()

```ts
function isCallNode(node?: Node): node is CallExpression;
```

Determines whether the specified node is a CallExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is CallExpression`

True if the specified token is a CallExpression, False otherwise.


<a name="fxfunctionsiserrormd"></a>

# isError()

```ts
function isError(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is an error.

Returns `true` if the input is a token of type ERROR (`#VALUE!`). In all
other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is error, False otherwise.


<a name="fxfunctionsiserrornodemd"></a>

# isErrorNode()

```ts
function isErrorNode(node?: Node): node is ErrorLiteral;
```

Determines whether the specified node is an ErrorLiteral.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is ErrorLiteral`

True if the specified token is an ErrorLiteral, False otherwise.


<a name="fxfunctionsisexpressionnodemd"></a>

# isExpressionNode()

```ts
function isExpressionNode(node?: Node): node is AstExpression;
```

Determines whether the specified node is a AstExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is AstExpression`

True if the specified token is a AstExpression, False otherwise.


<a name="fxfunctionsisfunctionmd"></a>

# isFunction()

```ts
function isFunction(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is a function.

Returns `true` if the input is a token of type FUNCTION.
In all other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is function, False otherwise.


<a name="fxfunctionsisfxprefixmd"></a>

# isFxPrefix()

```ts
function isFxPrefix(token?: Pick<Token, "type">): boolean;
```

Returns `true` if the input is a token of type FX_PREFIX (leading `=` in
formula). In all other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is effects prefix, False otherwise.


<a name="fxfunctionsisidentifiernodemd"></a>

# isIdentifierNode()

```ts
function isIdentifierNode(node?: Node): node is Identifier;
```

Determines whether the specified node is an Identifier.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is Identifier`

True if the specified token is an Identifier, False otherwise.


<a name="fxfunctionsislambdanodemd"></a>

# isLambdaNode()

```ts
function isLambdaNode(node?: Node): node is LambdaExpression;
```

Determines whether the specified node is a LambdaExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is LambdaExpression`

True if the specified token is a LambdaExpression, False otherwise.


<a name="fxfunctionsisletdeclaratornodemd"></a>

# isLetDeclaratorNode()

```ts
function isLetDeclaratorNode(node?: Node): node is LetDeclarator;
```

Determines whether the specified node is a LetDeclarator.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is LetDeclarator`

True if the specified token is a LetDeclarator, False otherwise.


<a name="fxfunctionsisletnodemd"></a>

# isLetNode()

```ts
function isLetNode(node?: Node): node is LetExpression;
```

Determines whether the specified node is a LetExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is LetExpression`

True if the specified token is a LetExpression, False otherwise.


<a name="fxfunctionsisliteralmd"></a>

# isLiteral()

```ts
function isLiteral(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is a literal.

Returns `true` if the input is a token of type BOOLEAN (`TRUE` or `FALSE`),
ERROR (`#VALUE!`), NUMBER (123.4), or STRING (`"lorem ipsum"`). In all other
cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is literal, False otherwise.


<a name="fxfunctionsisliteralnodemd"></a>

# isLiteralNode()

```ts
function isLiteralNode(node?: Node): node is Literal;
```

Determines whether the specified node is a Literal.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is Literal`

True if the specified token is a Literal, False otherwise.


<a name="fxfunctionsisoperatormd"></a>

# isOperator()

```ts
function isOperator(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is an operator.

Returns `true` if the input is a token of type OPERATOR (`+` or `:`). In all
other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is operator, False otherwise.


<a name="fxfunctionsisrangemd"></a>

# isRange()

```ts
function isRange(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is a range.

Returns `true` if the input is a token that has a type of either REF_RANGE
(`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or
REF_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | A token |

## Returns

`boolean`

True if the specified token is range, False otherwise.


<a name="fxfunctionsisreferencemd"></a>

# isReference()

```ts
function isReference(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is a reference.

Returns `true` if the input is a token of type REF_RANGE (`A1` or `A1:B2`),
REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), REF_BEAM (`A:A` or `1:1`),
or REF_NAMED (`myrange`). In all other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is reference, False otherwise.


<a name="fxfunctionsisreferencenodemd"></a>

# isReferenceNode()

```ts
function isReferenceNode(node?: Node): node is ReferenceIdentifier;
```

Determines whether the specified node is a ReferenceIdentifier.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is ReferenceIdentifier`

True if the specified token is a ReferenceIdentifier, False otherwise.


<a name="fxfunctionsisunarynodemd"></a>

# isUnaryNode()

```ts
function isUnaryNode(node?: Node): node is UnaryExpression;
```

Determines whether the specified node is a UnaryExpression.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node?` | [`Node`](#fxtype-aliasesnodemd) | An AST node. |

## Returns

`node is UnaryExpression`

True if the specified token is a UnaryExpression, False otherwise.


<a name="fxfunctionsiswhitespacemd"></a>

# isWhitespace()

```ts
function isWhitespace(token?: Pick<Token, "type">): boolean;
```

Determines whether the specified token is whitespace.

Returns `true` if the input is a token of type WHITESPACE (` `) or
NEWLINE (`\n`). In all other cases `false` is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token?` | `Pick`\<[`Token`](#fxtype-aliasestokenmd), `"type"`\> | The token |

## Returns

`boolean`

True if the specified token is whitespace, False otherwise.


<a name="fxfunctionsmergereftokensmd"></a>

# mergeRefTokens()

```ts
function mergeRefTokens(tokenlist: Token[]): Token[];
```

Merges context with reference tokens as possible in a list of tokens.

When given a tokenlist, this function returns a new list with ranges returned
as whole references (`Sheet1!A1:B2`) rather than separate tokens for each
part: (`Sheet1`,`!`,`A1`,`:`,`B2`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenlist` | [`Token`](#fxtype-aliasestokenmd)[] | An array of tokens. |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

A new list of tokens with range parts merged.


<a name="fxfunctionsparsemd"></a>

# parse()

```ts
function parse(tokenlist: Token[], options: OptsParse): AstExpression;
```

Parses a string formula or list of tokens into an AST.

The parser assumes `mergeRefs` and `negativeNumbers` were `true` when the tokens were generated.
It does not yet recognize reference context tokens or know how to deal with unary minuses in
arrays.

The AST Abstract Syntax Tree's format is documented in
[AST_format.md](./AST_format.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenlist` | [`Token`](#fxtype-aliasestokenmd)[] | An array of tokens. |
| `options` | [`OptsParse`](#fxtype-aliasesoptsparsemd) | Options for the parsers behavior. |

## Returns

[`AstExpression`](#fxtype-aliasesastexpressionmd)

An AST of nodes.

## See

 - [OptsParse](#fxtype-aliasesoptsparsemd)
 - [nodeTypes](#fxvariablesnodetypesmd)
 - [tokenize](#fxfunctionstokenizemd)


<a name="fxfunctionsparsea1rangemd"></a>

# parseA1Range()

```ts
function parseA1Range(rangeString: string, allowTernary?: boolean): RangeA1;
```

Parse A1-style range string into a RangeA1 object.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `rangeString` | `string` | `undefined` | A1-style range string. |
| `allowTernary?` | `boolean` | `true` | Permit ternary ranges like A2:A or B2:2. |

## Returns

[`RangeA1`](#fxtype-aliasesrangea1md)

A reference object.


<a name="fxfunctionsparsea1refmd"></a>

# parseA1Ref()

```ts
function parseA1Ref(refString: string, options: OptsParseA1Ref): 
  | ReferenceA1
  | ReferenceName;
```

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

For A:A or A1:A style ranges, `null` will be used for any dimensions that the
syntax does not specify.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refString` | `string` | An A1-style reference string. |
| `options` | [`OptsParseA1Ref`](#fxtype-aliasesoptsparsea1refmd) | Options. |

## Returns

  \| [`ReferenceA1`](#fxtype-aliasesreferencea1md)
  \| [`ReferenceName`](#fxtype-aliasesreferencenamemd)

An object representing a valid reference or `undefined` if it is invalid.

## See

[OptsParseA1Ref](#fxtype-aliasesoptsparsea1refmd)


<a name="fxfunctionsparser1c1rangemd"></a>

# parseR1C1Range()

```ts
function parseR1C1Range(rangeString: string): RangeR1C1;
```

Parse R1C1-style range string into a RangeR1C1 object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rangeString` | `string` | R1C1-style range string. |

## Returns

[`RangeR1C1`](#fxtype-aliasesranger1c1md)

A reference object.


<a name="fxfunctionsparser1c1refmd"></a>

# parseR1C1Ref()

```ts
function parseR1C1Ref(refString: string, options?: OptsParseR1C1Ref): 
  | ReferenceName
  | ReferenceR1C1;
```

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

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refString` | `string` | An R1C1-style reference string. |
| `options?` | [`OptsParseR1C1Ref`](#fxtype-aliasesoptsparser1c1refmd) | Options. |

## Returns

  \| [`ReferenceName`](#fxtype-aliasesreferencenamemd)
  \| [`ReferenceR1C1`](#fxtype-aliasesreferencer1c1md)

An object representing a valid reference or `undefined` if it is invalid.

## See

[OptsParseR1C1Ref](#fxtype-aliasesoptsparser1c1refmd)


<a name="fxfunctionsparsestructrefmd"></a>

# parseStructRef()

```ts
function parseStructRef(ref: string): ReferenceStruct;
```

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

For A:A or A1:A style ranges, `null` will be used for any dimensions that the
syntax does not specify:

See [References.md](./References.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ref` | `string` | A structured reference string |

## Returns

[`ReferenceStruct`](#fxtype-aliasesreferencestructmd)

An object representing a valid reference or `undefined` if it is invalid.


<a name="fxfunctionsstringifya1refmd"></a>

# stringifyA1Ref()

```ts
function stringifyA1Ref(refObject: 
  | ReferenceA1
  | ReferenceName): string;
```

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

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refObject` | \| [`ReferenceA1`](#fxtype-aliasesreferencea1md) \| [`ReferenceName`](#fxtype-aliasesreferencenamemd) | A reference object. |

## Returns

`string`

The reference in A1-style string format.


<a name="fxfunctionsstringifyr1c1refmd"></a>

# stringifyR1C1Ref()

```ts
function stringifyR1C1Ref(refObject: 
  | ReferenceName
  | ReferenceR1C1): string;
```

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

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refObject` | \| [`ReferenceName`](#fxtype-aliasesreferencenamemd) \| [`ReferenceR1C1`](#fxtype-aliasesreferencer1c1md) | A reference object. |

## Returns

`string`

The reference in R1C1-style string format.


<a name="fxfunctionsstringifystructrefmd"></a>

# stringifyStructRef()

```ts
function stringifyStructRef(refObject: ReferenceStruct, options?: OptsStringifyStructRef): string;
```

Returns a string representation of a structured reference object.

```js
stringifyStructRef({
  context: [ 'workbook.xlsx' ],
  sections: [ 'data' ],
  columns: [ 'my column', '@foo' ],
  table: 'tableName',
});
// => 'workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]'
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refObject` | [`ReferenceStruct`](#fxtype-aliasesreferencestructmd) | A structured reference object. |
| `options?` | [`OptsStringifyStructRef`](#fxtype-aliasesoptsstringifystructrefmd) | Options. |

## Returns

`string`

The given structured reference in string format.

## See

[OptsStringifyStructRef](#fxtype-aliasesoptsstringifystructrefmd)


<a name="fxfunctionsstringifytokensmd"></a>

# stringifyTokens()

```ts
function stringifyTokens(tokens: Token[]): string;
```

Collapses a list of tokens into a formula string.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | [`Token`](#fxtype-aliasestokenmd)[] | A list of tokens. |

## Returns

`string`

A formula string.


<a name="fxfunctionstocolmd"></a>

# toCol()

```ts
function toCol(columnIndex: number): string;
```

Convert a 0 based offset number to a column string
representation (`0` = `"A"`, `2` = `"C"`).

The method expects a number between 0 and 16383. Other input will
return garbage.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `columnIndex` | `number` | Zero based column index number |

## Returns

`string`

The column string identifier


<a name="fxfunctionstokenizemd"></a>

# tokenize()

```ts
function tokenize(formula: string, options?: OptsTokenize): Token[];
```

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

A collection of token types may be found as an object as the [tokenTypes](#fxvariablestokentypesmd)
export on the package.

_Warning:_ To support syntax highlighting as you type, `STRING` tokens are allowed to be
"unterminated". For example, the incomplete formula `="Hello world` would be
tokenized as:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: STRING, value: '"Hello world', unterminated: true },
]
```

Parsers will need to handle this.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formula` | `string` | An Excel formula string (an Excel expression). |
| `options?` | [`OptsTokenize`](#fxtype-aliasesoptstokenizemd) | Options |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

An array of Tokens

## See

 - [OptsTokenize](#fxtype-aliasesoptstokenizemd)
 - [tokenTypes](#fxvariablestokentypesmd)


<a name="fxfunctionstranslateformulatoa1md"></a>

# translateFormulaToA1()

```ts
function translateFormulaToA1(
   formula: string, 
   anchorCell: string, 
   options: OptsTranslateFormulaToA1): string;
```

Translates ranges in a formula from relative R1C1 syntax to absolute A1 syntax.

```js
translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
// => "=SUM(E10,$E$2,Sheet!$E$3)");
```

If an input range is -1,-1 relative rows/columns and the anchor is A1, the
resulting range will (by default) wrap around to the bottom of the sheet
resulting in the range XFD1048576. This may not be what you want so you can set
`{ wrapEdges }` to false which will instead turn the range into a `#REF!` error.

```js
translateToA1("=R[-1]C[-1]", "A1");
// => "=XFD1048576");

translateToA1("=R[-1]C[-1]", "A1", { wrapEdges: false });
// => "=#REF!");
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formula` | `string` | An Excel formula string that should be adjusted. |
| `anchorCell` | `string` | A simple string reference to an A1 cell ID (`AF123` or`$C$5`). |
| `options` | [`OptsTranslateFormulaToA1`](#fxtype-aliasesoptstranslateformulatoa1md) | Translation options. |

## Returns

`string`

A formula string.

## See

[OptsTranslateFormulaToA1](#fxtype-aliasesoptstranslateformulatoa1md)


<a name="fxfunctionstranslateformulator1c1md"></a>

# translateFormulaToR1C1()

```ts
function translateFormulaToR1C1(
   formula: string, 
   anchorCell: string, 
   options?: OptsTranslateToR1C1): string;
```

Translates ranges in a formula from absolute A1 syntax to relative R1C1 syntax.

```js
translateFormulaToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
// => "=SUM(RC[1],R2C5,Sheet!R3C5)");
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formula` | `string` | An Excel formula that should be adjusted. |
| `anchorCell` | `string` | A simple string reference to an A1 cell ID (`AF123` or`$C$5`). |
| `options?` | [`OptsTranslateToR1C1`](#fxtype-aliasesoptstranslatetor1c1md) | The options |

## Returns

`string`

A formula string.

## See

[OptsTranslateToR1C1](#fxtype-aliasesoptstranslatetor1c1md)


<a name="fxfunctionstranslatetokenstoa1md"></a>

# translateTokensToA1()

```ts
function translateTokensToA1(
   tokens: Token[], 
   anchorCell: string, 
   options: OptsTranslateTokensToA1): Token[];
```

Translates ranges in a list of tokens from relative R1C1 syntax to absolute A1 syntax.

```js
translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
// => "=SUM(E10,$E$2,Sheet!$E$3)");
```

If an input range is -1,-1 relative rows/columns and the anchor is A1, the
resulting range will (by default) wrap around to the bottom of the sheet
resulting in the range XFD1048576. This may not be what you want so may set
`{ wrapEdges }` to false which will instead turn the range into a `#REF!` error.

```js
translateToA1("=R[-1]C[-1]", "A1");
// => "=XFD1048576");

translateToA1("=R[-1]C[-1]", "A1", { wrapEdges: false });
// => "=#REF!");
```

Note that if you are passing in a list of tokens that was not created using
`mergeRefs` and you disable edge wrapping (or you simply set both options
to false), you can end up with a formula such as `=#REF!:B2` or
`=Sheet3!#REF!:F3`. These are valid formulas in the Excel formula language
and Excel will accept them, but they are not supported in Google Sheets.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | [`Token`](#fxtype-aliasestokenmd)[] | A token list that should be adjusted. |
| `anchorCell` | `string` | A simple string reference to an A1 cell ID (`AF123` or`$C$5`). |
| `options` | [`OptsTranslateTokensToA1`](#fxtype-aliasesoptstranslatetokenstoa1md) | Translation options. |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

A token list.

## See

[OptsTranslateTokensToA1](#fxtype-aliasesoptstranslatetokenstoa1md)


<a name="fxfunctionstranslatetokenstor1c1md"></a>

# translateTokensToR1C1()

```ts
function translateTokensToR1C1(tokens: Token[], anchorCell: string): Token[];
```

Translates ranges in a list of tokens from absolute A1 syntax to relative R1C1 syntax.

```js
translateFormulaToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
// => "=SUM(RC[1],R2C5,Sheet!R3C5)");
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | [`Token`](#fxtype-aliasestokenmd)[] | A token list that should be adjusted. |
| `anchorCell` | `string` | A simple string reference to an A1 cell ID (`AF123` or`$C$5`). |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

A token list.


<a name="fxtype-aliasesarrayexpressionmd"></a>

# ArrayExpression

```ts
type ArrayExpression = {
  elements: (
     | ReferenceIdentifier
     | Literal
     | ErrorLiteral
    | CallExpression)[][];
  loc?: SourceLocation;
  type: "ArrayExpression";
} & Node;
```

An array expression. Excel does not have empty or sparse arrays and restricts array elements to
literals. Google Sheets allows `ReferenceIdentifier`s and `CallExpression`s as elements of
arrays, the fx parser has options for this but they are off by default.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `elements` | ( \| [`ReferenceIdentifier`](#fxtype-aliasesreferenceidentifiermd) \| [`Literal`](#fxtype-aliasesliteralmd) \| [`ErrorLiteral`](#fxtype-aliaseserrorliteralmd) \| [`CallExpression`](#fxtype-aliasescallexpressionmd))[][] | The elements of the array. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `type` | `"ArrayExpression"` | The type of this AST node. |


<a name="fxtype-aliasesastexpressionmd"></a>

# AstExpression

```ts
type AstExpression = 
  | ReferenceIdentifier
  | Literal
  | ErrorLiteral
  | UnaryExpression
  | BinaryExpression
  | CallExpression
  | ArrayExpression
  | LambdaExpression
  | LetExpression;
```

Represents an evaluate-able expression.


<a name="fxtype-aliasesbinaryexpressionmd"></a>

# BinaryExpression

```ts
type BinaryExpression = {
  arguments: AstExpression[];
  loc?: SourceLocation;
  operator: BinaryOperator;
  type: "BinaryExpression";
} & Node;
```

A binary operator expression.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `arguments` | [`AstExpression`](#fxtype-aliasesastexpressionmd)[] | The arguments for the operator. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `operator` | [`BinaryOperator`](#fxtype-aliasesbinaryoperatormd) | The expression's operator. |
| `type` | `"BinaryExpression"` | The type of this AST node. |


<a name="fxtype-aliasesbinaryoperatormd"></a>

# BinaryOperator

```ts
type BinaryOperator = 
  | "="
  | "<"
  | ">"
  | "<="
  | ">="
  | "<>"
  | "-"
  | "+"
  | "*"
  | "/"
  | "^"
  | ":"
  | " "
  | ","
  | "&";
```

A binary operator token.

Note that Excels union operator is whitespace so a parser must take care to normalize this to
a single space.


<a name="fxtype-aliasescallexpressionmd"></a>

# CallExpression

```ts
type CallExpression = {
  arguments: AstExpression[];
  callee: Identifier;
  loc?: SourceLocation;
  type: "CallExpression";
} & Node;
```

A function call expression.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `arguments` | [`AstExpression`](#fxtype-aliasesastexpressionmd)[] | The arguments for the function. |
| `callee` | [`Identifier`](#fxtype-aliasesidentifiermd) | The function being called. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `type` | `"CallExpression"` | The type of this AST node. |


<a name="fxtype-aliaseserrorliteralmd"></a>

# ErrorLiteral

```ts
type ErrorLiteral = {
  loc?: SourceLocation;
  raw: string;
  type: "ErrorLiteral";
  value: string;
} & Node;
```

An Error expression.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `raw` | `string` | The untouched literal source. |
| `type` | `"ErrorLiteral"` | The type of this AST node. |
| `value` | `string` | The value of the error. |


<a name="fxtype-aliasesidentifiermd"></a>

# Identifier

```ts
type Identifier = {
  loc?: SourceLocation;
  name: string;
  type: "Identifier";
} & Node;
```

An identifier. These appear on `CallExpression`, `LambdaExpression`, and `LetExpression`
and will always be a static string representing the name of a function call or parameter.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `name` | `string` | The identifying name. |
| `type` | `"Identifier"` | The type of this AST node. |


<a name="fxtype-aliaseslambdaexpressionmd"></a>

# LambdaExpression

```ts
type LambdaExpression = {
  body: AstExpression | null;
  loc?: SourceLocation;
  params: Identifier[];
  type: "LambdaExpression";
} & Node;
```

A LAMBDA expression.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `body` | [`AstExpression`](#fxtype-aliasesastexpressionmd) \| `null` | The LAMBDA's expression. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `params` | [`Identifier`](#fxtype-aliasesidentifiermd)[] | The LAMBDA's parameters. |
| `type` | `"LambdaExpression"` | The type of this AST node. |


<a name="fxtype-aliasesletdeclaratormd"></a>

# LetDeclarator

```ts
type LetDeclarator = {
  id: Identifier;
  init: AstExpression | null;
  loc?: SourceLocation;
  type: "LetDeclarator";
} & Node;
```

A LET parameter declaration.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `id` | [`Identifier`](#fxtype-aliasesidentifiermd) | The name of the variable. |
| `init` | [`AstExpression`](#fxtype-aliasesastexpressionmd) \| `null` | The variable's initializing expression. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `type` | `"LetDeclarator"` | The type of this AST node. |


<a name="fxtype-aliasesletexpressionmd"></a>

# LetExpression

```ts
type LetExpression = {
  body: AstExpression | null;
  declarations: LetDeclarator[];
  loc?: SourceLocation;
  type: "LetExpression";
} & Node;
```

A LET expression.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `body` | [`AstExpression`](#fxtype-aliasesastexpressionmd) \| `null` | The LET's scoped expression. |
| `declarations` | [`LetDeclarator`](#fxtype-aliasesletdeclaratormd)[] | The LET's variable declarations. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `type` | `"LetExpression"` | The type of this AST node. |


<a name="fxtype-aliasesliteralmd"></a>

# Literal

```ts
type Literal = {
  loc?: SourceLocation;
  raw: string;
  type: "Literal";
  value: string | number | boolean;
} & Node;
```

A literal token. Captures numbers, strings, and booleans.
Literal errors have their own variant type.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `raw` | `string` | The untouched literal source. |
| `type` | `"Literal"` | The type of this AST node. |
| `value` | `string` \| `number` \| `boolean` | The value of the literal. |


<a name="fxtype-aliasesnodemd"></a>

# Node

```ts
type Node = {
  loc?: SourceLocation;
  type: string;
};
```

All AST nodes are represented by `Node` objects.
They may have any prototype inheritance but implement the same basic interface.

The `type` field is a string representing the AST variant type.
Each subtype of Node is documented below with the specific string of its `type` field.
You can use this field to determine which interface a node implements.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="loc"></a> `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| <a id="type"></a> `type` | `string` | The type of this AST node. |


<a name="fxtype-aliasesoptsfixrangesmd"></a>

# OptsFixRanges

```ts
type OptsFixRanges = {
  addBounds?: boolean;
  thisRow?: boolean;
};
```

Options for [fixTokenRanges](#fxfunctionsfixtokenrangesmd) and [fixFormulaRanges](#fxfunctionsfixformularangesmd).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="addbounds"></a> `addBounds?` | `boolean` | `false` | Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383. |
| <a id="thisrow"></a> `thisRow?` | `boolean` | `false` | Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges. |


<a name="fxtype-aliasesoptsparsemd"></a>

# OptsParse

```ts
type OptsParse = {
  looseRefCalls?: boolean;
  permitArrayCalls?: boolean;
  permitArrayRanges?: boolean;
};
```

Options for [parse](#fxfunctionsparsemd).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="looserefcalls"></a> `looseRefCalls?` | `boolean` | `false` | Permits any function call where otherwise only functions that return references would be permitted. |
| <a id="permitarraycalls"></a> `permitArrayCalls?` | `boolean` | `false` | Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it. |
| <a id="permitarrayranges"></a> `permitArrayRanges?` | `boolean` | `false` | Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it. |


<a name="fxtype-aliasesoptsparsea1refmd"></a>

# OptsParseA1Ref

```ts
type OptsParseA1Ref = {
  allowNamed?: boolean;
  allowTernary?: boolean;
};
```

Options for [parseA1Ref](#fxfunctionsparsea1refmd).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="allownamed"></a> `allowNamed?` | `boolean` | `true` | Enable parsing names as well as ranges. |
| <a id="allowternary"></a> `allowTernary?` | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: [References.md](./References.md). |


<a name="fxtype-aliasesoptsparser1c1refmd"></a>

# OptsParseR1C1Ref

```ts
type OptsParseR1C1Ref = {
  allowNamed?: boolean;
  allowTernary?: boolean;
};
```

Options for [parseR1C1Ref](#fxfunctionsparser1c1refmd).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="allownamed"></a> `allowNamed?` | `boolean` | `true` | Enable parsing names as well as ranges. |
| <a id="allowternary"></a> `allowTernary?` | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: [References.md](./References.md). |


<a name="fxtype-aliasesoptsstringifystructrefmd"></a>

# OptsStringifyStructRef

```ts
type OptsStringifyStructRef = {
  thisRow?: boolean;
};
```

Options for [stringifyStructRef](#fxfunctionsstringifystructrefmd)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="thisrow"></a> `thisRow?` | `boolean` | `false` | Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges. |


<a name="fxtype-aliasesoptstokenizemd"></a>

# OptsTokenize

```ts
type OptsTokenize = {
  allowTernary?: boolean;
  mergeRefs?: boolean;
  negativeNumbers?: boolean;
  r1c1?: boolean;
  withLocation?: boolean;
};
```

Options for [tokenize](#fxfunctionstokenizemd).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="allowternary"></a> `allowTernary?` | `boolean` | `false` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: [References.md](./References.md). |
| <a id="mergerefs"></a> `mergeRefs?` | `boolean` | `true` | Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens) |
| <a id="negativenumbers"></a> `negativeNumbers?` | `boolean` | `true` | Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree). |
| <a id="r1c1"></a> `r1c1?` | `boolean` | `false` | Ranges are expected to be in the R1C1 style format rather than the more popular A1 style. |
| <a id="withlocation"></a> `withLocation?` | `boolean` | `true` | Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }` |


<a name="fxtype-aliasesoptstranslateformulatoa1md"></a>

# OptsTranslateFormulaToA1

```ts
type OptsTranslateFormulaToA1 = {
  allowTernary?: boolean;
  mergeRefs?: boolean;
  wrapEdges?: boolean;
};
```

Options for [translateFormulaToA1](#fxfunctionstranslateformulatoa1md).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="allowternary"></a> `allowTernary?` | `boolean` | `true` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. |
| <a id="mergerefs"></a> `mergeRefs?` | `boolean` | `true` | Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). |
| <a id="wrapedges"></a> `wrapEdges?` | `boolean` | `true` | Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors. |


<a name="fxtype-aliasesoptstranslatetor1c1md"></a>

# OptsTranslateToR1C1

```ts
type OptsTranslateToR1C1 = {
  allowTernary?: boolean;
};
```

Options for [translateFormulaToR1C1](#fxfunctionstranslateformulator1c1md).

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="allowternary"></a> `allowTernary?` | `boolean` | `true` | Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: [References.md](./References.md). |


<a name="fxtype-aliasesoptstranslatetokenstoa1md"></a>

# OptsTranslateTokensToA1

```ts
type OptsTranslateTokensToA1 = {
  wrapEdges?: boolean;
};
```

Options for [translateTokensToA1](#fxfunctionstranslatetokenstoa1md)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="wrapedges"></a> `wrapEdges?` | `boolean` | `true` | Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors. |


<a name="fxtype-aliasesrangea1md"></a>

# RangeA1

```ts
type RangeA1 = {
  $bottom?: boolean | null;
  $left?: boolean | null;
  $right?: boolean | null;
  $top?: boolean | null;
  bottom?: number | null;
  left: number | null;
  right?: number | null;
  top: number | null;
  trim?: "head" | "tail" | "both" | null;
};
```

A range in A1 style coordinates.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bottom"></a> `$bottom?` | `boolean` \| `null` | Signifies that bottom is a "locked" value |
| <a id="left"></a> `$left?` | `boolean` \| `null` | Signifies that left is a "locked" value |
| <a id="right"></a> `$right?` | `boolean` \| `null` | Signifies that right is a "locked" value |
| <a id="top"></a> `$top?` | `boolean` \| `null` | Signifies that top is a "locked" value |
| <a id="bottom-1"></a> `bottom?` | `number` \| `null` | Bottom row of the range |
| <a id="left-1"></a> `left` | `number` \| `null` | Left column of the range |
| <a id="right-1"></a> `right?` | `number` \| `null` | Right column of the range |
| <a id="top-1"></a> `top` | `number` \| `null` | Top row of the range |
| <a id="trim"></a> `trim?` | `"head"` \| `"tail"` \| `"both"` \| `null` | Should empty rows and columns at the top/left or bottom/right be discarded when range is read? |


<a name="fxtype-aliasesranger1c1md"></a>

# RangeR1C1

```ts
type RangeR1C1 = {
  $c0?: boolean | null;
  $c1?: boolean | null;
  $r0?: boolean | null;
  $r1?: boolean | null;
  c0?: number | null;
  c1?: number | null;
  r0?: number | null;
  r1?: number | null;
  trim?: "head" | "tail" | "both" | null;
};
```

A range in R1C1 style coordinates.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="c0"></a> `$c0?` | `boolean` \| `null` | Signifies that c0 is an absolute value |
| <a id="c1"></a> `$c1?` | `boolean` \| `null` | Signifies that c1 is an absolute value |
| <a id="r0"></a> `$r0?` | `boolean` \| `null` | Signifies that r0 is an absolute value |
| <a id="r1"></a> `$r1?` | `boolean` \| `null` | Signifies that r1 is an absolute value |
| <a id="c0-1"></a> `c0?` | `number` \| `null` | Left column of the range |
| <a id="c1-1"></a> `c1?` | `number` \| `null` | Right column of the range |
| <a id="r0-1"></a> `r0?` | `number` \| `null` | Top row of the range |
| <a id="r1-1"></a> `r1?` | `number` \| `null` | Bottom row of the range |
| <a id="trim"></a> `trim?` | `"head"` \| `"tail"` \| `"both"` \| `null` | Should empty rows and columns at the top/left or bottom/right be discarded when range is read? |


<a name="fxtype-aliasesreferencea1md"></a>

# ReferenceA1

```ts
type ReferenceA1 = {
  context?: string[];
  range: RangeA1;
};
```

A reference containing an A1 style range. See [Prefixes.md](Prefixes.md) for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | `string`[] | A collection of scopes for the reference |
| <a id="range"></a> `range` | [`RangeA1`](#fxtype-aliasesrangea1md) | The reference's range |


<a name="fxtype-aliasesreferencea1xlsxmd"></a>

# ReferenceA1Xlsx

```ts
type ReferenceA1Xlsx = {
  range: RangeA1;
  sheetName?: string;
  workbookName?: string;
};
```

A reference containing an A1 style range. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="range"></a> `range` | [`RangeA1`](#fxtype-aliasesrangea1md) | The reference's range |
| <a id="sheetname"></a> `sheetName?` | `string` | A context sheet scope |
| <a id="workbookname"></a> `workbookName?` | `string` | A context workbook scope |


<a name="fxtype-aliasesreferenceidentifiermd"></a>

# ReferenceIdentifier

```ts
type ReferenceIdentifier = {
  kind: "name" | "range" | "beam" | "table";
  loc?: SourceLocation;
  type: "ReferenceIdentifier";
  value: string;
} & Node;
```

An identifier for a range or a name.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `kind` | `"name"` \| `"range"` \| `"beam"` \| `"table"` | The kind of reference the value holds. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `type` | `"ReferenceIdentifier"` | The type of this AST node. |
| `value` | `string` | The untouched reference value. |


<a name="fxtype-aliasesreferencenamemd"></a>

# ReferenceName

```ts
type ReferenceName = {
  context?: string[];
  name: string;
};
```

A reference containing a name. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | `string`[] | A collection of scopes for the reference |
| <a id="name"></a> `name` | `string` | The reference's name |


<a name="fxtype-aliasesreferencenamexlsxmd"></a>

# ReferenceNameXlsx

```ts
type ReferenceNameXlsx = {
  name: string;
  sheetName?: string;
  workbookName?: string;
};
```

A reference containing a name. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="name"></a> `name` | `string` | The reference's name |
| <a id="sheetname"></a> `sheetName?` | `string` | A context sheet scope |
| <a id="workbookname"></a> `workbookName?` | `string` | A context workbook scope |


<a name="fxtype-aliasesreferencer1c1md"></a>

# ReferenceR1C1

```ts
type ReferenceR1C1 = {
  context?: string[];
  range: RangeR1C1;
};
```

A reference containing a R1C1 style range. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | `string`[] | A collection of scopes for the reference |
| <a id="range"></a> `range` | [`RangeR1C1`](#fxtype-aliasesranger1c1md) | The reference's range |


<a name="fxtype-aliasesreferencer1c1xlsxmd"></a>

# ReferenceR1C1Xlsx

```ts
type ReferenceR1C1Xlsx = {
  range: RangeR1C1;
  sheetName?: string;
  workbookName?: string;
};
```

A reference containing a R1C1 style range. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="range"></a> `range` | [`RangeR1C1`](#fxtype-aliasesranger1c1md) | The reference's range |
| <a id="sheetname"></a> `sheetName?` | `string` | A context sheet scope |
| <a id="workbookname"></a> `workbookName?` | `string` | A context workbook scope |


<a name="fxtype-aliasesreferencestructmd"></a>

# ReferenceStruct

```ts
type ReferenceStruct = {
  columns?: string[];
  context?: string[];
  sections?: string[];
  table?: string;
};
```

A reference containing a table slice definition. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="columns"></a> `columns?` | `string`[] | The sections this reference targets |
| <a id="context"></a> `context?` | `string`[] | A collection of scopes for the reference |
| <a id="sections"></a> `sections?` | `string`[] | The sections this reference targets |
| <a id="table"></a> `table?` | `string` | The table this reference targets |


<a name="fxtype-aliasesreferencestructxlsxmd"></a>

# ReferenceStructXlsx

```ts
type ReferenceStructXlsx = {
  columns?: string[];
  sections?: string[];
  sheetName?: string;
  table?: string;
  workbookName?: string;
};
```

A reference containing a table slice definition. See [Prefixes.md] for
documentation on how scopes work in Fx.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="columns"></a> `columns?` | `string`[] | The sections this reference targets |
| <a id="sections"></a> `sections?` | `string`[] | The sections this reference targets |
| <a id="sheetname"></a> `sheetName?` | `string` | A context sheet scope |
| <a id="table"></a> `table?` | `string` | The table this reference targets |
| <a id="workbookname"></a> `workbookName?` | `string` | A context workbook scope |


<a name="fxtype-aliasessourcelocationmd"></a>

# SourceLocation

```ts
type SourceLocation = number[];
```

Represents the source location information of the node.
If the node contains no information about the source location, the field is `null`;
otherwise it is an array consisting of a two numbers: A start offset (the position of
the first character of the parsed source region) and an end offset (the position of
the first character after the parsed source region).


<a name="fxtype-aliasestokenmd"></a>

# Token

```ts
type Token = Record<string, unknown> & {
  loc?: number[];
  type: string;
  unterminated?: boolean;
  value: string;
};
```

A formula language token.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `loc?` | `number`[] | Source position offsets to the token |
| `type` | `string` | The type of the token |
| `unterminated?` | `boolean` | Signifies an unterminated string token |
| `value` | `string` | The value of the token |


<a name="fxtype-aliasestokenenhancedmd"></a>

# TokenEnhanced

```ts
type TokenEnhanced = Token & {
  depth?: number;
  error?: boolean;
  groupId?: string;
  index: number;
};
```

A token with extra meta data.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `depth?` | `number` | This token's level of nesting inside parentheses |
| `error?` | `boolean` | Token is of unknown type or a paren without a match |
| `groupId?` | `string` | The ID of a group which this token belongs (e.g. matching parens) |
| `index` | `number` | A zero based position in a token list |


<a name="fxtype-aliasesunaryexpressionmd"></a>

# UnaryExpression

```ts
type UnaryExpression = {
  arguments: AstExpression[];
  loc?: SourceLocation;
  operator: UnaryOperator;
  type: "UnaryExpression";
} & Node;
```

A unary operator expression.

## Type Declaration

| Name | Type | Description |
| ------ | ------ | ------ |
| `arguments` | [`AstExpression`](#fxtype-aliasesastexpressionmd)[] | The arguments for the operator. |
| `loc?` | [`SourceLocation`](#fxtype-aliasessourcelocationmd) | The original source position of the node. |
| `operator` | [`UnaryOperator`](#fxtype-aliasesunaryoperatormd) | The expression's operator. |
| `type` | `"UnaryExpression"` | The type of this AST node. |


<a name="fxtype-aliasesunaryoperatormd"></a>

# UnaryOperator

```ts
type UnaryOperator = "+" | "-" | "%" | "#" | "@";
```

A unary operator token.


<a name="fxvariablesmax_colsmd"></a>

# MAX\_COLS

```ts
const MAX_COLS: number;
```

The maximum number of columns a spreadsheet reference may hold (16383).


<a name="fxvariablesmax_rowsmd"></a>

# MAX\_ROWS

```ts
const MAX_ROWS: number;
```

The maximum number of rows a spreadsheet reference may hold (1048575).


<a name="fxvariablesnodetypesmd"></a>

# nodeTypes

```ts
const nodeTypes: Readonly<{
  ARRAY: "ArrayExpression";
  BINARY: "BinaryExpression";
  CALL: "CallExpression";
  ERROR: "ErrorLiteral";
  IDENTIFIER: "Identifier";
  LAMBDA: "LambdaExpression";
  LET: "LetExpression";
  LET_DECL: "LetDeclarator";
  LITERAL: "Literal";
  REFERENCE: "ReferenceIdentifier";
  UNARY: "UnaryExpression";
}>;
```

A dictionary of the types used to identify AST node variants.


<a name="fxvariablestokentypesmd"></a>

# tokenTypes

```ts
const tokenTypes: Readonly<{
  BOOLEAN: "bool";
  CONTEXT: "context";
  CONTEXT_QUOTE: "context_quote";
  ERROR: "error";
  FUNCTION: "func";
  FX_PREFIX: "fx_prefix";
  NEWLINE: "newline";
  NUMBER: "number";
  OPERATOR: "operator";
  REF_BEAM: "range_beam";
  REF_NAMED: "range_named";
  REF_RANGE: "range";
  REF_STRUCT: "structured";
  REF_TERNARY: "range_ternary";
  STRING: "string";
  UNKNOWN: "unknown";
  WHITESPACE: "whitespace";
}>;
```

A dictionary of the types used to identify token variants.


<a name="fxxlsxreadmemd"></a>

# fx/xlsx

A tokenizer, parser, and other utilities to work with Excel formula code.

The xslx entry-point methods expect and return the variant of references that uses properties.
If you are not using xlsx files you should use the [fx](#fxreadmemd) variant methods.

See [Prefixes.md](./Prefixes.md) for documentation on how scopes work in Fx.

## Functions

- [addTokenMeta](#fxxlsxfunctionsaddtokenmetamd)
- [fixFormulaRanges](#fxxlsxfunctionsfixformularangesmd)
- [fixTokenRanges](#fxxlsxfunctionsfixtokenrangesmd)
- [parseA1Ref](#fxxlsxfunctionsparsea1refmd)
- [parseR1C1Ref](#fxxlsxfunctionsparser1c1refmd)
- [parseStructRef](#fxxlsxfunctionsparsestructrefmd)
- [stringifyA1Ref](#fxxlsxfunctionsstringifya1refmd)
- [stringifyR1C1Ref](#fxxlsxfunctionsstringifyr1c1refmd)
- [stringifyStructRef](#fxxlsxfunctionsstringifystructrefmd)
- [tokenize](#fxxlsxfunctionstokenizemd)

## References

### addA1RangeBounds

Re-exports [addA1RangeBounds](#fxfunctionsadda1rangeboundsmd)

***

### ArrayExpression

Re-exports [ArrayExpression](#fxtype-aliasesarrayexpressionmd)

***

### AstExpression

Re-exports [AstExpression](#fxtype-aliasesastexpressionmd)

***

### BinaryExpression

Re-exports [BinaryExpression](#fxtype-aliasesbinaryexpressionmd)

***

### BinaryOperator

Re-exports [BinaryOperator](#fxtype-aliasesbinaryoperatormd)

***

### CallExpression

Re-exports [CallExpression](#fxtype-aliasescallexpressionmd)

***

### ErrorLiteral

Re-exports [ErrorLiteral](#fxtype-aliaseserrorliteralmd)

***

### fromCol

Re-exports [fromCol](#fxfunctionsfromcolmd)

***

### Identifier

Re-exports [Identifier](#fxtype-aliasesidentifiermd)

***

### isArrayNode

Re-exports [isArrayNode](#fxfunctionsisarraynodemd)

***

### isBinaryNode

Re-exports [isBinaryNode](#fxfunctionsisbinarynodemd)

***

### isCallNode

Re-exports [isCallNode](#fxfunctionsiscallnodemd)

***

### isError

Re-exports [isError](#fxfunctionsiserrormd)

***

### isErrorNode

Re-exports [isErrorNode](#fxfunctionsiserrornodemd)

***

### isExpressionNode

Re-exports [isExpressionNode](#fxfunctionsisexpressionnodemd)

***

### isFunction

Re-exports [isFunction](#fxfunctionsisfunctionmd)

***

### isFxPrefix

Re-exports [isFxPrefix](#fxfunctionsisfxprefixmd)

***

### isIdentifierNode

Re-exports [isIdentifierNode](#fxfunctionsisidentifiernodemd)

***

### isLambdaNode

Re-exports [isLambdaNode](#fxfunctionsislambdanodemd)

***

### isLetDeclaratorNode

Re-exports [isLetDeclaratorNode](#fxfunctionsisletdeclaratornodemd)

***

### isLetNode

Re-exports [isLetNode](#fxfunctionsisletnodemd)

***

### isLiteral

Re-exports [isLiteral](#fxfunctionsisliteralmd)

***

### isLiteralNode

Re-exports [isLiteralNode](#fxfunctionsisliteralnodemd)

***

### isOperator

Re-exports [isOperator](#fxfunctionsisoperatormd)

***

### isRange

Re-exports [isRange](#fxfunctionsisrangemd)

***

### isReference

Re-exports [isReference](#fxfunctionsisreferencemd)

***

### isReferenceNode

Re-exports [isReferenceNode](#fxfunctionsisreferencenodemd)

***

### isUnaryNode

Re-exports [isUnaryNode](#fxfunctionsisunarynodemd)

***

### isWhitespace

Re-exports [isWhitespace](#fxfunctionsiswhitespacemd)

***

### LambdaExpression

Re-exports [LambdaExpression](#fxtype-aliaseslambdaexpressionmd)

***

### LetDeclarator

Re-exports [LetDeclarator](#fxtype-aliasesletdeclaratormd)

***

### LetExpression

Re-exports [LetExpression](#fxtype-aliasesletexpressionmd)

***

### Literal

Re-exports [Literal](#fxtype-aliasesliteralmd)

***

### MAX\_COLS

Re-exports [MAX_COLS](#fxvariablesmax_colsmd)

***

### MAX\_ROWS

Re-exports [MAX_ROWS](#fxvariablesmax_rowsmd)

***

### mergeRefTokens

Re-exports [mergeRefTokens](#fxfunctionsmergereftokensmd)

***

### Node

Re-exports [Node](#fxtype-aliasesnodemd)

***

### nodeTypes

Re-exports [nodeTypes](#fxvariablesnodetypesmd)

***

### OptsFixRanges

Re-exports [OptsFixRanges](#fxtype-aliasesoptsfixrangesmd)

***

### OptsParse

Re-exports [OptsParse](#fxtype-aliasesoptsparsemd)

***

### OptsParseA1Ref

Re-exports [OptsParseA1Ref](#fxtype-aliasesoptsparsea1refmd)

***

### OptsParseR1C1Ref

Re-exports [OptsParseR1C1Ref](#fxtype-aliasesoptsparser1c1refmd)

***

### OptsStringifyStructRef

Re-exports [OptsStringifyStructRef](#fxtype-aliasesoptsstringifystructrefmd)

***

### OptsTokenize

Re-exports [OptsTokenize](#fxtype-aliasesoptstokenizemd)

***

### OptsTranslateFormulaToA1

Re-exports [OptsTranslateFormulaToA1](#fxtype-aliasesoptstranslateformulatoa1md)

***

### OptsTranslateTokensToA1

Re-exports [OptsTranslateTokensToA1](#fxtype-aliasesoptstranslatetokenstoa1md)

***

### OptsTranslateToR1C1

Re-exports [OptsTranslateToR1C1](#fxtype-aliasesoptstranslatetor1c1md)

***

### parse

Re-exports [parse](#fxfunctionsparsemd)

***

### parseA1Range

Re-exports [parseA1Range](#fxfunctionsparsea1rangemd)

***

### parseR1C1Range

Re-exports [parseR1C1Range](#fxfunctionsparser1c1rangemd)

***

### RangeA1

Re-exports [RangeA1](#fxtype-aliasesrangea1md)

***

### RangeR1C1

Re-exports [RangeR1C1](#fxtype-aliasesranger1c1md)

***

### ReferenceA1

Re-exports [ReferenceA1](#fxtype-aliasesreferencea1md)

***

### ReferenceA1Xlsx

Re-exports [ReferenceA1Xlsx](#fxtype-aliasesreferencea1xlsxmd)

***

### ReferenceIdentifier

Re-exports [ReferenceIdentifier](#fxtype-aliasesreferenceidentifiermd)

***

### ReferenceName

Re-exports [ReferenceName](#fxtype-aliasesreferencenamemd)

***

### ReferenceNameXlsx

Re-exports [ReferenceNameXlsx](#fxtype-aliasesreferencenamexlsxmd)

***

### ReferenceR1C1

Re-exports [ReferenceR1C1](#fxtype-aliasesreferencer1c1md)

***

### ReferenceR1C1Xlsx

Re-exports [ReferenceR1C1Xlsx](#fxtype-aliasesreferencer1c1xlsxmd)

***

### ReferenceStruct

Re-exports [ReferenceStruct](#fxtype-aliasesreferencestructmd)

***

### ReferenceStructXlsx

Re-exports [ReferenceStructXlsx](#fxtype-aliasesreferencestructxlsxmd)

***

### SourceLocation

Re-exports [SourceLocation](#fxtype-aliasessourcelocationmd)

***

### stringifyTokens

Re-exports [stringifyTokens](#fxfunctionsstringifytokensmd)

***

### toCol

Re-exports [toCol](#fxfunctionstocolmd)

***

### Token

Re-exports [Token](#fxtype-aliasestokenmd)

***

### TokenEnhanced

Re-exports [TokenEnhanced](#fxtype-aliasestokenenhancedmd)

***

### tokenTypes

Re-exports [tokenTypes](#fxvariablestokentypesmd)

***

### translateFormulaToA1

Re-exports [translateFormulaToA1](#fxfunctionstranslateformulatoa1md)

***

### translateFormulaToR1C1

Re-exports [translateFormulaToR1C1](#fxfunctionstranslateformulator1c1md)

***

### translateTokensToA1

Re-exports [translateTokensToA1](#fxfunctionstranslatetokenstoa1md)

***

### translateTokensToR1C1

Re-exports [translateTokensToR1C1](#fxfunctionstranslatetokenstor1c1md)

***

### UnaryExpression

Re-exports [UnaryExpression](#fxtype-aliasesunaryexpressionmd)

***

### UnaryOperator

Re-exports [UnaryOperator](#fxtype-aliasesunaryoperatormd)


<a name="fxxlsxfunctionsaddtokenmetamd"></a>

# addTokenMeta()

```ts
function addTokenMeta(tokenlist: Token[], context?: {
  sheetName?: string;
  workbookName?: string;
}): TokenEnhanced[];
```

Runs through a list of tokens and adds extra attributes such as matching
parens and ranges.

The `context` parameter defines default reference attributes:
`{ workbookName: 'report.xlsx', sheetName: 'Sheet1' }`.
If supplied, these are used to match `A1` to `Sheet1!A1`.

All tokens will be tagged with a `.depth` number value to indicating the
level of nesting in parentheses as well as an `.index` number indicating
their zero based position in the list.

The returned output will be the same array of tokens but the following
properties will added to tokens (as applicable):

#### Parentheses ( )

Matching parens will be tagged with `.groupId` string identifier as well as
a `.depth` number value (indicating the level of nesting).

Closing parens without a counterpart will be tagged with `.error`
(boolean true).

#### Curly brackets { }

Matching curly brackets will be tagged with `.groupId` string identifier.
These may not be nested in Excel.

Closing curly brackets without a counterpart will be tagged with `.error`
(boolean `true`).

#### Ranges (`REF_RANGE` or `REF_BEAM` type tokens)

All ranges will be tagged with `.groupId` string identifier regardless of
the number of times they occur.

#### Tokens of type `UNKNOWN`

All will be tagged with `.error` (boolean `true`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenlist` | [`Token`](#fxtype-aliasestokenmd)[] | An array of tokens (from `tokenize()`) |
| `context?` | \{ `sheetName?`: `string`; `workbookName?`: `string`; \} | A contest used to match `A1` to `Sheet1!A1`. |
| `context.sheetName?` | `string` | An implied sheet name ('Sheet1') |
| `context.workbookName?` | `string` | An implied workbook name ('report.xlsx') |

## Returns

[`TokenEnhanced`](#fxtype-aliasestokenenhancedmd)[]

The input array with the enchanced tokens


<a name="fxxlsxfunctionsfixformularangesmd"></a>

# fixFormulaRanges()

```ts
function fixFormulaRanges(formula: string, options?: OptsFixRanges & OptsTokenize): string;
```

Normalizes A1 style ranges and structured references in a formula.

Internally it uses [fixTokenRanges](#fxfunctionsfixtokenrangesmd) so see it's documentation for details.

Returns the same formula with the ranges updated. If an array of tokens was
supplied, then a new array is returned.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formula` | `string` | A string (an Excel formula) or a token list that should be adjusted. |
| `options?` | [`OptsFixRanges`](#fxtype-aliasesoptsfixrangesmd) & [`OptsTokenize`](#fxtype-aliasesoptstokenizemd) | Options |

## Returns

`string`

A formula string with ranges adjusted

## See

[OptsFixRanges](#fxtype-aliasesoptsfixrangesmd) & [OptsTokenize](#fxtype-aliasesoptstokenizemd)


<a name="fxxlsxfunctionsfixtokenrangesmd"></a>

# fixTokenRanges()

```ts
function fixTokenRanges(tokens: Token[], options?: OptsFixRanges): Token[];
```

Normalizes A1 style ranges and structured references in a list of tokens.

It ensures that that the top and left coordinates of an A1 range are on the
left-hand side of a colon operator:

```
B2:A1 → A1:B2
1:A1 → A1:1
A:A1 → A1:A
B:A → A:B
2:1 → 1:2
A1:A1 → A1
```

When `{ addBounds }` option is set to true, the missing bounds are also added.
This can be done to ensure Excel compatible ranges. The fixes then additionally include:

```
1:A1 → A1:1 → 1:1
A:A1 → A1:A → A:A
A1:A → A:A
A1:1 → A:1
B2:B → B2:1048576
B2:2 → B2:XFD2
```

Structured ranges are normalized to have consistent order and capitalization
of sections as well as removing redundant ones.

Returns a new array of tokens with values and position data updated.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | [`Token`](#fxtype-aliasestokenmd)[] | A list of tokens to be adjusted. |
| `options?` | [`OptsFixRanges`](#fxtype-aliasesoptsfixrangesmd) | Options. |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

A token list with ranges adjusted.

## See

[OptsFixRanges](#fxtype-aliasesoptsfixrangesmd)


<a name="fxxlsxfunctionsparsea1refmd"></a>

# parseA1Ref()

```ts
function parseA1Ref(refString: string, options: OptsParseA1Ref): 
  | ReferenceA1Xlsx
  | ReferenceNameXlsx;
```

Parse a string reference into an object representing it.

```js
parseA1Ref('Sheet1!A$1:$B2');
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

For A:A or A1:A style ranges, `null` will be used for any dimensions that the
syntax does not specify.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refString` | `string` | An A1-style reference string. |
| `options` | [`OptsParseA1Ref`](#fxtype-aliasesoptsparsea1refmd) | Options. |

## Returns

  \| [`ReferenceA1Xlsx`](#fxtype-aliasesreferencea1xlsxmd)
  \| [`ReferenceNameXlsx`](#fxtype-aliasesreferencenamexlsxmd)

An object representing a valid reference or `undefined` if it is invalid.

## See

[OptsParseA1Ref](#fxtype-aliasesoptsparsea1refmd)


<a name="fxxlsxfunctionsparser1c1refmd"></a>

# parseR1C1Ref()

```ts
function parseR1C1Ref(refString: string, options?: OptsParseR1C1Ref): 
  | ReferenceNameXlsx
  | ReferenceR1C1Xlsx;
```

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

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refString` | `string` | An R1C1-style reference string. |
| `options?` | [`OptsParseR1C1Ref`](#fxtype-aliasesoptsparser1c1refmd) | Options. |

## Returns

  \| [`ReferenceNameXlsx`](#fxtype-aliasesreferencenamexlsxmd)
  \| [`ReferenceR1C1Xlsx`](#fxtype-aliasesreferencer1c1xlsxmd)

An object representing a valid reference or `undefined` if it is invalid.

## See

[OptsParseR1C1Ref](#fxtype-aliasesoptsparser1c1refmd)


<a name="fxxlsxfunctionsparsestructrefmd"></a>

# parseStructRef()

```ts
function parseStructRef(ref: string): ReferenceStructXlsx;
```

Parse a structured reference string into an object representing it.

```js
parseStructRef('[workbook.xlsx]!tableName[[#Data],[Column1]:[Column2]]');
// => {
//   workbookName: 'workbook.xlsx',
//   sections: [ 'data' ],
//   columns: [ 'my column', '@foo' ],
//   table: 'tableName',
// }
```

For A:A or A1:A style ranges, `null` will be used for any dimensions that the
syntax does not specify:

See [References.md](./References.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ref` | `string` | A structured reference string |

## Returns

[`ReferenceStructXlsx`](#fxtype-aliasesreferencestructxlsxmd)

An object representing a valid reference or null if it is invalid.


<a name="fxxlsxfunctionsstringifya1refmd"></a>

# stringifyA1Ref()

```ts
function stringifyA1Ref(refObject: 
  | ReferenceA1Xlsx
  | ReferenceNameXlsx): string;
```

Get an A1-style string representation of a reference object.

```js
stringifyA1Ref({
  sheetName: 'Sheet1',
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

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refObject` | \| [`ReferenceA1Xlsx`](#fxtype-aliasesreferencea1xlsxmd) \| [`ReferenceNameXlsx`](#fxtype-aliasesreferencenamexlsxmd) | A reference object. |

## Returns

`string`

The reference in A1-style string format.


<a name="fxxlsxfunctionsstringifyr1c1refmd"></a>

# stringifyR1C1Ref()

```ts
function stringifyR1C1Ref(refObject: 
  | ReferenceNameXlsx
  | ReferenceR1C1Xlsx): string;
```

Get an R1C1-style string representation of a reference object.

```js
stringifyR1C1Ref({
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

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refObject` | \| [`ReferenceNameXlsx`](#fxtype-aliasesreferencenamexlsxmd) \| [`ReferenceR1C1Xlsx`](#fxtype-aliasesreferencer1c1xlsxmd) | A reference object. |

## Returns

`string`

The reference in R1C1-style string format.


<a name="fxxlsxfunctionsstringifystructrefmd"></a>

# stringifyStructRef()

```ts
function stringifyStructRef(refObject: ReferenceStructXlsx, options?: OptsStringifyStructRef): string;
```

Returns a string representation of a structured reference object.

```js
stringifyStructRef({
  workbookName: 'workbook.xlsx',
  sheetName: '',
  sections: [ 'data' ],
  columns: [ 'my column', '@foo' ],
  table: 'tableName',
});
// => 'workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]'
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refObject` | [`ReferenceStructXlsx`](#fxtype-aliasesreferencestructxlsxmd) | A structured reference object. |
| `options?` | [`OptsStringifyStructRef`](#fxtype-aliasesoptsstringifystructrefmd) | Options. |

## Returns

`string`

The given structured reference in string format.


<a name="fxxlsxfunctionstokenizemd"></a>

# tokenize()

```ts
function tokenize(formula: string, options?: OptsTokenize): Token[];
```

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

A collection of token types may be found as an object as the [tokenTypes](#fxvariablestokentypesmd)
export on the package.

_Warning:_ To support syntax highlighting as you type, `STRING` tokens are allowed to be
"unterminated". For example, the incomplete formula `="Hello world` would be
tokenized as:

```js
[
  { type: FX_PREFIX, value: '=' },
  { type: STRING, value: '"Hello world', unterminated: true },
]
```

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `formula` | `string` | An Excel formula string (an Excel expression). |
| `options?` | [`OptsTokenize`](#fxtype-aliasesoptstokenizemd) | Options |

## Returns

[`Token`](#fxtype-aliasestokenmd)[]

An array of Tokens

## See

 - [OptsTokenize](#fxtype-aliasesoptstokenizemd)
 - [tokenTypes](#fxvariablestokentypesmd)
