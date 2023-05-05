import { parseRef } from './parseRef.js';
import { stringifyPrefix } from './stringifyPrefix.js';

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
      columns.push(m1[1].trim());
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
        columns.push(leftCol[1].trim());
        s = raw.slice(pos);
        if (s[0] === ':') {
          s = s.slice(1);
          pos++;
          const rightCol = matchColumn(s);
          if (rightCol) {
            pos += rightCol[0].length;
            columns.push(rightCol[1].trim());
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

export function parseSRef (ref, opts = {}) {
  const r = parseRef(ref, opts);
  if (r && r.struct) {
    const structData = parseSRange(r.struct);
    if (structData && structData.length === r.struct.length) {
      return {
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

export function stringifySRef (ref) {
  let s = stringifyPrefix(ref);
  if (ref.table) {
    s += ref.table;
  }
  const numColumns = ref.columns?.length ?? 0;
  const numSections = ref.sections?.length ?? 0;
  // single section
  if (numSections === 1 && !numColumns) {
    s += `[#${toSentenceCase(ref.sections[0])}]`;
  }
  // single column
  else if (!numSections && numColumns === 1) {
    s += `[${quoteColname(ref.columns[0])}]`;
  }
  else {
    s += '[';
    // single [#this row] sections get normalized to an @
    const singleAt = numSections === 1 && ref.sections[0].toLowerCase() === 'this row';
    if (singleAt) {
      s += '@';
    }
    else if (numSections) {
      s += ref.sections
        .map(d => `[#${toSentenceCase(d)}]`)
        .join(',');
      if (numColumns) {
        s += ',';
      }
    }
    // a case of a single alphanumberic column with a [#this row] becomes [@col]
    if (singleAt && ref.columns.length === 1 && !needsBraces(ref.columns[0])) {
      s += quoteColname(ref.columns[0]);
    }
    else if (numColumns) {
      s += ref.columns.slice(0, 2)
        .map(d => (`[${quoteColname(d)}]`))
        .join(':');
    }
    s += ']';
  }
  return s;
}

export default {
  parse: parseSRef,
  stringify: stringifySRef
};
