/**
 * Fill the any missing bounds in range objects. Top will be set to 0, bottom to
 * 1048575, left to 0, and right to 16383, if they are `null` or `undefined`.
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
 * @param range The range part of a reference object.
 * @returns same range with missing bounds filled in.
 */
export declare function addA1RangeBounds(range: RangeA1): RangeA1;

/**
 * Runs through a list of tokens and adds extra attributes such as matching
 * parens and ranges.
 * The `context` parameter defines default reference attributes:
 * `{ workbookName: 'report.xlsx', sheetName: 'Sheet1' }`.
 * If supplied, these are used to match `A1` to `Sheet1!A1`.
 * All tokens will be tagged with a `.depth` number value to indicating the
 * level of nesting in parentheses as well as an `.index` number indicating
 * their zero based position in the list.
 * The returned output will be the same array of tokens but the following
 * properties will added to tokens (as applicable):
 * #### Parentheses ( )
 * Matching parens will be tagged with `.groupId` string identifier as well as
 * a `.depth` number value (indicating the level of nesting).
 * Closing parens without a counterpart will be tagged with `.error`
 * (boolean true).
 * #### Curly brackets { }
 * Matching curly brackets will be tagged with `.groupId` string identifier.
 * These may not be nested in Excel.
 * Closing curly brackets without a counterpart will be tagged with `.error`
 * (boolean `true`).
 * #### Ranges (`REF_RANGE` or `REF_BEAM` type tokens)
 * All ranges will be tagged with `.groupId` string identifier regardless of
 * the number of times they occur.
 * #### Tokens of type `UNKNOWN`
 * All will be tagged with `.error` (boolean `true`).
 *
 * @param tokenlist An array of tokens (from `tokenize()`)
 * @param [context={}] A contest used to match `A1` to `Sheet1!A1`.
 * @param [context.sheetName=''] An implied sheet name ('Sheet1')
 * @param [context.workbookName=''] An implied workbook name ('report.xlsx')
 * @returns The input array with the enchanced tokens
 */
export declare function addTokenMeta(tokenlist: Array<Token>, context?: {
    /** An implied sheet name ('Sheet1') */
    sheetName?: string;
    /** An implied workbook name ('report.xlsx') */
    workbookName?: string;
}): Array<TokenEnhanced>;

/**
 * Normalizes A1 style ranges and structured references in a formula or list of
 * tokens.
 * It ensures that that the top and left coordinates of an A1 range are on the
 * left-hand side of a colon operator:
 * `B2:A1` → `A1:B2`  
 * `1:A1` → `A1:1`  
 * `A:A1` → `A1:A`  
 * `B:A` → `A:B`  
 * `2:1` → `1:2`  
 * `A1:A1` → `A1`  
 * When `{ addBounds: true }` is passed as an option, the missing bounds are
 * also added. This can be done to ensure Excel compatible ranges. The fixes
 * then additionally include:
 * `1:A1` → `A1:1` → `1:1`  
 * `A:A1` → `A1:A` → `A:A`  
 * `A1:A` → `A:A`  
 * `A1:1` → `A:1`  
 * `B2:B` → `B2:1048576`  
 * `B2:2` → `B2:XFD2`  
 * Structured ranges are normalized cleaned up to have consistent order and
 * capitalization of sections as well as removing redundant ones.
 * Returns the same formula with the ranges updated. If an array of tokens was
 * supplied, then a new array is returned.
 *
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param [options={}] Options
 * @param [options.addBounds=false] Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383.
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns A formula string or token list (depending on which was input)
 */
