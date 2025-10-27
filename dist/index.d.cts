/**
 * Breaks a string formula into a list of tokens.
 *
 * The returned output will be an array of objects representing the tokens:
 *
 * ```js
 * [
 *   { type: FX_PREFIX, value: '=' },
 *   { type: FUNCTION, value: 'SUM' },
 *   { type: OPERATOR, value: '(' },
 *   { type: REF_RANGE, value: 'A1:B2' },
 *   { type: OPERATOR, value: ')' }
 * ]
 * ```
 *
 * Token types may be found as an Object as the
 * [`tokenTypes` export]{@link tokenTypes} on the package
 * (`import {tokenTypes} from '@borgar/fx';`).
 *
 * To support syntax highlighting as you type, `STRING` tokens are allowed to be
 * "unterminated". For example, the incomplete formula `="Hello world` would be
 * tokenized as:
 *
 * ```js
 * [
 *   { type: FX_PREFIX, value: '=' },
 *   { type: STRING, value: '"Hello world', unterminated: true },
 * ]
 * ```
 *
 * @see tokenTypes
 * @param {string} formula An Excel formula string (an Excel expression) or an array of tokens.
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.negativeNumbers=true]  Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).
 * @param {boolean} [options.r1c1=false]  Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
 * @param {boolean} [options.withLocation=true]  Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
 * @param {boolean} [options.mergeRefs=true]  Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens)
 * @param {boolean} [options.xlsx=false]  Enables a `[1]Sheet1!A1` or `[1]!name` syntax form for external workbooks found only in XLSX files.
 * @returns {Array<Token>} An AST of nodes
 */
declare function tokenize(formula: string, options?: {
    allowTernary?: boolean;
    negativeNumbers?: boolean;
    r1c1?: boolean;
    withLocation?: boolean;
    mergeRefs?: boolean;
    xlsx?: boolean;
}): Array<Token>;

/**
 * Parses a string formula or list of tokens into an AST.
 *
 * The parser requires `mergeRefs` to have been `true` in tokenlist options,
 * because it does not recognize reference context tokens.
 *
 * The AST Abstract Syntax Tree's format is documented in
 * [AST_format.md](./AST_format.md)
 *
 * @see nodeTypes
 * @param {(string | Token[])} formula An Excel formula string (an Excel expression) or an array of tokens.
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.negativeNumbers=true]  Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).
 * @param {boolean} [options.permitArrayRanges=false]  Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.
 * @param {boolean} [options.permitArrayCalls=false]  Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.
 * @param {boolean} [options.looseRefCalls=false]  Permits any function call where otherwise only functions that return references would be permitted.
 * @param {boolean} [options.r1c1=false]  Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
 * @param {boolean} [options.withLocation=false]  Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {AstExpression} An AST of nodes
 */
declare function parse(formula: (string | Token[]), options?: {
    allowNamed?: boolean;
    allowTernary?: boolean;
    negativeNumbers?: boolean;
    permitArrayRanges?: boolean;
    permitArrayCalls?: boolean;
    looseRefCalls?: boolean;
    r1c1?: boolean;
    withLocation?: boolean;
    xlsx?: boolean;
}): AstExpression;

/**
 * Runs through a list of tokens and adds extra attributes such as matching
 * parens and ranges.
 *
 * The `context` parameter defines default reference attributes:
 * `{ workbookName: 'report.xlsx', sheetName: 'Sheet1' }`.
 * If supplied, these are used to match `A1` to `Sheet1!A1`.
 *
 * All tokens will be tagged with a `.depth` number value to indicating the
 * level of nesting in parentheses as well as an `.index` number indicating
 * their zero based position in the list.
 *
 * The returned output will be the same array of tokens but the following
 * properties will added to tokens (as applicable):
 *
 * #### Parentheses ( )
 *
 * Matching parens will be tagged with `.groupId` string identifier as well as
 * a `.depth` number value (indicating the level of nesting).
 *
 * Closing parens without a counterpart will be tagged with `.error`
 * (boolean true).
 *
 * #### Curly brackets { }
 *
 * Matching curly brackets will be tagged with `.groupId` string identifier.
 * These may not be nested in Excel.
 *
 * Closing curly brackets without a counterpart will be tagged with `.error`
 * (boolean `true`).
 *
 * #### Ranges (`REF_RANGE` or `REF_BEAM` type tokens)
 *
 * All ranges will be tagged with `.groupId` string identifier regardless of
 * the number of times they occur.
 *
 * #### Tokens of type `UNKNOWN`
 *
 * All will be tagged with `.error` (boolean `true`).
 *
 * @param {Array<Token>} tokenlist An array of tokens (from `tokenize()`)
 * @param {object} [context={}] A contest used to match `A1` to `Sheet1!A1`.
 * @param {string} [context.sheetName=''] An implied sheet name ('Sheet1')
 * @param {string} [context.workbookName=''] An implied workbook name ('report.xlsx')
 * @returns {Array<TokenEnhanced>} The input array with the enchanced tokens
 */
