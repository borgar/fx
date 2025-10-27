/*
 * Excel formula language parser
 *
 * This parser is a Top-Down Operator Precedence (Pratt) parser. It's based on
 * the one that Douglas Crockford describes in Chapter 9 of the O'Reilly book
 * Beutiful Code (http://crockford.com/javascript/tdop/tdop.html).
 *
 * The parser handles most basic things Excel/Sheets do except:
 * `Sheet1:Sheet2!A1` references cross contexts (3D references)
 */
import {
  isReference,
  isLiteral,
  isFunction,
  isWhitespace,
  isFxPrefix,
  isOperator,
  isError
} from './isType.js';
import {
  UNARY,
  BINARY,
  REFERENCE,
  LITERAL,
  ERROR_LITERAL,
  CALL,
  LAMBDA,
  ARRAY,
  IDENTIFIER,
  NUMBER,
  BOOLEAN,
  ERROR,
  STRING,
  LET,
  LET_DECL,
  REF_NAMED,
  REF_STRUCT,
  REF_BEAM
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
  'TRIMRANGE',
  'XLOOKUP'
];

const symbolTable = {};
let currentNode;
let tokens;
let tokenIndex;
let permitArrayRanges = false;
let permitArrayCalls = false;
let looseRefCalls = false;

const isReferenceFunctionName = fnName => {
  return looseRefCalls || refFunctions.includes(fnName.toUpperCase());
};

const isReferenceToken = (token, allowOperators = false) => {
  const value = (token && token.value) + '';
  if (isReference(token)) {
    return true;
  }
  if (allowOperators && isOperator(token) && (value === ':' || value === ',' || !value.trim())) {
    return true; // join, union, intersection
  }
  if (isFunction(token) && isReferenceFunctionName(value)) {
    return true; // function that yields reference
  }
  if (isError(token) && value === '#REF!') {
    return true;
  }
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
    isReference(node) ||
    (node.type === CALL && isReferenceFunctionName(node.callee.name))
  );
};

function halt (message, atIndex = null) {
  const err = new Error(message);
  err.source = tokens.map(d => d.value).join('');
  err.sourceOffset = tokens
    .slice(0, atIndex ?? tokenIndex)
    .reduce((a, d) => a + d.value.length, 0);
  throw err;
}

// A1 A1 | A1 (A1) | A1 ((A1)) | A1 ( (A1) ) | ...
function refIsUpcoming (allowOperators = false) {
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
  return isReferenceToken(next, allowOperators);
}

