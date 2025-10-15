/* eslint-disable no-mixed-operators */
import {
  OPERATOR,
  BOOLEAN,
  ERROR,
  NUMBER,
  FUNCTION,
  NEWLINE,
  WHITESPACE,
  STRING,
  CONTEXT,
  CONTEXT_QUOTE,
  REF_RANGE,
  REF_BEAM,
  REF_NAMED,
  REF_TERNARY,
  REF_STRUCT,
  MAX_COLS,
  MAX_ROWS,
  OPERATOR_TRIM
} from './constants.js';
import { parseSRange } from './parseSRange.js';

const re_ERROR = /#(?:NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/iy;
function lexError (str, pos) {
  if (str.charCodeAt(pos) === 35) {
    re_ERROR.lastIndex = pos;
    const m = re_ERROR.exec(str);
    if (m) {
      return { type: ERROR, value: m[0] };
    }
  }
}

const OPS = new Set([ 123, 125, 33, 35, 37, 38, 40, 41, 42, 43, 44, 45, 47, 58, 59, 60, 61, 62, 64, 94 ]);
function lexOperator (str, pos) {
  const c0 = str.charCodeAt(pos);
  const c1 = str.charCodeAt(pos + 1);
  if (
    (c0 === 60 && c1 === 61) ||
    (c0 === 62 && c1 === 61) ||
    (c0 === 60 && c1 === 62)
  ) {
    return { type: OPERATOR, value: str.slice(pos, pos + 2) };
  }
  if (OPS.has(c0)) {
    return { type: OPERATOR, value: str[pos] };
  }
}

function lexBoolean (str, pos) {
  const slice = str.slice(pos, pos + 5).toLowerCase();
  if (slice === 'true' || slice.startsWith('true')) {
    return { type: BOOLEAN, value: str.slice(pos, pos + 4) };
  }
  if (slice === 'false') {
    return { type: BOOLEAN, value: str.slice(pos, pos + 5) };
  }
}

// const re_FUNCTION = /[A-Z_]+[A-Z\d_.]*(?=\()/iy;
function lexFunction (str, pos) {
  const start = pos;
  // starts with: a-zA-Z_
  let c = str.charCodeAt(pos);
  if (
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c === 95) // _
  ) {
    pos++;
  }
  else {
    return;
  }
  // has any number of: a-zA-Z0-9_.
  do {
    c = str.charCodeAt(pos);
    if (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      (c === 95) || // _
      (c === 46) // .
    ) {
      pos++;
    }
    else {
      break;
    }
  } while (isFinite(c));
  // followed by a (
  if (str[pos] === '(') {
    return { type: FUNCTION, value: str.slice(start, pos) };
  }
}

function lexNewLine (str, pos) {
  const start = pos;
  while (str.charCodeAt(pos) === 10) {
    pos++;
  }
  if (pos !== start) {
    return { type: NEWLINE, value: str.slice(start, pos) };
  }
}

export const WS = new Set([ 32, 12, 13, 9, 11, 0xA0, 5760, 8232, 8233, 8239, 8287, 12288, 65279 ]);
for (let i = 8192; i <= 8202; i++) { WS.add(i); }
function lexWhitespace (str, pos) {
  const start = pos;
  while (WS.has(str.charCodeAt(pos))) {
    pos++;
  }
  if (pos !== start) {
    return { type: WHITESPACE, value: str.slice(start, pos) };
  }
}

const QUOT = 34;
function lexString (str, pos) {
  const start = pos;
  if (str.charCodeAt(pos) === QUOT) {
    pos++;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === QUOT) {
        pos++;
        if (str.charCodeAt(pos) !== QUOT) {
          return { type: STRING, value: str.slice(start, pos) };
        }
      }
      pos++;
    }
    return { type: STRING, value: str.slice(start, pos) };
  }
}