declare function addTokenMeta(tokenlist: Array<Token>, { sheetName, workbookName }?: {
    sheetName?: string;
    workbookName?: string;
}): Array<TokenEnhanced>;

/**
 * Merges context with reference tokens as possible in a list of tokens.
 *
 * When given a tokenlist, this function returns a new list with ranges returned
 * as whole references (`Sheet1!A1:B2`) rather than separate tokens for each
 * part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 *
 * @param {Array<Token>} tokenlist An array of tokens (from `tokenize()`)
 * @returns {Array<Token>} A new list of tokens with range parts merged.
 */
declare function mergeRefTokens(tokenlist: Array<Token>): Array<Token>;

/**
 * Normalizes A1 style ranges and structured references in a formula or list of
 * tokens.
 *
 * It ensures that that the top and left coordinates of an A1 range are on the
 * left-hand side of a colon operator:
 *
 * ```
 * B2:A1 → A1:B2
 * 1:A1 → A1:1
 * A:A1 → A1:A
 * B:A → A:B
 * 2:1 → 1:2
 * A1:A1 → A1
 * ```
 *
 * When `{ addBounds: true }` is passed as an option, the missing bounds are
 * also added. This can be done to ensure Excel compatible ranges. The fixes
 * then additionally include:
 *
 * ```
 * 1:A1 → A1:1 → 1:1
 * A:A1 → A1:A → A:A
 * A1:A → A:A
 * A1:1 → A:1
 * B2:B → B2:1048576
 * B2:2 → B2:XFD2
 * ```
 *
 * Structured ranges are normalized cleaned up to have consistent order and
 * capitalization of sections as well as removing redundant ones.
 *
 * Returns the same formula with the ranges updated. If an array of tokens was
 * supplied, then a new array is returned.
 *
 * @param {(string | Array<Token>)} formula A string (an Excel formula) or a token list that should be adjusted.
 * @param {object} [options={}]  Options
 * @param {boolean} [options.addBounds=false]  Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383.
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param {boolean} [options.thisRow=false]  Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges.
 * @returns {(string | Array<Token>)} A formula string or token list (depending on which was input)
 */
declare function fixRanges(formula: (string | Array<Token>), options?: {
    addBounds?: boolean;
    xlsx?: boolean;
    thisRow?: boolean;
}): (string | Array<Token>);

/**
 * Convert a column string representation to a 0 based
 * offset number (`"C"` = `2`).
 *
 * The method expects a valid column identifier made up of _only_
 * A-Z letters, which may be either upper or lower case. Other input will
 * return garbage.
 *
 * @param {string} columnString  The column string identifier
 * @returns {number}  Zero based column index number
 */
declare function fromCol(columnString: string): number;

/**
 * Convert a 0 based offset number to a column string
 * representation (`2` = `"C"`).
 *
 * The method expects a number between 0 and 16383. Other input will
 * return garbage.
 *
 * @param {number} columnIndex Zero based column index number
 * @returns {string} The column string identifier
 */
declare function toCol(columnIndex: number): string;

/**
 * Get a string representation of a structured reference object.
 *
 * ```js
 * stringifyStructRef({
 *   context: [ 'workbook.xlsx' ],
 *   sections: [ 'data' ],
 *   columns: [ 'my column', '@foo' ],
 *   table: 'tableName',
 * });
 * // => 'workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]'
 * ```
 *
 * @param {ReferenceStruct} refObject A structured reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param {boolean} [options.thisRow=false]  Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges.
 * @returns {string} The structured reference in string format
 */
