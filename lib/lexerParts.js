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
  RANGE,
  RANGE_BEAM,
  RANGE_NAMED,
  RANGE_PART,
  MAX_COLS,
  MAX_ROWS
} from './constants.js';
import { fromCol } from './a1.js';

const re_ERROR = /^#(NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!)/i;
const re_OPERATOR = /^(<=|>=|<>|[-+/*^%&<>=]|[{},;]|[()]|@|:|!|#)/;
const re_BOOLEAN = /^(TRUE|FALSE)\b/i;
const re_FUNCTION = /^[A-Z_]+[A-Z\d_.]*(?=\()/i;
const re_NEWLINE = /^\n+/;
const re_WHITESPACE = /^[ \f\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
const re_STRING = /^"(?:""|[^"])*("|$)/;
const re_NUMBER = /^(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/;

const re_CONTEXT = /^(\[(?:[^\]])+\])?([0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]+)(?=!)/;
const re_CONTEXT_QUOTE = /^'(?:''|[^'])*('|$)(?=!)/;

const rngPart = '\\$?[A-Z]{1,3}\\$?[1-9][0-9]{0,6}';
const colPart = '\\$?[A-Z]{1,3}';
const rowPart = '\\$?[1-9][0-9]{0,6}';
const re_A1COL = new RegExp(`^${colPart}:${colPart}`, 'i');
const re_A1ROW = new RegExp(`^${rowPart}:${rowPart}`, 'i');
const re_A1RANGE = new RegExp(`^${rngPart}`, 'i');
const re_A1PARTIAL = new RegExp(`^((${colPart}|${rowPart}):${rngPart}|${rngPart}:(${colPart}|${rowPart}))(?![\\w($.])`, 'i');
const rPart = '(?:R(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,6})?)';
const cPart = '(?:C(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,4})?)';
const re_RCCOL = new RegExp(`^${cPart}(:${cPart})?(?=\\W|$)`, 'i');
const re_RCROW = new RegExp(`^${rPart}(:${rPart})?(?=\\W|$)`, 'i');
const re_RCRANGE = new RegExp(`^(?:(?=[RC])${rPart}${cPart})`, 'i');
const re_RCPARTIAL = new RegExp(`^(${rPart}${cPart}(:${cPart}|:${rPart})(?![[\\d])|(${rPart}|${cPart})(:${rPart}${cPart}))(?=\\W|$)`, 'i');

// The advertized named ranges rules are a bit off from what Excel seems to do:
// in the "extended range" of chars, it looks like it allows most things above
// U+00B0 with the range between U+00A0-U+00AF rather random.
// const re_NAMED = /^^[a-zA-Z\\_¡¤§¨ª\u00ad¯\u00b0-\uffff][a-zA-Z0-9\\_.?¡¤§¨ª\u00ad¯\u00b0-\uffff]{0,254}/i;
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

const reRCNums = /([RC])(\[?)(-?\d+)/gi;
const reA1Nums = /(\d+|[a-zA-Z]+)/gi;
function lexRange (str, options) {
  let m, t;
  if (options.r1c1) {
    // RC notation
    if (options.allowPartials && (m = re_RCPARTIAL.exec(str))) {
      t = { type: RANGE_PART, value: m[0] };
    }
    else if ((m = re_RCRANGE.exec(str))) {
      t = { type: RANGE, value: m[0] };
    }
    else if ((m = re_RCROW.exec(str)) || (m = re_RCCOL.exec(str))) {
      t = { type: RANGE_BEAM, value: m[0] };
    }
    if (t) {
      reRCNums.lastIndex = 0;
      while ((m = reRCNums.exec(t.value)) !== null) {
        const x = (m[1] === 'R' ? MAX_ROWS : MAX_COLS) + (m[2] ? 1 : 0);
        const val = parseInt(m[3], 10);
        if (val >= x || val <= -x) {
          return null;
        }
      }
      return t;
    }
  }
  else {
    // A1 notation
    if (options.allowPartials && (m = re_A1PARTIAL.exec(str))) {
      t = { type: RANGE_PART, value: m[0] };
    }
    else if ((m = re_A1COL.exec(str)) || (m = re_A1ROW.exec(str))) {
      t = { type: RANGE_BEAM, value: m[0] };
    }
    else if ((m = re_A1RANGE.exec(str))) {
      t = { type: RANGE, value: m[0] };
    }
    if (t) {
      reA1Nums.lastIndex = 0;
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
  // in RC mode we only allow !
  if (opts.r1c1) {
    return (s[0] === '!')
      ? { type: OPERATOR, value: s[0] }
      : null;
  }
  // in A1 mode we allow ! and :
  return (s[0] === '!' || s[0] === ':')
    ? { type: OPERATOR, value: s[0] }
    : null;
}

export const lexers = [
  makeHandler(ERROR, re_ERROR),
  makeHandler(OPERATOR, re_OPERATOR),
  makeHandler(BOOLEAN, re_BOOLEAN),
  makeHandler(FUNCTION, re_FUNCTION),
  makeHandler(NEWLINE, re_NEWLINE),
  makeHandler(WHITESPACE, re_WHITESPACE),
  makeHandler(STRING, re_STRING),
  makeHandler(CONTEXT_QUOTE, re_CONTEXT_QUOTE),
  makeHandler(CONTEXT, re_CONTEXT),
  lexRange,
  makeHandler(NUMBER, re_NUMBER),
  makeHandler(RANGE_NAMED, re_NAMED)
];

export const lexersRefs = [
  lexRefOp,
  makeHandler(CONTEXT_QUOTE, re_CONTEXT_QUOTE),
  makeHandler(CONTEXT, re_CONTEXT),
  lexRange,
  makeHandler(RANGE_NAMED, re_NAMED)
];
