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