declare function stringifyStructRef(refObject: ReferenceStruct, options?: {
    xlsx?: boolean;
    thisRow?: boolean;
}): string;

/**
 * Parse a structured reference string into an object representing it.
 *
 * ```js
 * parseStructRef('workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]');
 * // => {
 * //   context: [ 'workbook.xlsx' ],
 * //   sections: [ 'data' ],
 * //   columns: [ 'my column', '@foo' ],
 * //   table: 'tableName',
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * @tutorial References.md
 * @param {string} ref  A structured reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceStruct|null)} An object representing a valid reference or null if it is invalid.
 */
declare function parseStructRef(ref: string, options?: {
    xlsx?: boolean;
}): (ReferenceStruct | null);

/**
 * Translates ranges in a formula or list of tokens from absolute A1 syntax to
 * relative R1C1 syntax.
 *
 * ```js
 * translateToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param {(string | Array<Token>)} formula A string (an Excel formula) or a token list that should be adjusted.
 * @param {string} anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param {object} [options={}] The options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param {boolean} [options.allowTernary=true]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @returns {(string | Array<Token>)} A formula string or token list (depending on which was input)
 */
declare function translateToR1C1(formula: (string | Array<Token>), anchorCell: string, { xlsx, allowTernary }?: {
    xlsx?: boolean;
    allowTernary?: boolean;
}): (string | Array<Token>);
/**
 * Translates ranges in a formula or list of tokens from relative R1C1 syntax to
 * absolute A1 syntax.
 *
 * ```js
 * translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
 * // => "=SUM(E10,$E$2,Sheet!$E$3)");
 * ```
 *
 * If an input range is -1,-1 relative rows/columns and the anchor is A1, the
 * resulting range will (by default) wrap around to the bottom of the sheet
 * resulting in the range XFD1048576. This may not be what you want so may set
 * `wrapEdges` to false which will instead turn the range into a `#REF!` error.
 *
 * ```js
 * translateToA1("=R[-1]C[-1]", "A1");
 * // => "=XFD1048576");
 *
 * translateToA1("=R[-1]C[-1]", "A1", { wrapEdges: false });
 * // => "=#REF!");
 * ```
 *
 * Note that if you are passing in a list of tokens that was not created using
 * `mergeRefs` and you disable edge wrapping (or you simply set both options
 * to false), you can end up with a formula such as `=#REF!:B2` or
 * `=Sheet3!#REF!:F3`. These are valid formulas in the Excel formula language
 * and Excel will accept them, but they are not supported in Google Sheets.
 *
 * @param {(string | Array<Token>)} formula A string (an Excel formula) or a token list that should be adjusted.
 * @param {string} anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param {object} [options={}] The options
 * @param {boolean} [options.wrapEdges=true]  Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors
 * @param {boolean} [options.mergeRefs=true]   Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param {boolean} [options.allowTernary=true]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @returns {(string | Array<Token>)} A formula string or token list (depending on which was input)
 */
declare function translateToA1(formula: (string | Array<Token>), anchorCell: string, options?: {
    wrapEdges?: boolean;
    mergeRefs?: boolean;
    xlsx?: boolean;
    allowTernary?: boolean;
}): (string | Array<Token>);

declare const MAX_COLS: number;
declare const MAX_ROWS: number;

/**
 * Determines whether the specified token is a range.
 *
 * Returns `true` if the input is a token that has a type of either REF_RANGE
 * (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or
 * REF_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.
 *
 * @param {any} token A token
 * @returns {boolean} True if the specified token is range, False otherwise.
 */
declare function isRange(token: any): boolean;
/**
 * Determines whether the specified token is a reference.
 *
 * Returns `true` if the input is a token of type REF_RANGE (`A1` or `A1:B2`),
 * REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), REF_BEAM (`A:A` or `1:1`),
 * or REF_NAMED (`myrange`). In all other cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is reference, False otherwise.
 */
declare function isReference(token: any): boolean;
/**
 * Determines whether the specified token is a literal.
 *
 * Returns `true` if the input is a token of type BOOLEAN (`TRUE` or `FALSE`),
 * ERROR (`#VALUE!`), NUMBER (123.4), or STRING (`"lorem ipsum"`). In all other
 * cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is literal, False otherwise.
 */
