/*
 * Excel formula language parser
 *
 * This parser is a Top-Down Operator Precedence (Pratt) parser. It's based on
 * the one that Douglas Crockford describes in Chapter 9 of the O'Reilly book
 * Beutiful Code (http://crockford.com/javascript/tdop/tdop.html).
 *
 * The parser handles most basic things Excel/Sheets do except:
 *
 * - LAMBDA expressions: =LAMBDA(x, x*x)(2)
 *     https://support.microsoft.com/en-us/office/lambda-function-bd212d27-1cd1-4321-a34a-ccbf254b8b67
 * - LET expressions: LET(x, 5, SUM(x, 1))
 *     https://support.microsoft.com/en-us/office/let-function-34842dd8-b92b-4d3f-b325-b8b8f9908999
 * - Sheet1:Sheet2!A1 references cross contexts (3D references)
 */
import { isReference, isLiteral, isFunction, isWhitespace, isFxPrefix, isOperator, isError } from './isType.js';
import {
  UNARY,
  BINARY,
  REFERENCE,
  LITERAL,
  ERROR_LITERAL,
  CALL,
  ARRAY,
  IDENTIFIER,
  NUMBER,
  BOOLEAN,
  ERROR,
  STRING
} from './constants.js';

import { tokenize } from './lexer.js';

const END = '(END)';
const FUNCTION = '(FUNCTION)';
const WHITESPACE = '(WHITESPACE)';

const refFunctions = [
  'ANCHORARRAY',
  'CHOOSE',
  'DROP',
  'IF',
  'IFS',
  'INDEX',
  'INDIRECT',
  'LAMBDA',
  'LET',
  'OFFSET',
  'REDUCE',
  'SINGLE',
  'SWITCH',
  'TAKE',
  'XLOOKUP'
];

const isReferenceToken = token => {
  const value = (token && token.value) + '';
  if (isReference(token)) { return true; }
  if (isOperator(token) && (value === ':' || value === ',' || !value.trim())) { return true; } // join, union, intersection
  if (isFunction(token) && refFunctions.includes(value.toUpperCase())) { return true; } // intersection
  if (isError(token) && value === '#REF!') { return true; }
  return false;
};

const isReferenceNode = node => {
  return (!!node) && (
    (node.type === REFERENCE) ||
    ((node.type === ERROR_LITERAL || node.type === ERROR) && node.value === '#REF!') ||
    (node.type === BINARY && (
      node.operator === ':' ||
      node.operator === ' ' ||
      node.operator === ',')
    ) ||
    (node.type === CALL && refFunctions.includes(node.callee.name.toUpperCase()))
  );
};

const symbolTable = {};
let currentNode;
let tokens;
let tokenIndex;
let permitArrayRanges = false;
let permitArrayCalls = false;

function halt (message) {
  const err = new Error(message);
  err.source = tokens.map(d => d.value).join('');
  err.sourceOffset = tokens.slice(0, tokenIndex).reduce((a, d) => a + d.value, '').length;
  throw err;
}

// A1 A1 | A1 (A1) | A1 ((A1)) | A1 ( (A1) ) | ...
function refIsUpcoming () {
  let i = tokenIndex;
  let next;
  do {
    next = tokens[++i];
  }
  while (
    next && (
      isWhitespace(next) ||
      (isOperator(next) && next.value === '(')
    )
  );
  return isReferenceToken(next);
}

function advance (expectNext = null, leftNode = null) {
  if (expectNext && expectNext !== currentNode.id) {
    halt(`Expected ${expectNext} but got ${currentNode.id}`);
  }
  // look ahead to see if we have ( ( " ", "(" )+ REF )
  if (isWhitespace(tokens[tokenIndex])) {
    // potential intersection operation
    const possibleWSOp = isReferenceNode(leftNode) && refIsUpcoming();
    if (!possibleWSOp) {
      // ignore whitespace
      while (isWhitespace(tokens[tokenIndex])) {
        tokenIndex++;
      }
    }
  }
  // EOT
  if (tokenIndex >= tokens.length) {
    currentNode = symbolTable[END];
    return;
  }

  const token = tokens[tokenIndex];
  tokenIndex += 1;

  if (token.unterminated) {
    halt('Encountered an unterminated token');
  }

  let node;
  let type = token.type;
  if (isOperator(token)) {
    node = symbolTable[token.value];
    if (!node) {
      halt(`Unknown operator ${token.value}`);
    }
  }
  else if (isWhitespace(token)) {
    node = symbolTable[WHITESPACE];
  }
  else if (isLiteral(token)) {
    node = symbolTable[LITERAL];
  }
  else if (isReference(token)) {
    node = symbolTable[REFERENCE];
    type = REFERENCE;
  }
  else if (isFunction(token)) {
    node = symbolTable[FUNCTION];
  }
  else {
    halt(`Unexpected ${token.type} token: ${token.value}`);
  }

  currentNode = Object.create(node);
  currentNode.type = type;
  currentNode.value = token.value;
  if (token.loc) {
    currentNode.loc = [ ...token.loc ];
  }
  return currentNode;
}