const re_NUMBER = /(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/y;
function lexNumber (str, pos) {
  re_NUMBER.lastIndex = pos;
  const m = re_NUMBER.exec(str);
  if (m) {
    return { type: NUMBER, value: m[0] };
  }
}

const PERIOD = 46;
const COLON = 58;
function lexRangeTrim (str, pos) {
  const c0 = str.charCodeAt(pos);
  const c1 = str.charCodeAt(pos + 1);
  if (c0 === PERIOD && c1 === COLON) {
    return {
      type: OPERATOR_TRIM,
      value: str.slice(pos, pos + (str.charCodeAt(pos + 2) === PERIOD ? 3 : 2))
    };
  }
  if (c0 === COLON && c1 === PERIOD) {
    return {
      type: OPERATOR_TRIM,
      value: str.slice(pos, pos + 2)
    };
  }
}

// The advertized named ranges rules are a bit off from what Excel seems to do:
// in the "extended range" of chars, it looks like it allows most things above
// U+00B0 with the range between U+00A0-U+00AF rather random.
// eslint-disable-next-line
// const re_NAMED = /^[a-zA-Z\\_¡¤§¨ª\u00ad¯\u00b0-\uffff][a-zA-Z0-9\\_.?¡¤§¨ª\u00ad¯\u00b0-\uffff]{0,254}/i;
// I've simplified to allowing everything above U+00A1:
// const re_NAMED = /^[a-zA-Z\\_\u00a1-\uffff][a-zA-Z0-9\\_.?\u00a1-\uffff]{0,254}/i;
function lexNamed (str, pos) {
  const start = pos;
  // starts with: [a-zA-Z\\_\u00a1-\uffff]
  const s = str.charCodeAt(pos);
  if (
    (s >= 65 && s <= 90) || // A-Z
    (s >= 97 && s <= 122) || // a-z
    (s === 95) || // _
    (s === 92) || // \
    (s > 0xA0) // \u00a1-\uffff
  ) {
    pos++;
  }
  else {
    return;
  }
  // has any number of: [a-zA-Z0-9\\_.?\u00a1-\uffff]
  let c;
  do {
    c = str.charCodeAt(pos);
    if (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      (c === 95) || // _
      (c === 92) || // \
      (c === 46) || // .
      (c === 63) || // ?
      (c > 0xA0) // \u00a1-\uffff
    ) {
      pos++;
    }
    else {
      break;
    }
  } while (isFinite(c));

  const len = pos - start;
  if (len && len < 255) {
    // names starting with \ must be at least 3 char long
    if (s === 92 && len < 3) {
      return null;
    }
    // single characters R and C are forbidden as names
    if (len === 1 && (s === 114 || s === 82 || s === 99 || s === 67)) {
      return null;
    }
    return { type: REF_NAMED, value: str.slice(start, pos) };
  }
}

const QUOT_SINGLE = 39; // '
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const EXCL = 33; // !
function lexContext (str, pos, options) {
  const c0 = str.charCodeAt(pos);
  // '(?:''|[^'])*('|$)(?=!)
  let br1;
  let br2;
  if (c0 === QUOT_SINGLE) {
    const start = pos;
    pos++;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === BR_OPEN) {
        if (br1) { return; } // only 1 allowed
        br1 = pos;
      }
      else if (c === BR_CLOSE) {
        if (br2) { return; } // only 1 allowed
        br2 = pos;
      }
      else if (c === QUOT_SINGLE) {
        pos++;
        if (str.charCodeAt(pos) !== QUOT_SINGLE) {
          let valid = br1 == null && br2 == null;
          if (options.xlsx && (br1 === start + 1) && (br2 === pos - 2)) {
            valid = true;
          }
          if ((br1 >= start + 1) && (br2 < pos - 2) && (br2 > br1 + 1)) {
            valid = true;
          }
          if (valid && str.charCodeAt(pos) === EXCL) {
            return { type: CONTEXT_QUOTE, value: str.slice(start, pos) };
          }
          return;
        }
      }
      pos++;
    }
  }
  else if (c0 !== EXCL) {
    // xlsx xml uses a variant of the syntax that has external references in
    // bracets. Any of: [1]Sheet1!A1, '[1]Sheet one'!A1, [1]!named
    const start = pos;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === BR_OPEN) {
        if (br1) { return; } // only 1 allowed
        br1 = pos;
      }
      else if (c === BR_CLOSE) {
        if (br2) { return; } // only 1 allowed
        br2 = pos;
      }
      else if (c === EXCL) {
        let valid = br1 == null && br2 == null;
        if (options.xlsx && (br1 === start) && (br2 === pos - 1)) {
          valid = true;
        }
        if ((br1 >= start) && (br2 < pos - 1) && (br2 > br1 + 1)) {
          valid = true;
        }
        if (valid) {
          return { type: CONTEXT, value: str.slice(start, pos) };
        }
      }
      else if (
        (br1 != null && br2 == null) ||
        // [0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]
        (
          (c >= 65 && c <= 90) || // A-Z
          (c >= 97 && c <= 122) || // a-z
          (c >= 48 && c <= 57) || // 0-9
          (c === 46) || // .
          (c === 95) || // _
          (c === 161) || // ¡
          (c === 164) || // ¤
          (c === 167) || // §
          (c === 168) || // ¨
          (c === 170) || // ª
          (c === 173) || // \u00ad
          (c >= 175)    // ¯-\uffff
        )
      ) {
        // allow char
      }
      else {
        return;
      }
      // 0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff
      pos++;
    }
  }
}