declare function isLiteral(token: any): boolean;
/**
 * Determines whether the specified token is an error.
 *
 * Returns `true` if the input is a token of type ERROR (`#VALUE!`). In all
 * other cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is error, False otherwise.
 */
declare function isError(token: any): boolean;
/**
 * Determines whether the specified token is whitespace.
 *
 * Returns `true` if the input is a token of type WHITESPACE (` `) or
 * NEWLINE (`\n`). In all other cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is whitespace, False otherwise.
 */
declare function isWhitespace(token: any): boolean;
/**
 * Determines whether the specified token is a function.
 *
 * Returns `true` if the input is a token of type FUNCTION.
 * In all other cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is function, False otherwise.
 */
declare function isFunction(token: any): boolean;
/**
 * Returns `true` if the input is a token of type FX_PREFIX (leading `=` in
 * formula). In all other cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is effects prefix, False otherwise.
 */
declare function isFxPrefix(token: any): boolean;
/**
 * Determines whether the specified token is an operator.
 *
 * Returns `true` if the input is a token of type OPERATOR (`+` or `:`). In all
 * other cases `false` is returned.
 *
 * @param {any} token The token
 * @returns {boolean} True if the specified token is operator, False otherwise.
 */
declare function isOperator(token: any): boolean;

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseA1Ref('Sheet1!A$1:$B2');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     top: 0,
 * //     left: 0,
 * //     bottom: 1,
 * //     right: 1
 * //     $top: true,
 * //     $left: false,
 * //     $bottom: false,
 * //     $right: true
 * //   }
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * @param {string} refString  An A1-style reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceA1|null)} An object representing a valid reference or null if it is invalid.
 */
declare function parseA1Ref(refString: string, { allowNamed, allowTernary, xlsx }?: {
    allowNamed?: boolean;
    allowTernary?: boolean;
    xlsx?: boolean;
}): (ReferenceA1 | null);
/**
 * Get an A1-style string representation of a reference object.
 *
 * ```js
 * stringifyA1Ref({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     top: 0,
 *     left: 0,
 *     bottom: 1,
 *     right: 1,
 *     $top: true,
 *     $left: false,
 *     $bottom: false,
 *     $right: true
 *   }
 * });
 * // => 'Sheet1!A$1:$B2'
 * ```
 *
 * @param {ReferenceA1} refObject A reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {string} The reference in A1-style string format
 */
declare function stringifyA1Ref(refObject: ReferenceA1, { xlsx }?: {
    xlsx?: boolean;
}): string;
/**
 * Fill the any missing bounds in range objects. Top will be set to 0, bottom to
 * 1048575, left to 0, and right to 16383, if they are `null` or `undefined`.
 *
 * ```js
 * addA1RangeBounds({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     top: 0,
 *     left: 0,
 *     bottom: 1,
 *     $top: true,
 *     $left: false,
 *     $bottom: false,
 *   }
 * });
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     top: 0,
 * //     left: 0,
 * //     bottom: 1,
 * //     right: 16383,
 * //     $top: true,
 * //     $left: false,
 * //     $bottom: false,
 * //     $right: false
 * //   }
 * // }
 * ```
 *
 * @param {RangeA1} range The range part of a reference object.
 * @returns {RangeA1} same range with missing bounds filled in.
 */