function expression (rbp) {
  let t = currentNode;
  advance(null, t);
  let left = t.nud();
  while (rbp < currentNode.lbp) {
    t = currentNode;
    advance(null, t);
    left = t.led(left);
  }
  return left;
}

const original_symbol = {
  // null denotation
  nud: () => halt('Invalid syntax'), // Undefined
  // left denotation
  led: () => halt('Missing operator')
};

// bp = binding power
function symbol (id, bp = 0) {
  let s = symbolTable[id];
  if (s) {
    if (bp >= s.lbp) {
      s.lbp = bp;
    }
  }
  else {
    s = { ...original_symbol };
    s.id = id;
    s.value = id;
    s.lbp = bp;
    symbolTable[id] = s;
  }
  return s;
}

function infix (id, bp, led) {
  const s = symbol(id, bp);
  s.led = led || function (left) {
    this.type = BINARY;
    this.operator = this.value;
    delete this.value;
    const right = expression(bp);
    this.arguments = [ left, right ];
    if (this.loc) {
      this.loc = [ left.loc[0], right.loc[1] ];
    }
    return this;
  };
  return s;
}

function postfix (id, led) {
  const s = symbol(id, 0);
  s.lbp = 70;
  s.led = led || function (left) {
    this.type = UNARY;
    this.operator = this.value;
    delete this.value;
    this.arguments = [ left ];
    if (this.loc) {
      this.loc[0] = left.loc[0];
    }
    return this;
  };
  return s;
}

function prefix (id, nud) {
  const s = symbol(id);
  s.nud = nud || function () {
    this.type = UNARY;
    this.operator = this.value;
    delete this.value;
    const subexpr = expression(70);
    this.arguments = [ subexpr ];
    if (this.loc) {
      this.loc[1] = subexpr.loc[1];
    }
    return this;
  };
  return s;
}

function rangeInfix (id, bp) {
  return infix(id, bp, function (left) {
    if (!isReferenceNode(left)) {
      halt(`Unexpected ${id} operator`);
    }
    const right = expression(bp);
    if (!isReferenceNode(right, true)) {
      halt(`Unexpected ${currentNode.type} following ${this.id}`);
    }
    this.type = BINARY;
    this.operator = this.value.trim() ? this.value : ' '; // hack around whitespace op
    delete this.value;
    this.arguments = [ left, right ];
    if (this.loc) {
      this.loc = [ left.loc[0], right.loc[1] ];
    }
    return this;
  });
}

symbol(END);

// reference operators
rangeInfix(':', 80); // range join/extend =B7:OFFSET(A1,10,10)
const comma = rangeInfix(',', 80); // union =B7:D7,C6:C8
rangeInfix(WHITESPACE, 80); // intersect: =B7:D7 C6:C8

// Excel's grammar is ambiguous. This turns the , operator's left binding
// power on/off which allows us to treat , as a symbol where we need.
const unionRefs = enable => {
  const currState = comma.lbp > 0;
  if (enable != null) { comma.lbp = enable ? 80 : 0; }
  return currState;
};

// arithmetic and string operations
postfix('%'); // percent
postfix('#', function (left) {
  if (!isReferenceNode(left)) {
    halt('# expects a reference');
  }
  this.type = UNARY;
  this.operator = this.value;
  delete this.value;
  this.arguments = [ left ];
  return this;
}); // range
prefix('+'); // unary plus
prefix('-'); // unary minus
prefix('@'); // implicit intersection (_xlfn.SINGLE)
infix('^', 50); // power
infix('*', 40); // multiply
infix('/', 40); // divide
infix('+', 30); // add
infix('-', 30); // subtract
infix('&', 20); // text concat

// comparison
infix('=', 10);
infix('<', 10);
infix('>', 10);
infix('<=', 10);
infix('>=', 10);
infix('<>', 10);
symbol(LITERAL).nud = function () {
  const { type, value } = this;
  this.type = LITERAL;
  this.raw = value;
  if (type === NUMBER) {
    this.value = +value;
  }
  else if (type === BOOLEAN) {
    this.value = value.toUpperCase() === 'TRUE';
  }
  else if (type === ERROR) {
    this.type = ERROR_LITERAL;
    this.value = value.toUpperCase();
  }
  else if (type === STRING) {
    // FIXME: throw an error if the string is unterminated
    this.value = value.slice(1, -1).replace(/""/g, '"');
  }
  else {
    throw new Error('Unsupported literal type: ' + type);
  }
  return this;
};
symbol(REFERENCE).nud = function () {
  this.type = REFERENCE;
  return this;
};

