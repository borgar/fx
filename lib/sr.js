import { parseRef } from './parseRef.js';
import { stringifyPrefix, stringifyPrefixAlt } from './stringifyPrefix.js';

const re_SRcolumnB = /^\[('['#@[\]]|[^'#@[\]])+\]/i;
const re_SRcolumnN = /^([^#@[\]:]+)/i;

const keyTerms = {
  'headers': 1,
  'data': 2,
  'totals': 4,
  'all': 8,
  'this row': 16,
  '@': 16
};

const fz = (...a) => Object.freeze(a);

// only combinations allowed are: #data + (#headers | #totals | #data)
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

const matchColumn = (s, allowUnbraced = true) => {
  let m = re_SRcolumnB.exec(s);
  if (m) {
    const value = m[0].slice(1, -1).replace(/'(['#@[\]])/g, '$1');
    return [ m[0], value ];
  }
  if (allowUnbraced) {
    m = re_SRcolumnN.exec(s);
    if (m) {
      return [ m[0], m[0] ];
    }
  }
  return null;
};

export function parseSRange (raw) {
  const columns = [];
  let pos = 0;
  let s = raw;
  let m;
  let m1;
  let terms = 0;

  // start of structured ref?
  if ((m = /^(\[\s*)/.exec(s))) {
    // quickly determine if this is a simple keyword or column
    // [#keyword]
    if ((m1 = /^\[#([a-z ]+)\]/i.exec(s))) {
      const k = m1[1].toLowerCase();
      pos += m1[0].length;
      if (keyTerms[k]) {
        terms |= keyTerms[k];
      }
      else {
        return null;
      }
    }
    // [column]
    else if ((m1 = matchColumn(s, false))) {
      pos += m1[0].length;
      columns.push(m1[1]);
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
      s = s.slice(m[1].length);
      pos += m[1].length;
      // match keywords as we find them
      while (
        expect_more &&
        (m = /^\[#([a-z ]+)\](\s*,\s*)?/i.exec(s))
      ) {
        const k = m[1].toLowerCase();
        if (keyTerms[k]) {
          terms |= keyTerms[k];
          s = s.slice(m[0].length);
          pos += m[0].length;
          expect_more = !!m[2];
        }
        else {
          return null;
        }
      }
      // is there an @ specifier?
      if (expect_more && (m = /^@/.exec(s))) {
        terms |= keyTerms['@'];
        s = s.slice(1);
        pos += 1;
        expect_more = s[0] !== ']';
      }
      // not all keyword terms may be combined
      if (!(terms in sectionMap)) {
        return null;
      }
      // column definitions
      const leftCol = expect_more ? matchColumn(raw.slice(pos)) : null;
      if (leftCol) {
        pos += leftCol[0].length;
        columns.push(leftCol[1]);
        s = raw.slice(pos);
        if (s[0] === ':') {
          s = s.slice(1);
          pos++;
          const rightCol = matchColumn(s);
          if (rightCol) {
            pos += rightCol[0].length;
            columns.push(rightCol[1]);
          }
          else {
            return null;
          }
        }
        expect_more = false;
      }
      // advance ws
      while (raw[pos] === ' ') {
        pos++;
      }
      // close the ref
      if (expect_more || raw[pos] !== ']') {
        return null;
      }
      // step over the closing ]
      pos++;
    }
  }
  else {
    return null;
  }

  const sections = sectionMap[terms];
  return {
    columns,
    sections: sections ? sections.concat() : sections,
    length: pos,
    token: raw.slice(0, pos)
  };
}

/**
 * Parse a structured reference string into an object representing it.
 *
 * ```js
 * parseStructRef('workbook.xlsx!tableName[[#Data],[Column1]:[Column2]]');
 * // => {
 * //   context: [ 'workbook.xlsx' ],
 * //   sections: [ 'data' ],
 * //   columns: [ 'my column', '@foo' ],
 * //   table: 'tableName',
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * @tutorial References.md
 * @param {string} ref  A structured reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceStruct|null)} An object representing a valid reference or null if it is invalid.
 */
export function parseStructRef (ref, options = { xlsx: false }) {
  const r = parseRef(ref, options);
  if (r && r.struct) {
    const structData = parseSRange(r.struct);
    if (structData && structData.length === r.struct.length) {
      return options.xlsx
        ? {
          workbookName: r.workbookName,
          sheetName: r.sheetName,
          table: r.name,
          columns: structData.columns,
          sections: structData.sections
        }
        : {
          context: r.context,
          table: r.name,
          columns: structData.columns,
          sections: structData.sections
        };
    }
  }
  return null;
}

function quoteColname (str) {
  return str.replace(/([[\]#'@])/g, '\'$1');
}

function needsBraces (str) {
  return !/^[a-zA-Z0-9\u00a1-\uffff]+$/.test(str);
}

function toSentenceCase (str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get a string representation of a structured reference object.
 *
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
 * @param {ReferenceStruct} refObject A structured reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {string} The structured reference in string format
 */
export function stringifyStructRef (refObject, { xlsx = false } = {}) {
  let s = xlsx
    ? stringifyPrefixAlt(refObject)
    : stringifyPrefix(refObject);

  if (refObject.table) {
    s += refObject.table;
  }
  const numColumns = refObject.columns?.length ?? 0;
  const numSections = refObject.sections?.length ?? 0;
  // single section
  if (numSections === 1 && !numColumns) {
    s += `[#${toSentenceCase(refObject.sections[0])}]`;
  }
  // single column
  else if (!numSections && numColumns === 1) {
    s += `[${quoteColname(refObject.columns[0])}]`;
  }
  else {
    s += '[';
    // single [#this row] sections get normalized to an @
    const singleAt = numSections === 1 && refObject.sections[0].toLowerCase() === 'this row';
    if (singleAt) {
      s += '@';
    }
    else if (numSections) {
      s += refObject.sections
        .map(d => `[#${toSentenceCase(d)}]`)
        .join(',');
      if (numColumns) {
        s += ',';
      }
    }
    // a case of a single alphanumberic column with a [#this row] becomes [@col]
    if (singleAt && refObject.columns.length === 1 && !needsBraces(refObject.columns[0])) {
      s += quoteColname(refObject.columns[0]);
    }
    else if (numColumns) {
      s += refObject.columns.slice(0, 2)
        .map(d => (`[${quoteColname(d)}]`))
        .join(':');
    }
    s += ']';
  }
  return s;
}