function lexStructured (str, pos) {
  const structData = parseSRange(str, pos);
  if (structData && structData.length) {
    // we have a match for a valid SR
    let i = structData.length;
    // skip tailing whitespace
    while (str[pos + i] === ' ') {
      i++;
    }
    // and ensure that it isn't followed by a !
    if (str[pos + i] !== '!') {
      return {
        type: REF_STRUCT,
        value: structData.token
      };
    }
  }
}

function lexA1Col (str, pos) {
  // [A-Z]{1,3}
  const start = pos;
  if (str.charCodeAt(pos) === 36) { // $
    pos++;
  }
  const stop = pos + 3;
  let col = 0;
  do {
    const c = str.charCodeAt(pos);
    if (c >= 65 && c <= 90) { // A-Z
      col = 26 * col + c - 64;
      pos++;
    }
    else if (c >= 97 && c <= 122) { // a-z
      col = 26 * col + c - 96;
      pos++;
    }
    else {
      break;
    }
  }
  while (pos < stop && pos < str.length);
  return (col && col <= MAX_COLS + 1) ? pos - start : 0;
}

function lexA1Row (str, pos) {
  // [1-9][0-9]{0,6}
  const start = pos;
  if (str.charCodeAt(pos) === 36) { // $
    pos++;
  }
  const stop = pos + 7;
  let row = 0;
  let c = str.charCodeAt(pos);
  if (c >= 49 && c <= 57) { // 1-9
    row = row * 10 + c - 48;
    pos++;
    do {
      c = str.charCodeAt(pos);
      if (c >= 48 && c <= 57) { // 0-9
        row = row * 10 + c - 48;
        pos++;
      }
      else {
        break;
      }
    }
    while (pos < stop && pos < str.length);
  }
  return (row && row <= MAX_ROWS + 1) ? pos - start : 0;
}

function lexRangeOp (str, pos) {
  const c0 = str.charCodeAt(pos);
  const c1 = str.charCodeAt(pos + 1);
  if (c0 === PERIOD && c1 === COLON) {
    return str.charCodeAt(pos + 2) === PERIOD ? 3 : 2;
  }
  if (c0 === COLON) {
    return c1 === PERIOD ? 2 : 1;
  }
  return 0;
}