export declare function fixRanges(formula: (string | Array<Token>), options?: {
    /** Fill in any undefined bounds of range objects. Top to 0, bottom to 1048575, left to 0, and right to 16383. */
    addBounds?: boolean;
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): (string | Array<Token>);

/**
 * Convert a column string representation to a 0 based
 * offset number (`"C"` = `2`).
 * The method expects a valid column identifier made up of _only_
 * A-Z letters, which may be either upper or lower case. Other input will
 * return garbage.
 *
 * @param columnString The column string identifier
 * @returns Zero based column index number
 */
export declare function fromCol(columnString: string): number;

/**
 * Determines whether the specified token is an error.
 * Returns `true` if the input is a token of type ERROR (`#VALUE!`). In all
 * other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is error, False otherwise.
 */
export declare function isError(token: any): boolean;

/**
 * Determines whether the specified token is a function.
 * Returns `true` if the input is a token of type FUNCTION.
 * In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is function, False otherwise.
 */
export declare function isFunction(token: any): boolean;

/**
 * Returns `true` if the input is a token of type FX_PREFIX (leading `=` in
 * formula). In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is effects prefix, False otherwise.
 */
export declare function isFxPrefix(token: any): boolean;

/**
 * Determines whether the specified token is a literal.
 * Returns `true` if the input is a token of type BOOLEAN (`TRUE` or `FALSE`),
 * ERROR (`#VALUE!`), NUMBER (123.4), or STRING (`"lorem ipsum"`). In all other
 * cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is literal, False otherwise.
 */
export declare function isLiteral(token: any): boolean;

/**
 * Determines whether the specified token is an operator.
 * Returns `true` if the input is a token of type OPERATOR (`+` or `:`). In all
 * other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is operator, False otherwise.
 */
export declare function isOperator(token: any): boolean;

/**
 * Determines whether the specified token is a range.
 * Returns `true` if the input is a token that has a type of either REF_RANGE
 * (`A1` or `A1:B2`), REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), or
 * REF_BEAM (`A:A` or `1:1`). In all other cases `false` is returned.
 *
 * @param token A token
 * @returns True if the specified token is range, False otherwise.
 */
export declare function isRange(token: any): boolean;

/**
 * Determines whether the specified token is a reference.
 * Returns `true` if the input is a token of type REF_RANGE (`A1` or `A1:B2`),
 * REF_TERNARY (`A1:A`, `A1:1`, `1:A1`, or `A:A1`), REF_BEAM (`A:A` or `1:1`),
 * or REF_NAMED (`myrange`). In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is reference, False otherwise.
 */
export declare function isReference(token: any): boolean;

/**
 * Determines whether the specified token is whitespace.
 * Returns `true` if the input is a token of type WHITESPACE (` `) or
 * NEWLINE (`\n`). In all other cases `false` is returned.
 *
 * @param token The token
 * @returns True if the specified token is whitespace, False otherwise.
 */
export declare function isWhitespace(token: any): boolean;

/**
 * Merges context with reference tokens as possible in a list of tokens.
 * When given a tokenlist, this function returns a new list with ranges returned
 * as whole references (`Sheet1!A1:B2`) rather than separate tokens for each
 * part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 *
 * @param tokenlist An array of tokens (from `tokenize()`)
 * @returns A new list of tokens with range parts merged.
 */
export declare function mergeRefTokens(tokenlist: Array<Token>): Array<Token>;

/**
 * Parses a string formula or list of tokens into an AST.
 * The parser requires `mergeRefs` to have been `true` in tokenlist options,
 * because it does not recognize reference context tokens.
 * The AST Abstract Syntax Tree's format is documented in
 * [AST_format.md](./AST_format.md)
 *
 * @param formula An Excel formula string (an Excel expression) or an array of tokens.
 * @param [options={}] Options
 * @param [options.allowNamed=true] Enable parsing names as well as ranges.
 * @param [options.allowTernary=false] Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.negativeNumbers=true] Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).
 * @param [options.permitArrayCalls=false] Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.
 * @param [options.permitArrayRanges=false] Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.
 * @param [options.r1c1=false] Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
 * @param [options.withLocation=false] Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An AST of nodes
 */
export declare function parse(formula: (string | Array<Token>), options?: {
    /** Enable parsing names as well as ranges. */
    allowNamed?: boolean;
    /** Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. */
    allowTernary?: boolean;
    /** Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree). */
    negativeNumbers?: boolean;
    /** Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it. */
    permitArrayCalls?: boolean;
    /** Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it. */
    permitArrayRanges?: boolean;
    /** Ranges are expected to be in the R1C1 style format rather than the more popular A1 style. */
    r1c1?: boolean;
    /** Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }` */
    withLocation?: boolean;
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): object;

/**
 * Parse a string reference into an object representing it.
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
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * @param refString An A1-style reference string
 * @param [options={}] Options
 * @param [options.allowNamed=true] Enable parsing names as well as ranges.
 * @param [options.allowTernary=false] Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An object representing a valid reference or null if it is invalid.
 */
export declare function parseA1Ref(refString: string, options?: {
    /** Enable parsing names as well as ranges. */
    allowNamed?: boolean;
    /** Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. */
    allowTernary?: boolean;
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): (ReferenceA1 | null);

/**
 * Parse a string reference into an object representing it.
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
 * @param refString An R1C1-style reference string
 * @param [options={}] Options
 * @param [options.allowNamed=true] Enable parsing names as well as ranges.
 * @param [options.allowTernary=false] Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An object representing a valid reference or null if it is invalid.
 */
export declare function parseR1C1Ref(refString: string, options?: {
    /** Enable parsing names as well as ranges. */
    allowNamed?: boolean;
    /** Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. */
    allowTernary?: boolean;
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): (ReferenceR1C1 | null);

/**
 * Parse a structured reference string into an object representing it.
 * ```js
 * parseStructRef('workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]');
 * // => {
 * //   context: [ 'workbook.xlsx' ],
 * //   sections: [ 'data' ],
 * //   columns: [ 'my column', '@foo' ],
 * //   table: 'tableName',
 * // }
 * ```
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * @param ref A structured reference string
 * @param [options={}] Options
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An object representing a valid reference or null if it is invalid.
 */
export declare function parseStructRef(ref: string, options?: {
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): (ReferenceStruct | null);

/**
 * Get an A1-style string representation of a reference object.
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
 * @param refObject A reference object
 * @param [options={}] Options
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns The reference in A1-style string format
 */
export declare function stringifyA1Ref(refObject: ReferenceA1, options?: {
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): string;

/**
 * Get an R1C1-style string representation of a reference object.
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
 * @param refObject A reference object
 * @param [options={}] Options
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns The reference in R1C1-style string format
 */
export declare function stringifyR1C1Ref(refObject: ReferenceR1C1, options?: {
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): string;

/**
 * Get a string representation of a structured reference object.
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
 * @param refObject A structured reference object
 * @param [options={}] Options
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns The structured reference in string format
 */
export declare function stringifyStructRef(refObject: ReferenceStruct, options?: {
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): string;

/**
 * Convert a 0 based offset number to a column string
 * representation (`2` = `"C"`).
 * The method expects a number between 0 and 16383. Other input will
 * return garbage.
 *
 * @param columnIndex Zero based column index number
 * @returns The column string identifier
 */
export declare function toCol(columnIndex: number): string;

/**
 * Breaks a string formula into a list of tokens.
 * The returned output will be an array of objects representing the tokens:
 * ```js
 * [
 *   { type: FX_PREFIX, value: '=' },
 *   { type: FUNCTION, value: 'SUM' },
 *   { type: OPERATOR, value: '(' },
 *   { type: REF_RANGE, value: 'A1:B2' },
 *   { type: OPERATOR, value: ')' }
 * ]
 * ```
 * Token types may be found as an Object as the
 * [`tokenTypes` export]{@link tokenTypes} on the package
 * (`import {tokenTypes} from '@borgar/fx';`).
 * To support syntax highlighting as you type, `STRING` tokens are allowed to be
 * "unterminated". For example, the incomplete formula `="Hello world` would be
 * tokenized as:
 * ```js
 * [
 *   { type: FX_PREFIX, value: '=' },
 *   { type: STRING, value: '"Hello world', unterminated: true },
 * ]
 * ```
 *
 * @param formula An Excel formula string (an Excel expression) or an array of tokens.
 * @param [options={}] Options
 * @param [options.allowTernary=false] Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.mergeRefs=true] Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens)
 * @param [options.negativeNumbers=true] Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).
 * @param [options.r1c1=false] Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
 * @param [options.withLocation=true] Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
 * @param [options.xlsx=false] Enables a `[1]Sheet1!A1` or `[1]!name` syntax form for external workbooks found only in XLSX files.
 * @returns An AST of nodes
 */
export declare function tokenize(formula: string, options?: {
    /** Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. */
    allowTernary?: boolean;
    /** Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens) */
    mergeRefs?: boolean;
    /** Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree). */
    negativeNumbers?: boolean;
    /** Ranges are expected to be in the R1C1 style format rather than the more popular A1 style. */
    r1c1?: boolean;
    /** Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }` */
    withLocation?: boolean;
    /** Enables a `[1]Sheet1!A1` or `[1]!name` syntax form for external workbooks found only in XLSX files. */
    xlsx?: boolean;
}): Array<Token>;

/**
 * Translates ranges in a formula or list of tokens from relative R1C1 syntax to
 * absolute A1 syntax.
 * Returns the same formula with the ranges translated. If an array of tokens
 * was supplied, then the same array is returned.
 * ```js
 * translateToA1("=SUM(RC[1],R2C5,Sheet!R3C5)", "D10");
 * // => "=SUM(E10,$E$2,Sheet!$E$3)");
 * ```
 * If an input range is -1,-1 relative rows/columns and the anchor is A1, the
 * resulting range will (by default) wrap around to the bottom of the sheet
 * resulting in the range XFD1048576. This may not be what you want so may set
 * `wrapEdges` to false which will instead turn the range into a `#REF!` error.
 * ```js
 * translateToA1("=R[-1]C[-1]", "A1");
 * // => "=XFD1048576");
 * translateToA1("=R[-1]C[-1]", "A1", { wrapEdges: false });
 * // => "=#REF!");
 * ```
 * Note that if you are passing in a list of tokens that was not created using
 * `mergeRefs` and you disable edge wrapping (or you simply set both options
 * to false), you can end up with a formula such as `=#REF!:B2` or
 * `=Sheet3!#REF!:F3`. These are valid formulas in the Excel formula language
 * and Excel will accept them, but they are not supported in Google Sheets.
 *
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param [options={}] The options
 * @param [options.allowTernary=true] Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.mergeRefs=true] Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 * @param [options.wrapEdges=true] Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns A formula string or token list (depending on which was input)
 */
export declare function translateToA1(formula: (string | Array<Token>), anchorCell: string, options?: {
    /** Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. */
    allowTernary?: boolean;
    /** Should ranges be treated as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). */
    mergeRefs?: boolean;
    /** Wrap out-of-bounds ranges around sheet edges rather than turning them to #REF! errors */
    wrapEdges?: boolean;
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): (string | Array<Token>);

/**
 * Translates ranges in a formula or list of tokens from absolute A1 syntax to
 * relative R1C1 syntax.
 * Returns the same formula with the ranges translated. If an array of tokens
 * was supplied, then the same array is returned.
 * ```js
 * translateToR1C1("=SUM(E10,$E$2,Sheet!$E$3)", "D10");
 * // => "=SUM(RC[1],R2C5,Sheet!R3C5)");
 * ```
 *
 * @param formula A string (an Excel formula) or a token list that should be adjusted.
 * @param anchorCell A simple string reference to an A1 cell ID (`AF123` or`$C$5`).
 * @param [options={}] The options
 * @param [options.allowTernary=true] Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.xlsx=false] Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns A formula string or token list (depending on which was input)
 */
export declare function translateToR1C1(formula: (string | Array<Token>), anchorCell: string, options?: {
    /** Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md. */
    allowTernary?: boolean;
    /** Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md) */
    xlsx?: boolean;
}): (string | Array<Token>);

/** A dictionary of the types used to identify AST node variants. */
export declare const nodeTypes: Readonly<{
    /** An array expression (`{1,2;3,4}`) */
    ARRAY: string;
    /** A binary operation (`10+10`) */
    BINARY: string;
    /** A function call expression (`SUM(1,2)`) */
    CALL: string;
    /** An error literal (`#VALUE!`) */
    ERROR: string;
    /** A function name identifier (`SUM`) */
    IDENTIFIER: string;
    /** A literal (number, string, or boolean) (`123`, `"foo"`, `false`) */
    LITERAL: string;
    /** A range identifier (`A1`) */
    REFERENCE: string;
    /** A unary operation (`10%`) */
    UNARY: string;
}>;

/** A dictionary of the types used to identify token variants. */
export declare const tokenTypes: Readonly<{
    /** Boolean literal (`TRUE`) */
    BOOLEAN: string;
    /** Reference context ([Workbook.xlsx]Sheet1) */
    CONTEXT: string;
    /** Quoted reference context (`'[My workbook.xlsx]Sheet1'`) */
    CONTEXT_QUOTE: string;
    /** Error literal (`#VALUE!`) */
    ERROR: string;
    /** Function name (`SUM`) */
    FUNCTION: string;
    /** A leading equals sign at the start of a formula (`=`) */
    FX_PREFIX: string;
    /** Newline character (`\n`) */
    NEWLINE: string;
    /** Number literal (`123.4`, `-1.5e+2`) */
    NUMBER: string;
    /** Newline (`\n`) */
    OPERATOR: string;
    /** A range "beam" identifier (`A:A` or `1:1`) */
    REF_BEAM: string;
    /** A name / named range identifier (`income`) */
    REF_NAMED: string;
    /** A range identifier (`A1`) */
    REF_RANGE: string;
    /** A structured reference identifier (`table[[Column1]:[Column2]]`) */
    REF_STRUCT: string;
    /** A ternary range identifier (`B2:B`) */
    REF_TERNARY: string;
    /** String literal (`"Lorem ipsum"`) */
    STRING: string;
    /** Any unidentifiable range of characters. */
    UNKNOWN: string;
    /** Whitespace character sequence (` `) */
    WHITESPACE: string;
}>;

/** A range in A1 style coordinates. */
export declare type RangeA1 = {
    /** Signifies that bottom is a "locked" value */
    $bottom?: (boolean | null);
    /** Signifies that left is a "locked" value */
    $left?: (boolean | null);
    /** Signifies that right is a "locked" value */
    $right?: (boolean | null);
    /** Signifies that top is a "locked" value */
    $top?: (boolean | null);
    /** Bottom row of the range */
    bottom?: (number | null);
    /** Left column of the range */
    left?: (number | null);
    /** Right column of the range */
    right?: (number | null);
    /** Top row of the range */
    top?: (number | null);
};

/** A range in R1C1 style coordinates. */
export declare type RangeR1C1 = {
    /** Signifies that c0 is an absolute value */
    $c0?: (boolean | null);
    /** Signifies that c1 is an absolute value */
    $c1?: (boolean | null);
    /** Signifies that r0 is an absolute value */
    $r0?: (boolean | null);
    /** Signifies that r1 is an absolute value */
    $r1?: (boolean | null);
    /** Left column of the range */
    c0?: (number | null);
    /** Right column of the range */
    c1?: (number | null);
    /** Top row of the range */
    r0?: (number | null);
    /** Bottom row of the range */
    r1?: (number | null);
};

/**
 * A reference containing an A1 style range. See [Prefixes.md] for
 *   documentation on how scopes work in Fx.
 */
export declare type ReferenceA1 = {
    /** A collection of scopes for the reference */
    context?: Array<string>;
    /** The reference's range */
    range?: RangeA1;
    /** A context sheet scope */
    sheetName?: string;
    /** A context workbook scope */
    workbookName?: string;
};

/**
 * A reference containing a R1C1 style range. See [Prefixes.md] for
 *   documentation on how scopes work in Fx.
 */
export declare type ReferenceR1C1 = {
    /** A collection of scopes for the reference */
    context?: Array<string>;
    /** The reference's range */
    range?: RangeR1C1;
    /** A context sheet scope */
    sheetName?: string;
    /** A context workbook scope */
    workbookName?: string;
};

/**
 * A reference containing a table slice definition. See [Prefixes.md] for
 *   documentation on how scopes work in Fx.
 */
export declare type ReferenceStruct = {
    /** The sections this reference targets */
    columns?: Array<string>;
    /** A collection of scopes for the reference */
    context?: Array<string>;
    /** The sections this reference targets */
    sections?: Array<string>;
    /** A context sheet scope */
    sheetName?: string;
    /** The table this reference targets */
    table?: string;
    /** A context workbook scope */
    workbookName?: string;
};

/** A formula language token. */
export declare type Token = Record<string,any> & {
    /** Source position offsets to the token */
    loc?: Array<number>;
    /** The type of the token */
    type: string;
    /** Signifies an unterminated string token */
    unterminated?: boolean;
    /** The value of the token */
    value: string;
};

/** A token with extra meta data. */
export declare type TokenEnhanced = Token & {
    /** This token's level of nesting inside parentheses */
    depth?: number;
    /** Token is of unknown type or a paren without a match */
    error?: boolean;
    /** The ID of a group which this token belongs (e.g. matching parens) */
    groupId?: string;
    /** A zero based position in a token list */
    index: number;
};

