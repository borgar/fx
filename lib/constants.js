import { quickVerifyRangeA1, quickVerifyRangeRC } from './quickVerify.js';

export const OPERATOR = 'operator';
export const BOOLEAN = 'bool';
export const ERROR = 'error';
export const NUMBER = 'number';
export const FUNCTION = 'function';
export const NEWLINE = 'newline';
export const WHITESPACE = 'whitespace';
export const STRING = 'string';
export const PATH_QUOTE = 'path-quote';
export const PATH_BRACE = 'path-brace';
export const PATH_PREFIX = 'path-prefix';
export const RANGE = 'range';
export const RANGE_BEAM = 'range-beam';
export const RANGE_NAMED = 'range-named';
export const FX_PREFIX = 'fx-prefix';
export const UNKNOWN = 'unknown';

export const MAX_COLS = 2 ** 14 - 1; // 16383
export const MAX_ROWS = 2 ** 20 - 1; // 1048575

const re_ERROR = /^#(NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!)/i;
const re_OPERATOR = /^(<=|>=|<>|[-+/*^%&<>=]|[{},;]|[()]|@|:|!|#)/;
const re_BOOLEAN = /^(TRUE|FALSE)\b/i;
const re_FUNCTION = /^[A-Z_]+[A-Z\d_.]*(?=\()/i;
const re_NEWLINE = /^\n+/;
const re_WHITESPACE = /^[ \f\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
const re_STRING = /^"(?:""|[^"])*("|$)/;
const re_PATH_QUOTE = /^'(?:''|[^'])*('|$)/;
const re_PATH_BRACE = /^\[(?:[^\]])+(\]|$)/;
const re_PATH_PREFIX = /^([^ \t\n$!"`'#%&(){}<>,;:^@|~=*+-]+)(?=!)/; // Sheets: [^:\\/?*[\]]{0,31} (but WB names?)
const re_A1COL = /^\$?[A-Z]{1,3}:\$?[A-Z]{1,3}/i;
const re_A1ROW = /^\$?[1-9][0-9]{0,6}:\$?[1-9][0-9]{0,6}/i;
const re_A1RANGE = /^\$?[A-Z]{1,3}\$?[1-9][0-9]{0,6}/i;
const rPart = '(?:R(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,6})?)';
const cPart = '(?:C(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,4})?)';
const re_RCCOL = new RegExp(`^${cPart}(:${cPart})?(?=\\W|$)`, 'i');
const re_RCROW = new RegExp(`^${rPart}(:${rPart})?(?=\\W|$)`, 'i');
const re_RCRANGE = new RegExp(`^(?:(?=[RC])${rPart}${cPart})`, 'i');
const re_NUMBER = /^(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/;
// The advertized named ranges rules are a bit off from what Excel seems to do:
// in the "extended range" of chars, it looks like it allows most things above
// U+00B0 with the range between U+00A0-U+00AF rather random.
// const re_NAMED = /^^[a-zA-Z\\_¡¤§¨ª\u00ad¯\u00b0-\uffff][a-zA-Z0-9\\_.?¡¤§¨ª\u00ad¯\u00b0-\uffff]{0,254}/i;
// I've simplified to allowing everything above U+00A1:
const re_NAMED = /^[a-zA-Z\\_\u00a1-\uffff][a-zA-Z0-9\\_.?\u00a1-\uffff]{0,254}/i;

export const tokenHandlersA1 = [
  [ ERROR,       re_ERROR ],
  [ OPERATOR,    re_OPERATOR ],
  [ BOOLEAN,     re_BOOLEAN ],
  [ FUNCTION,    re_FUNCTION ],
  [ NEWLINE,     re_NEWLINE ],
  [ WHITESPACE,  re_WHITESPACE ],
  [ STRING,      re_STRING ],
  [ PATH_QUOTE,  re_PATH_QUOTE ],
  [ PATH_BRACE,  re_PATH_BRACE ],
  [ PATH_PREFIX, re_PATH_PREFIX ],
  [ RANGE,       re_A1RANGE, quickVerifyRangeA1 ],
  [ RANGE_BEAM,  re_A1COL, quickVerifyRangeA1 ],
  [ RANGE_BEAM,  re_A1ROW, quickVerifyRangeA1 ],
  [ NUMBER,      re_NUMBER ],
  [ RANGE_NAMED, re_NAMED ]
];

export const tokenHandlersRC = [
  [ ERROR,       re_ERROR ],
  [ OPERATOR,    re_OPERATOR ],
  [ BOOLEAN,     re_BOOLEAN ],
  [ FUNCTION,    re_FUNCTION ],
  [ NEWLINE,     re_NEWLINE ],
  [ WHITESPACE,  re_WHITESPACE ],
  [ STRING,      re_STRING ],
  [ PATH_QUOTE,  re_PATH_QUOTE ],
  [ PATH_BRACE,  re_PATH_BRACE ],
  [ PATH_PREFIX, re_PATH_PREFIX ],
  [ RANGE,       re_RCRANGE, quickVerifyRangeRC ],
  [ RANGE_BEAM,  re_RCROW, quickVerifyRangeRC ],
  [ RANGE_BEAM,  re_RCCOL, quickVerifyRangeRC ],
  [ NUMBER,      re_NUMBER ],
  [ RANGE_NAMED, re_NAMED ]
];

export const tokenHandlersRefsA1 = [
  [ OPERATOR,    /^[!:]/ ],
  [ PATH_QUOTE,  re_PATH_QUOTE ],
  [ PATH_BRACE,  re_PATH_BRACE ],
  [ PATH_PREFIX, re_PATH_PREFIX ],
  [ RANGE,       re_A1RANGE, quickVerifyRangeA1 ],
  [ RANGE_BEAM,  re_A1COL, quickVerifyRangeA1 ],
  [ RANGE_BEAM,  re_A1ROW, quickVerifyRangeA1 ],
  [ RANGE_NAMED, re_NAMED ]
];

export const tokenHandlersRefsRC = [
  [ OPERATOR,    /^!/ ],
  [ PATH_QUOTE,  re_PATH_QUOTE ],
  [ PATH_BRACE,  re_PATH_BRACE ],
  [ PATH_PREFIX, re_PATH_PREFIX ],
  [ RANGE,       re_RCRANGE, quickVerifyRangeRC ],
  [ RANGE_BEAM,  re_RCROW, quickVerifyRangeRC ],
  [ RANGE_BEAM,  re_RCCOL, quickVerifyRangeRC ],
  [ RANGE_NAMED, re_NAMED ]
];
