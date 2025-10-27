import { stringifyPrefix, stringifyPrefixAlt } from './stringifyPrefix.js';

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
 * @param {import('./extraTypes.js').ReferenceStruct} refObject A structured reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param {boolean} [options.thisRow=false]  Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges.
 * @returns {string} The structured reference in string format
 */
export function stringifyStructRef (refObject, options = {}) {
  const { xlsx, thisRow } = options;
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
    // single [#this row] sections get normalized to an @ by default
    const singleAt = !thisRow && numSections === 1 && refObject.sections[0].toLowerCase() === 'this row';
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