//  partial: [A-Za-z0-9_($.]
//  regular: [A-Za-z0-9_\u00a1-\uffff]
function isNextCharVerboten (str, pos, partial = false) {
  const c = str.charCodeAt(pos);
  if (partial) {
    return (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c >= 48 && c <= 57) || // 0-9
      (c === 95) || // _
      (c === 40) || // (
      (c === 36) || // $
      (c === 46) // .
    );
  }
  return (
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    (c >= 48 && c <= 57) || // 0-9
    (c === 95) || // _
    (c > 0xA0) // \u00a1-\uffff
  );
}

const uR = 82;
const lR = 114;
const uC = 67;
const lC = 99;
const PLUS = 43;
const MINUS = 45;
// C
// C\[[+-]?\d+\]
// C[1-9][0-9]{0,4}
// R
// R\[[+-]?\d+\]
// R[1-9][0-9]{0,6}
function lexR1C1Part (str, pos, isRow = false) {
  const start = pos;
  const c0 = str.charCodeAt(pos);
  if ((isRow ? c0 === uR || c0 === lR : c0 === uC || c0 === lC)) {
    pos++;
    let digits = 0;
    let value = 0;
    let stop = str.length;
    const c1 = str.charCodeAt(pos);
    let c;
    let sign = 1;
    const relative = c1 === BR_OPEN;
    if (relative) {
      stop = Math.min(stop, pos + (isRow ? 8 : 6));
      pos++;
      // allow +-
      c = str.charCodeAt(pos);
      if (c === PLUS || c === MINUS) {
        pos++;
        stop++;
        sign = c === MINUS ? -1 : 1;
      }
    }
    else if (c1 < 49 || c1 > 57 || isNaN(c1)) {
      // char must be 1-9, or it's either just "R" or "C"
      return 1;
    }

    do {
      const c = str.charCodeAt(pos);
      if (c >= 48 && c <= 57) { // 0-9
        value = value * 10 + c - 48;
        digits++;
        pos++;
      }
      else {
        break;
      }
    }
    while (pos < stop);

    const MAX = isRow ? MAX_ROWS : MAX_COLS;
    if (relative) {
      const c = str.charCodeAt(pos);
      if (c !== BR_CLOSE) {
        return 0;
      }
      // isRow: next char must not be a number!
      pos++;
      value *= sign;
      return (digits && (-MAX <= value) && (value <= MAX))
        ? pos - start
        : 0;
    }
    // isRow: next char must not be a number!
    return (digits && value <= (MAX + 1)) ? pos - start : 0;
  }
  return 0;
}

function lexR1C1 (str, pos, options) {
  let p = pos;
  // C1
  // C1:C1
  // C1:R1C1  --partial
  // R1
  // R1:R1
  // R1:R1C1  --partial
  // R1C1
  // R1C1:C1  --partial
  // R1C1:R1  --partial
  const r1 = lexR1C1Part(str, p, true);
  p += r1;
  const c1 = lexR1C1Part(str, p);
  p += c1;
  if (c1 || r1) {
    const op = lexRangeOp(str, p);
    const pre_op = p;
    if (op) {
      p += op;
      const r2 = lexR1C1Part(str, p, true); // R1
      p += r2;
      const c2 = lexR1C1Part(str, p); // C1
      p += c2;

      // C1:R2C2  --partial
      // R1:R2C2  --partial
      // R1C1:C2  --partial
      // R1C1:R2  --partial
      if (
        (r1 && !c1 && r2 && c2) ||
        (!r1 && c1 && r2 && c2) ||
        (r1 && c1 && r2 && !c2) ||
        (r1 && c1 && !r2 && c2)
      ) {
        if (options.allowTernary && !isNextCharVerboten(str, p)) {
          return { type: REF_TERNARY, value: str.slice(pos, p) };
        }
      }
      // C1:C2 -- beam
      // R1:R2 -- beam
      else if (
        (c1 && c2 && !r1 && !r2) ||
        (!c1 && !c2 && r1 && r2)
      ) {
        if (!isNextCharVerboten(str, p)) {
          return { type: REF_BEAM, value: str.slice(pos, p) };
        }
      }
      // Note: we do not capture R1C1:R1C1, mergeRefTokens will join the parts
    }
    // R1
    // C1
    // R1C1
    if (!isNextCharVerboten(str, pre_op)) {
      return {
        type: (r1 && c1) ? REF_RANGE : REF_BEAM,
        value: str.slice(pos, pre_op)
      };
    }
  }
}