function advance (expectNext = null, leftNode = null) {
  if (expectNext && expectNext !== currentNode.id) {
    halt(`Expected ${expectNext} but got ${currentNode.id}`);
  }
  // look ahead to see if we have ( ( " ", "(" )+ REF )
  if (isWhitespace(tokens[tokenIndex])) {
    // potential intersection operation (so don't allow operators as upcoming)
    const haveRef = isReferenceNode(leftNode);
    const possibleWSOp = haveRef && refIsUpcoming(false);
    const nextIsCall = haveRef && tokens[tokenIndex + 1] && tokens[tokenIndex + 1].value === '(';
    if (!possibleWSOp && !nextIsCall) {
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
  }
  else if (isFunction(token)) {
    node = symbolTable[FUNCTION];
  }
  else {
    halt(`Unexpected ${token.type} token: ${token.value}`);
  }

  currentNode = Object.create(node);
  currentNode.type = token.type;
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
postfix('#', function (left) { // spilled range (_xlfn.ANCHORARRAY)
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
  if (this.type === REF_NAMED) {
    this.kind = 'name';
  }
  else if (this.type === REF_STRUCT) {
    this.kind = 'table'; // structured ?
  }
  else if (this.type === REF_BEAM) {
    this.kind = 'beam';
  }
  else {
    this.kind = 'range';
  }
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
  let callee = {
    type: IDENTIFIER,
    name: left.value
  };
  if (left.id !== FUNCTION) {
    if (
      left.type === LAMBDA ||
      // Excel only allows calls to "names" and ref functions. Since we don't
      // differentiate between the two (this requires a table of function names)
      // we're overly permissive here:
      left.type === CALL ||
      left.type === LET ||
      left.type === REFERENCE ||
      (left.type === UNARY && left.value === '#') || // Because it's really SINGLE(...)()
      (left.type === ERROR_LITERAL && left.value === '#REF!')
    ) {
      // in the case of REFERENCE, do we want to set the node to Identifier?
      callee = left;
    }
    else {
      halt('Unexpected call', tokenIndex - 1);
    }
  }
  const lcFn = left.value.toLowerCase();
  if (lcFn === 'lambda') {
    return parseLambda.call(this, left);
  }
  if (lcFn === 'let') {
    return parseLet.call(this, left);
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
  this.callee = callee;
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

function parseLambda (left) {
  const args = [];
  const argNames = {};
  let body;
  let done = false;
  const prevState = unionRefs(false);
  if (currentNode.id !== ')') {
    while (!done) {
      if (isWhitespace(currentNode)) {
        advance();
      }
      const argTokenIndex = tokenIndex;
      const arg = expression(0);
      if (currentNode.id === ',') {
        // all but last args must be names
        if (arg.type === REFERENCE && arg.kind === 'name') {
          // names may not be duplicates
          const currName = arg.value.toLowerCase();
          if (currName in argNames) {
            halt('Duplicate name: ' + arg.value);
          }
          argNames[currName] = 1;
          const a = { type: IDENTIFIER, name: arg.value };
          if (arg.loc) { a.loc = arg.loc; }
          args.push(a);
        }
        else {
          tokenIndex = argTokenIndex;
          halt('LAMBDA argument is not a name');
        }
        advance(',');
      }
      else {
        body = arg;
        done = true;
      }
    }
  }
  unionRefs(prevState);
  delete this.value;
  this.type = LAMBDA;
  this.params = args;
  this.body = body || null;
  if (left.loc) {
    this.loc = [ left.loc[0], currentNode.loc[1] ];
  }
  advance(')', this);
  return this;
}

function parseLet (left) {
  const args = [];
  const vals = [];
  const argNames = {};
  let body;
  let argCounter = 0;
  const addArgument = (arg, lastArg) => {
    if (body) {
      halt('Unexpected argument following calculation');
    }
    if (lastArg && argCounter >= 2) {
      body = arg;
    }
    else {
      const wantName = !(argCounter % 2);
      if (wantName) {
        if (arg && (arg.type === REFERENCE && arg.kind === 'name')) {
          // names may not be duplicates
          const currName = arg.value.toLowerCase();
          if (currName in argNames) {
            halt('Duplicate name: ' + arg.value);
          }
          argNames[currName] = 1;
          args.push({ type: IDENTIFIER, name: arg.value, loc: arg.loc });
        }
        else if (argCounter >= 2) {
          body = arg;
        }
        else {
          halt('Argument is not a name');
        }
      }
      else {
        vals.push(arg);
      }
    }
    argCounter++;
  };
  const prevState = unionRefs(false);
  let lastWasComma = false;
  if (currentNode.id !== ')') {
    while (currentNode.id !== ')') {
      if (isWhitespace(currentNode)) {
        advance();
      }
      if (currentNode.id === ',') {
        addArgument(null);
        lastWasComma = true;
        advance();
      }
      else {
        const arg = expression(0);
        addArgument(arg, currentNode.id !== ',');
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
    addArgument(null, true);
  }
  if (body === undefined) {
    halt('Unexpected end of arguments');
  }
  unionRefs(prevState);
  delete this.value;
  this.type = LET;
  this.declarations = [];
  if (!args.length) {
    halt('Unexpected end of arguments');
  }
  for (let i = 0; i < args.length; i++) {
    const s = {
      type: LET_DECL,
      id: args[i],
      init: vals[i],
      loc: args[i].loc && [ args[i].loc[0], vals[i].loc[1] ]
    };
    this.declarations.push(s);
  }
  this.body = body;
  if (left.loc) {
    this.loc = [ left.loc[0], currentNode.loc[1] ];
  }
  advance(')', this);
  return this;
}

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
export function parse (formula, options) {
  if (typeof formula === 'string') {
    tokens = tokenize(formula, {
      withLocation: false,
      ...options,
      mergeRefs: true
    });
  }
  else if (Array.isArray(formula)) {
    tokens = formula;
  }
  else {
    throw new Error('Parse requires a string or array of tokens.');
  }
  // allow ranges in array "literals"?
  permitArrayRanges = options?.permitArrayRanges;
  // allow calls in arrays "literals"?
  permitArrayCalls = options?.permitArrayCalls;
  // allow any function call in range operations?
  looseRefCalls = options?.looseRefCalls;
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
