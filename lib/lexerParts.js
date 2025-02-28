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
import { fromCol } from './a1.js';
import { parseSRange } from './sr.js';

const re_ERROR = /^#(NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/i;
const re_OPERATOR = /^(<=|>=|<>|[-+/*^%&<>=]|[{},;]|[()]|@|:|!|#)/;
const re_BOOLEAN = /^(TRUE|FALSE)\b/i;
const re_FUNCTION = /^[A-Z_]+[A-Z\d_.]*(?=\()/i;
const re_NEWLINE = /^\n+/;
const re_WHITESPACE = /^[ \f\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
const re_STRING = /^"(?:""|[^"])*("|$)/;
const re_NUMBER = /^(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/;
const re_CONTEXT = /^(?!!)(\[(?:[^\]])+\])?([0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]+)?(?=!)/;
const re_CONTEXT_QUOTE = /^'(?:''|[^'])*('|$)(?=!)/;
const re_RANGE_TRIM = /^(\.:\.|\.:|:\.)/;

const rngPart = '\\$?[A-Z]{1,3}\\$?[1-9][0-9]{0,6}';
const colPart = '\\$?[A-Z]{1,3}';
const rowPart = '\\$?[1-9][0-9]{0,6}';
const rangeOp = '\\.?:\\.?';
const nextNotChar = '(?![a-z0-9_\\u00a1-\\uffff])';
const re_A1COL = new RegExp(`^${colPart}${rangeOp}${colPart}${nextNotChar}`, 'i');
const re_A1ROW = new RegExp(`^${rowPart}${rangeOp}${rowPart}${nextNotChar}`, 'i');
const re_A1RANGE = new RegExp(`^${rngPart}${nextNotChar}`, 'i');
const re_A1PARTIAL = new RegExp(`^((${colPart}|${rowPart})${rangeOp}${rngPart}|${rngPart}${rangeOp}(${colPart}|${rowPart}))(?![\\w($.])`, 'i');
const rPart = '(?:R(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,6})?)';
const cPart = '(?:C(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,4})?)';
const re_RCCOL = new RegExp(`^${cPart}(${rangeOp}${cPart})?${nextNotChar}`, 'i');
const re_RCROW = new RegExp(`^${rPart}(${rangeOp}${rPart})?${nextNotChar}`, 'i');
const re_RCRANGE = new RegExp(`^(?:(?=[RC])${rPart}${cPart})${nextNotChar}`, 'i');
const re_RCPARTIAL = new RegExp(`^(${rPart}${cPart}(${rangeOp}${cPart}|${rangeOp}${rPart})(?![[\\d])|(${rPart}|${cPart})(${rangeOp}${rPart}${cPart}))${nextNotChar}`, 'i');

// The advertized named ranges rules are a bit off from what Excel seems to do:
// in the "extended range" of chars, it looks like it allows most things above
// U+00B0 with the range between U+00A0-U+00AF rather random.
// eslint-disable-next-line
// const re_NAMED = /^[a-zA-Z\\_¡¤§¨ª\u00ad¯\u00b0-\uffff][a-zA-Z0-9\\_.?¡¤§¨ª\u00ad¯\u00b0-\uffff]{0,254}/i;
// I've simplified to allowing everything above U+00A1:
const re_NAMED = /^[a-zA-Z\\_\u00a1-\uffff][a-zA-Z0-9\\_.?\u00a1-\uffff]{0,254}/i;

function makeHandler (type, re) {
  return str => {
    const m = re.exec(str);
    if (m) {
      return { type: type, value: m[0] };
    }
  };
}

function lexNamed (str) {
  const m = re_NAMED.exec(str);
  if (m) {
    const lc = m[0].toLowerCase();
    // names starting with \ must be at least 3 char long
    if (lc[0] === '\\' && m[0].length < 3) {
      return null;
    }
    // single characters R and C are forbidden as names
    if (lc === 'r' || lc === 'c') {
      return null;
    }
    return { type: REF_NAMED, value: m[0] };
  }
}

const re_QUOTED_VALUE = /^'(?:[^[\]]+?)?(?:\[(.+?)\])?(?:[^[\]]+?)'$/;
const re_QUOTED_VALUE_XLSX = /^'\[(.+?)\]'$/;
function lexContext (str, options) {
  const mq = re_CONTEXT_QUOTE.exec(str);
  if (mq) {
    const value = mq[0];
    const isValid = options.xlsx
      ? re_QUOTED_VALUE_XLSX.test(value) || re_QUOTED_VALUE.test(value)
      : re_QUOTED_VALUE.test(value);
    if (isValid) {
      return { type: CONTEXT_QUOTE, value: value };
    }
  }
  // xlsx xml uses a variant of the syntax that has external references in
  // bracets. Any of: [1]Sheet1!A1, '[1]Sheet one'!A1, [1]!named
  // We're only concerned with the non quoted version here as the quoted version
  // doesn't currently examine what is in the quotes.
  const m = re_CONTEXT.exec(str);
  if (m) {
    const [ , a, b ] = m;
    const valid = (
      ((a && b) || b) || // "[a]b!" or "b!" forms
      (a && !b && options.xlsx) // "[a]" form (allowed in xlsx mode)
    );
    if (valid) {
      return { type: CONTEXT, value: m[0] };
    }
  }
}

function lexStructured (str) {
  const structData = parseSRange(str);
  if (structData) {
    // we have a match for a valid SR
    let i = structData.length;
    // skip tailing whitespace
    while (str[i] === ' ') {
      i++;
    }
    // and ensure that it isn't followed by a !
    if (str[i] !== '!') {
      return {
        type: REF_STRUCT,
        value: structData.token
      };
    }
  }
  return null;
}

const reRCNums = /([RC])(\[?)(-?\d+)/gi;
const reA1Nums = /(\d+|[a-zA-Z]+)/gi;
function lexRange (str, options) {
  let m, t;
  if (options.r1c1) {
    // RC notation
    if (options.allowTernary && (m = re_RCPARTIAL.exec(str))) {
      t = { type: REF_TERNARY, value: m[0] };
    }
    else if ((m = re_RCRANGE.exec(str))) {
      t = { type: REF_RANGE, value: m[0] };
    }
    else if ((m = re_RCROW.exec(str)) || (m = re_RCCOL.exec(str))) {
      t = { type: REF_BEAM, value: m[0] };
    }
    if (t) {
      reRCNums.lastIndex = 0;
      while ((m = reRCNums.exec(t.value)) !== null) {
        const x = (m[1] === 'R' ? MAX_ROWS : MAX_COLS) + (m[2] ? 0 : 1);
        const val = parseInt(m[3], 10);
        if (val > x || val < -x) {
          return null;
        }
      }
      return t;
    }
  }
  else {
    // A1 notation
    if (options.allowTernary && (m = re_A1PARTIAL.exec(str))) {
      t = { type: REF_TERNARY, value: m[0] };
    }
    else if ((m = re_A1COL.exec(str)) || (m = re_A1ROW.exec(str))) {
      t = { type: REF_BEAM, value: m[0] };
    }
    else if ((m = re_A1RANGE.exec(str))) {
      t = { type: REF_RANGE, value: m[0] };
    }
    if (t) {
      reA1Nums.lastIndex = 0;
      // XXX: can probably optimize this as we know letters can only be 3 at max
      while ((m = reA1Nums.exec(t.value)) !== null) {
        if (/^\d/.test(m[1])) { // row
          if ((parseInt(m[1], 10) - 1) > MAX_ROWS) {
            return null;
          }
        }
        else if (fromCol(m[1]) > MAX_COLS) {
          return null;
        }
      }
      return t;
    }
  }
}

function lexRefOp (s, opts) {
  // in R1C1 mode we only allow !
  if (opts.r1c1) {
    return (s[0] === '!')
      ? { type: OPERATOR, value: s[0] }
      : null;
  }
  // in A1 mode we allow [ '!', ':', '.:', ':.', '.:.']
  const m = /^(!|\.?:\.?)/.exec(s);
  if (m) {
    return { type: OPERATOR, value: m[1] };
  }
  return null;
}

export const lexers = [
  makeHandler(ERROR, re_ERROR),
  makeHandler(OPERATOR_TRIM, re_RANGE_TRIM),
  makeHandler(OPERATOR, re_OPERATOR),
  makeHandler(FUNCTION, re_FUNCTION),
  makeHandler(BOOLEAN, re_BOOLEAN),
  makeHandler(NEWLINE, re_NEWLINE),
  makeHandler(WHITESPACE, re_WHITESPACE),
  makeHandler(STRING, re_STRING),
  lexContext,
  lexRange,
  lexStructured,
  makeHandler(NUMBER, re_NUMBER),
  lexNamed
];

export const lexersRefs = [
  lexRefOp,
  lexContext,
  lexRange,
  lexStructured,
  lexNamed
];