function lexA1 (str, pos, options) {
  let p = pos;
  const left = lexA1Col(str, p);
  let right = 0;
  let bottom = 0;
  if (left) {
    // TLBR: could be A1:A1
    // TL R: could be A1:A (if allowTernary)
    // TLB : could be A1:1 (if allowTernary)
    //  LBR: could be A:A1 (if allowTernary)
    //  L R: could be A:A
    p += left;
    const top = lexA1Row(str, p);
    p += top;
    const op = lexRangeOp(str, p);
    const pre_op = p;
    if (op) {
      p += op;
      right = lexA1Col(str, p);
      p += right;
      bottom = lexA1Row(str, p);
      p += bottom;
      if (top && bottom && right) {
        if (!isNextCharVerboten(str, p) && options.mergeRefs) {
          return { type: REF_RANGE, value: str.slice(pos, p) };
        }
      }
      else if (!top && !bottom) {
        if (!isNextCharVerboten(str, p)) {
          return { type: REF_BEAM, value: str.slice(pos, p) };
        }
      }
      else if (options.allowTernary) {
        if (!isNextCharVerboten(str, p, true)) {
          return { type: REF_TERNARY, value: str.slice(pos, p) };
        }
      }
    }
    // LT  : this is A1
    if (top && !isNextCharVerboten(str, pre_op)) {
      return { type: REF_RANGE, value: str.slice(pos, pre_op) };
    }
  }
  else {
    // T B : could be 1:1
    // T BR: could be 1:A1 (if allowTernary)
    const top = lexA1Row(str, p);
    if (top) {
      p += top;
      const op = lexRangeOp(str, p);
      if (op) {
        p += op;
        right = lexA1Col(str, p);
        if (right) {
          p += right;
        }
        bottom = lexA1Row(str, p);
        p += bottom;
        if (right && bottom && options.allowTernary) {
          if (!isNextCharVerboten(str, p, true)) {
            return { type: REF_TERNARY, value: str.slice(pos, p) };
          }
        }
        if (!right && bottom) {
          if (!isNextCharVerboten(str, p)) {
            return { type: REF_BEAM, value: str.slice(pos, p) };
          }
        }
      }
    }
  }
}

function lexRange (str, pos, options) {
  if (options.r1c1) {
    return lexR1C1(str, pos, options);
  }
  else {
    return lexA1(str, pos, options);
  }
}

function lexRefOp (str, pos, opts) {
  // in R1C1 mode we only allow [ '!' ]
  if (opts.r1c1) {
    if (str.charCodeAt(pos) === EXCL) {
      return { type: OPERATOR, value: str[pos] };
    }
  }
  // in A1 mode we allow [ '!', ':', '.:', ':.', '.:.']
  const c0 = str.charCodeAt(pos);
  if (c0 === EXCL) {
    return { type: OPERATOR, value: str[pos] };
  }
  const opLen = lexRangeOp(str, pos);
  if (opLen) {
    return { type: OPERATOR, value: str.slice(pos, pos + opLen) };
  }
}

export const lexers = [
  lexError,
  lexRangeTrim,
  lexOperator,
  lexFunction,
  lexBoolean,
  lexNewLine,
  lexWhitespace,
  lexString,
  lexContext,
  lexRange,
  lexStructured,
  lexNumber,
  lexNamed
];

export const lexersRefs = [
  lexRefOp,
  lexContext,
  lexRange,
  lexStructured,
  lexNamed
];