declare function addA1RangeBounds(range: RangeA1): RangeA1;

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseR1C1Ref('Sheet1!R[9]C9:R[9]C9');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     r0: 9,
 * //     c0: 8,
 * //     r1: 9,
 * //     c1: 8,
 * //     $c0: true,
 * //     $c1: true
 * //     $r0: false,
 * //     $r1: false
 * //   }
 * // }
 * ```
 *
 * @param {string} refString An R1C1-style reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceR1C1|null)} An object representing a valid reference or null if it is invalid.
 */
declare function parseR1C1Ref(refString: string, { allowNamed, allowTernary, xlsx }?: {
    allowNamed?: boolean;
    allowTernary?: boolean;
    xlsx?: boolean;
}): (ReferenceR1C1 | null);
/**
 * Get an R1C1-style string representation of a reference object.
 *
 * ```js
 * stringifyR1C1Ref({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     r0: 9,
 *     c0: 8,
 *     r1: 9,
 *     c1: 8,
 *     $c0: true,
 *     $c1: true
 *     $r0: false,
 *     $r1: false
 *   }
 * });
 * // => 'Sheet1!R[9]C9:R[9]C9'
 * ```
 *
 * @param {ReferenceR1C1} refObject A reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {string} The reference in R1C1-style string format
 */
declare function stringifyR1C1Ref(refObject: ReferenceR1C1, { xlsx }?: {
    xlsx?: boolean;
}): string;

/**
 * A dictionary of the types used to identify token variants.
 *
 * @readonly
 * @constant {Object<string>} tokenTypes
 * @property {string} OPERATOR - Newline (`\n`)
 * @property {string} BOOLEAN - Boolean literal (`TRUE`)
 * @property {string} ERROR - Error literal (`#VALUE!`)
 * @property {string} NUMBER - Number literal (`123.4`, `-1.5e+2`)
 * @property {string} FUNCTION - Function name (`SUM`)
 * @property {string} NEWLINE - Newline character (`\n`)
 * @property {string} WHITESPACE - Whitespace character sequence (` `)
 * @property {string} STRING - String literal (`"Lorem ipsum"`)
 * @property {string} CONTEXT - Reference context ([Workbook.xlsx]Sheet1)
 * @property {string} CONTEXT_QUOTE - Quoted reference context (`'[My workbook.xlsx]Sheet1'`)
 * @property {string} REF_RANGE - A range identifier (`A1`)
 * @property {string} REF_BEAM - A range "beam" identifier (`A:A` or `1:1`)
 * @property {string} REF_TERNARY - A ternary range identifier (`B2:B`)
 * @property {string} REF_NAMED - A name / named range identifier (`income`)
 * @property {string} REF_STRUCT - A structured reference identifier (`table[[Column1]:[Column2]]`)
 * @property {string} FX_PREFIX - A leading equals sign at the start of a formula (`=`)
 * @property {string} UNKNOWN - Any unidentifiable range of characters.
 * @see tokenize
 */
declare const tokenTypes: Readonly<{
    OPERATOR: "operator";
    BOOLEAN: "bool";
    ERROR: "error";
    NUMBER: "number";
    FUNCTION: "func";
    NEWLINE: "newline";
    WHITESPACE: "whitespace";
    STRING: "string";
    CONTEXT: "context";
    CONTEXT_QUOTE: "context_quote";
    REF_RANGE: "range";
    REF_BEAM: "range_beam";
    REF_TERNARY: "range_ternary";
    REF_NAMED: "range_named";
    REF_STRUCT: "structured";
    FX_PREFIX: "fx_prefix";
    UNKNOWN: "unknown";
}>;
/**
 * A dictionary of the types used to identify AST node variants.
 *
 * @readonly
 * @constant {Object<string>} nodeTypes
 * @property {string} UNARY - A unary operation (`10%`)
 * @property {string} BINARY - A binary operation (`10+10`)
 * @property {string} REFERENCE - A range identifier (`A1`)
 * @property {string} LITERAL - A literal (number, string, or boolean) (`123`, `"foo"`, `false`)
 * @property {string} ERROR - An error literal (`#VALUE!`)
 * @property {string} CALL - A function call expression (`SUM(1,2)`)
 * @property {string} ARRAY - An array expression (`{1,2;3,4}`)
 * @property {string} IDENTIFIER - A function name identifier (`SUM`)
 * @see parse
 */
declare const nodeTypes: Readonly<{
    UNARY: "UnaryExpression";
    BINARY: "BinaryExpression";
    REFERENCE: "ReferenceIdentifier";
    LITERAL: "Literal";
    ERROR: "ErrorLiteral";
    CALL: "CallExpression";
    ARRAY: "ArrayExpression";
    IDENTIFIER: "Identifier";
}>;

export { MAX_COLS, MAX_ROWS, addA1RangeBounds, addTokenMeta, fixRanges, fromCol, isError, isFunction, isFxPrefix, isLiteral, isOperator, isRange, isReference, isWhitespace, mergeRefTokens, nodeTypes, parse, parseA1Ref, parseR1C1Ref, parseStructRef, stringifyA1Ref, stringifyR1C1Ref, stringifyStructRef, toCol, tokenTypes, tokenize, translateToA1, translateToR1C1 };
