/**
 * @typedef {number[]} SourceLocation
 */

/**
 * @typedef {Node} Identifier
 * @property {"Identifier"} type
 * @property {SourceLocation} [loc]
 * @property {string} name
 */

/**
 * @typedef {Node} ReferenceIdentifier
 * @property {"ReferenceIdentifier"} type
 * @property {SourceLocation} [loc]
 * @property {string} value
 * @property {"name" | "range" | "beam" | "table"} kind
 */

/**
 * @typedef {Node} Literal
 * @property {"Literal"} type
 * @property {SourceLocation} [loc]
 * @property {string} raw
 * @property {string | number | boolean} value
 */

/**
 * @typedef {Node} ErrorLiteral
 * @property {"ErrorLiteral"} type
 * @property {SourceLocation} [loc]
 * @property {string} raw
 * @property {string} value
 */

/**
 * @typedef {Node} UnaryExpression
 * @property {"UnaryExpression"} type
 * @property {SourceLocation} [loc]
 * @property {"+" | "-" | "%" | "#" | "@"} operator
 * @property {AstExpression[]} arguments
 */

/**
 * @typedef {Node} BinaryExpression
 * @property {"BinaryExpression"} type
 * @property {SourceLocation} [loc]
 * @property {"=" | "<" | ">" | "<=" | ">=" | "<>" | "-" | "+" | "*" | "/" | "^" | ":" | " " | "," | "&"} operator
 * @property {AstExpression[]} arguments
 */

/**
 * @typedef {Node} CallExpression
 * @property {"CallExpression"} type
 * @property {SourceLocation} [loc]
 * @property {Identifier} callee
 * @property {AstExpression[]} arguments
 */

// FIXME: the awkward naming is because tooling fails, fix tooling :)
/**
 * @typedef {Node} MatrixExpression
 * @property {"ArrayExpression"} type
 * @property {SourceLocation} [loc]
 * @property {Array<Array<ReferenceIdentifier | Literal | ErrorLiteral | CallExpression>>} arguments
 */

/**
 * @typedef {Node} LambdaExpression
 * @property {"LambdaExpression"} type
 * @property {SourceLocation} [loc]
 * @property {Identifier[]} params
 * @property {null | AstExpression} body
 */

/**
 * @typedef {Node} LetExpression
 * @property {"LetExpression"} type
 * @property {SourceLocation} [loc]
 * @property {LetDeclarator[]} declarations
 * @property {null | AstExpression} body
 */

/**
 * @typedef {Node} LetDeclarator
 * @property {"LetDeclarator"} type
 * @property {SourceLocation} [loc]
 * @property {Identifier} id
 * @property {null | AstExpression} init
 */

/**
 * @typedef {ReferenceIdentifier | Literal | ErrorLiteral | UnaryExpression | BinaryExpression | CallExpression | MatrixExpression | LambdaExpression | LetExpression} AstExpression
 */
