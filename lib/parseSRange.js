/* eslint-disable no-multi-spaces */
/* eslint-disable no-undefined */
import { isWS } from './lexers/lexWhitespace.js';

const AT = 64; // @
const BR_CLOSE = 93; // ]
const BR_OPEN = 91; // [
const COLON = 58; // :
const COMMA = 44; // ,
const HASH = 35; // #
const QUOT_SINGLE = 39; // '

const keyTerms = {
  'headers': 1,
  'data': 2,
  'totals': 4,
  'all': 8,
  'this row': 16,
  '@': 16
};

// only combinations allowed are: #data + (#headers | #totals | #data)
const fz = (...a) => Object.freeze(a);
const sectionMap = {
  // no terms
  0: fz(),
  // single term
  1: fz('headers'),
  2: fz('data'),
  4: fz('totals'),
  8: fz('all'),
  16: fz('this row'),
  // headers+data
  3: fz('headers', 'data'),
  // totals+data
  6: fz('data', 'totals')
};

function matchKeyword (str, pos) {
  let p = pos;
  if (str.charCodeAt(p++) !== BR_OPEN) {
    return;
  }
  if (str.charCodeAt(p++) !== HASH) {
    return;
  }
  do {
    const c = str.charCodeAt(p);
    if (
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      (c === 32) // space
    ) {
      p++;
    }
    else {
      break;
    }
  }
  while (p < pos + 11); // max length: '[#this row'
  if (str.charCodeAt(p++) !== BR_CLOSE) {
    return;
  }
  return p - pos;
}

function skipWhitespace (str, pos) {
  let p = pos;
  while (isWS(str.charCodeAt(p))) { p++; }
  return p - pos;
}

function matchColumn (str, pos, allowUnbraced = true) {
  let p = pos;
  let column = '';
  if (str.charCodeAt(p) === BR_OPEN) {
    p++;
    let c;
    do {
      c = str.charCodeAt(p);
      if (c === QUOT_SINGLE) {
        p++;
        c = str.charCodeAt(p);
        // Allowed set: '#@[]
        if (c === QUOT_SINGLE || c === HASH || c === AT || c === BR_OPEN || c === BR_CLOSE) {
          column += String.fromCharCode(c);
          p++;
        }
        else {
          return;
        }
      }
      // Allowed set is all chars BUT: '#@[]
      else if (c === QUOT_SINGLE || c === HASH || c === AT || c === BR_OPEN) {
        return;
      }
      else if (c === BR_CLOSE) {
        p++;
        return [ str.slice(pos, p), column ];
      }
      else {
        column += String.fromCharCode(c);
        p++;
      }
    }
    while (p < str.length);
  }
  else if (allowUnbraced) {
    let c;
    do {
      c = str.charCodeAt(p);
      // Allowed set is all chars BUT: '#@[]:
      if (c === QUOT_SINGLE || c === HASH || c === AT || c === BR_OPEN || c === BR_CLOSE || c === COLON) {
        break;
      }
      else {
        column += String.fromCharCode(c);
        p++;
      }
    }
    while (p < str.length);
    if (p !== pos) {
      return [ column, column ];
    }
  }
}

export function parseSRange (str, pos = 0) {
  const columns = [];
  const start = pos;
  let m;
  let terms = 0;

  // structured refs start with a [
  if (str.charCodeAt(pos) !== BR_OPEN) {
    return;
  }

  // simple keyword: [#keyword]
  if ((m = matchKeyword(str, pos))) {
    const k = str.slice(pos + 2, pos + m - 1);
    pos += m;
    const term = keyTerms[k.toLowerCase()];
    if (!term) { return; }
    terms |= term;
  }
  // simple column: [column]
  else if ((m = matchColumn(str, pos, false))) {
    pos += m[0].length;
    if (m[1]) {
      columns.push(m[1]);
    }
  }
  // use the "normal" method
  // [[#keyword]]
  // [[column]]
  // [@]
  // [@column]
  // [@[column]]
  // [@column:column]
  // [@column:[column]]
  // [@[column]:column]
  // [@[column]:[column]]
  // [column:column]
  // [column:[column]]
  // [[column]:column]
  // [[column]:[column]]
  // [[#keyword],column]
  // [[#keyword],column:column]
  // [[#keyword],[#keyword],column:column]
  // ...
  else {
    let expect_more = true;
    pos++; // skip open brace
    pos += skipWhitespace(str, pos);
    // match keywords as we find them
    while (expect_more && (m = matchKeyword(str, pos))) {
      const k = str.slice(pos + 2, pos + m - 1);
      const term = keyTerms[k.toLowerCase()];
      if (!term) { return; }
      terms |= term;
      pos += m;
      pos += skipWhitespace(str, pos);
      expect_more = str.charCodeAt(pos) === COMMA;
      if (expect_more) {
        pos++;
        pos += skipWhitespace(str, pos);
      }
    }
    // is there an @ specifier?
    if (expect_more && (str.charCodeAt(pos) === AT)) {
      terms |= keyTerms['@'];
      pos += 1;
      expect_more = str.charCodeAt(pos) !== BR_CLOSE;
    }
    // not all keyword terms may be combined
    if (!sectionMap[terms]) {
      return;
    }
    // column definitions
    const leftCol = expect_more && matchColumn(str, pos, true);
    if (leftCol) {
      pos += leftCol[0].length;
      columns.push(leftCol[1]);
      if (str.charCodeAt(pos) === COLON) {
        pos++;
        const rightCol = matchColumn(str, pos, true);
        if (rightCol) {
          pos += rightCol[0].length;
          columns.push(rightCol[1]);
        }
        else {
          return;
        }
      }
      expect_more = false;
    }
    // advance ws
    pos += skipWhitespace(str, pos);
    // close the ref
    if (expect_more || str.charCodeAt(pos) !== BR_CLOSE) {
      return;
    }
    // step over the closing ]
    pos++;
  }

  const sections = sectionMap[terms];
  return {
    columns,
    sections: sections ? sections.concat() : sections,
    length: pos - start,
    token: str.slice(start, pos)
  };
}