// parens
symbol(')');
prefix('(', function () {
  const prevState = unionRefs(true);
  const e = expression(0);
  advance(')', e);
  unionRefs(prevState);
  return e;
});

// function call
symbol(FUNCTION).nud = function () {
  return this;
};
infix('(', 90, function (left) {
  if (left.id !== FUNCTION) {
    halt('Cannot call a ' + left.type);
  }
  const args = [];
  let lastWasComma = false;
  if (currentNode.id !== ')') {
    const prevState = unionRefs(false);
    while (currentNode.id !== ')') {
      if (isWhitespace(currentNode)) {
        advance();
      }
      if (currentNode.id === ',') {
        args.push(null);
        lastWasComma = true;
        advance();
      }
      else {
        const arg = expression(0);
        args.push(arg);
        lastWasComma = false;
        if (currentNode.id === ',') {
          advance(',');
          lastWasComma = true;
        }
      }
    }
    unionRefs(prevState);
  }
  if (lastWasComma) {
    args.push(null);
  }
  const closeParen = currentNode;
  delete this.value;
  this.type = CALL;
  this.callee = {
    type: IDENTIFIER,
    name: left.value
  };
  if (left.loc) {
    this.callee.loc = [ ...left.loc ];
  }
  this.arguments = args;
  if (left.loc) {
    this.loc = [ left.loc[0], closeParen.loc[1] ];
  }
  advance(')', this);
  return this;
});

// array literal
symbol('}');
symbol(';');
prefix('{', function () {
  if (currentNode.id === '}') { // arrays must not be empty
    halt('Unexpected empty array');
  }
  let row = [];
  let done = false;
  const rows = [ row ];
  const prevState = unionRefs(false);
  while (!done) {
    if (isWhitespace(currentNode)) {
      advance();
    }
    // arrays allow only literals, ranges (in GSheets) and ,;: operators.
    // FIXME: if { negativeNumbers: false } we must consume minuses as well.
    // Excel allows ={-1} but not ={(-1)} and ={1%}
    if (isLiteral(currentNode)) {
      row.push(symbolTable[LITERAL].nud.call(currentNode));
      advance();
    }
    else if (permitArrayRanges && isReferenceNode(currentNode)) {
      row.push(symbolTable[REFERENCE].nud.call(currentNode));
      advance();
    }
    else if (permitArrayCalls && isFunction(currentNode)) {
      const arg = expression(0);
      row.push(arg);
      // FIXME: need to skip WS here?
    }
    else {
      halt(`Unexpected ${currentNode.type} in array: ${currentNode.value}`);
    }
    if (currentNode.id === ',') {
      // next item
      advance(',');
    }
    else if (currentNode.id === ';') {
      // next row
      advance(';');
      row = [];
      rows.push(row);
    }
    else {
      done = true;
    }
  }
  const closingBrace = currentNode;
  advance('}');
  unionRefs(prevState);
  this.type = ARRAY;
  this.elements = rows;
  if (this.loc) {
    this.loc[1] = closingBrace.loc[1];
  }
  delete this.value;
  return this;
});

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
 * @param {(string | Array<Object>)} formula An Excel formula string (an Excel expression) or an array of tokens.
 * @param {Object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.negativeNumbers=true]  Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).
 * @param {boolean} [options.permitArrayRanges=false]  Ranges are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.
 * @param {boolean} [options.permitArrayCalls=false]  Function calls are allowed as elements of arrays. This is a feature in Google Sheets while Excel does not allow it.
 * @param {boolean} [options.r1c1=false]  Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
 * @param {boolean} [options.withLocation=false]  Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @return {Object} An AST of nodes
 */
export function parse (source, options) {
  if (typeof source === 'string') {
    tokens = tokenize(source, {
      withLocation: true,
      ...options,
      mergeRefs: true
    });
  }
  else if (Array.isArray(source)) {
    tokens = source;
  }
  else {
    throw new Error('Parse requires a string or array of tokens.');
  }
  // allow ranges in array "literals"?
  permitArrayRanges = options?.permitArrayRanges;
  // allow calls in arrays "literals"?
  permitArrayCalls = options?.permitArrayCalls;
  // set index to start
  tokenIndex = 0;
  // discard redundant whitespace and = prefix
  while (isWhitespace(tokens[tokenIndex]) || isFxPrefix(tokens[tokenIndex])) {
    tokenIndex++;
  }
  advance();
  unionRefs(true);
  const root = expression(0);
  advance(END);
  return root;
}
