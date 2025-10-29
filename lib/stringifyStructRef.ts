import type { ReferenceStruct, ReferenceStructXlsx } from './extraTypes.ts';
import { stringifyPrefix, stringifyPrefixAlt } from './stringifyPrefix.ts';

function quoteColname (str: string): string {
  return str.replace(/([[\]#'@])/g, '\'$1');
}

function needsBraces (str: string): boolean {
  return !/^[a-zA-Z0-9\u00a1-\uffff]+$/.test(str);
}

function toSentenceCase (str: string): string {
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
 * @param refObject A structured reference object
 * @param [options={}]  Options
 * @param [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @param [options.thisRow=false]  Enforces using the `[#This Row]` instead of the `@` shorthand when serializing structured ranges.
 * @returns The structured reference in string format
 */
export function stringifyStructRef (
  refObject: ReferenceStruct | ReferenceStructXlsx,
  options: { xlsx?: boolean; thisRow?: boolean; } = {}
): string {
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
