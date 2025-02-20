/**
 * @typedef {object} Token A formula language token.
 * @augments Record<string,any>
 * @property {string} type The type of the token
 * @property {string} value The value of the token
 * @property {boolean} [unterminated] Signifies an unterminated string token
 * @property {Array<number>} [loc] Source position offsets to the token
 */

/**
 * @typedef {object} TokenEnhanced A token with extra meta data.
 * @augments Token
 * @property {number} index A zero based position in a token list
 * @property {string} [groupId] The ID of a group which this token belongs (e.g. matching parens)
 * @property {number} [depth] This token's level of nesting inside parentheses
 * @property {boolean} [error] Token is of unknown type or a paren without a match
 */

/**
 * @typedef {Record<string, any>} RangeR1C1 A range in R1C1 style coordinates.
 * @property {number | null} [r0] Top row of the range
 * @property {number | null} [r1] Bottom row of the range
 * @property {number | null} [c0] Left column of the range
 * @property {number | null} [c1] Right column of the range
 * @property {boolean | null} [$r0] Signifies that r0 is an absolute value
 * @property {boolean | null} [$r1] Signifies that r1 is an absolute value
 * @property {boolean | null} [$c0] Signifies that c0 is an absolute value
 * @property {boolean | null} [$c1] Signifies that c1 is an absolute value
 */

/**
 * @typedef {Record<string, any>} RangeA1 A range in A1 style coordinates.
 * @property {number | null} [top] Top row of the range
 * @property {number | null} [bottom] Bottom row of the range
 * @property {number | null} [left] Left column of the range
 * @property {number | null} [right] Right column of the range
 * @property {boolean | null} [$top] Signifies that top is a "locked" value
 * @property {boolean | null} [$bottom] Signifies that bottom is a "locked" value
 * @property {boolean | null} [$left] Signifies that left is a "locked" value
 * @property {boolean | null} [$right] Signifies that right is a "locked" value
 * @property {boolean | null} [trimTL] Empty rows/cols at the top/left should be discarded when range is read
 * @property {boolean | null} [trimBR] Empty rows/cols at the bottom/right should be discarded when range is read
 */

/**
 * @typedef {Record<string, any>} ReferenceA1
 *   A reference containing an A1 style range. See [Prefixes.md] for
 *   documentation on how scopes work in Fx.
 * @property {Array<string>} [context] A collection of scopes for the reference
 * @property {string} [workbookName] A context workbook scope
 * @property {string} [sheetName] A context sheet scope
 * @property {RangeA1} [range] The reference's range
 */

/**
 * @typedef {Record<string, any>} ReferenceR1C1
 *   A reference containing a R1C1 style range. See [Prefixes.md] for
 *   documentation on how scopes work in Fx.
 * @property {Array<string>} [context] A collection of scopes for the reference
 * @property {string} [workbookName] A context workbook scope
 * @property {string} [sheetName] A context sheet scope
 * @property {RangeR1C1} [range] The reference's range
 */

/**
 * @typedef {Record<string, any>} ReferenceStruct
 *   A reference containing a table slice definition. See [Prefixes.md] for
 *   documentation on how scopes work in Fx.
 * @property {Array<string>} [context] A collection of scopes for the reference
 * @property {string} [workbookName] A context workbook scope
 * @property {string} [sheetName] A context sheet scope
 * @property {Array<string>} [sections] The sections this reference targets
 * @property {Array<string>} [columns] The sections this reference targets
 * @property {string} [table] The table this reference targets
 */
