import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRef } from './parseRef.js';
import { toCol } from './toCol.js';
import { fromCol } from './fromCol.js';
import { stringifyPrefix, stringifyPrefixAlt } from './stringifyPrefix.js';

const clamp = (min, val, max) => Math.min(Math.max(val, min), max);
const toColStr = (c, a) => (a ? '$' : '') + toCol(c);
const toRowStr = (r, a) => (a ? '$' : '') + toRow(r);

export function fromRow (rowStr) {
  return +rowStr - 1;
}

export function toRow (top) {
  return String(top + 1);
}

export function toRelative (range) {
  return Object.assign({}, range, { $left: false, $right: false, $top: false, $bottom: false });
}

export function toAbsolute (range) {
  return Object.assign({}, range, { $left: true, $right: true, $top: true, $bottom: true });
}

/**
 * @ignore
 * @param {'head' | 'tail' | 'both' | null | undefined} trim Does the range have trimming?
 * @returns {string} The appropriate range join operator
 */
export function rangeOperator (trim) {
  if (trim === 'both') {
    return '.:.';
  }
  else if (trim === 'head') {
    return '.:';
  }
  else if (trim === 'tail') {
    return ':.';
  }
  return ':';
}

export function trimDirection (head, tail) {
  if (head && tail) {
    return 'both';
  }
  if (head) {
    return 'head';
  }
  if (tail) {
    return 'tail';
  }
}

/**
 * Stringify a range object into A1 syntax.
 *
 * @private
 * @ignore
 * @see parseA1Ref
 * @param {RangeA1} range  A range object
 * @returns {string}  An A1-style string represenation of a range
 */
export function toA1 (range) {
  // eslint-disable-next-line prefer-const
  let { top, left, bottom, right, trim } = range;
  const { $left, $right, $top, $bottom } = range;
  const noLeft = left == null;
  const noRight = right == null;
  const noTop = top == null;
  const noBottom = bottom == null;
  // allow skipping right and bottom to define a cell
  top = clamp(0, top | 0, MAX_ROWS);
  left = clamp(0, left | 0, MAX_COLS);
  if (!noLeft && !noTop && noRight && noBottom) {
    bottom = top;
    right = left;
  }
  else {
    bottom = clamp(0, bottom | 0, MAX_ROWS);
    right = clamp(0, right | 0, MAX_COLS);
  }
  const op = rangeOperator(trim);
  // A:A
  const allRows = top === 0 && bottom >= MAX_ROWS;
  const haveAbsCol = ($left && !noLeft) || ($right && !noRight);
  if ((allRows && !noLeft && !noRight && (!haveAbsCol || left === right)) || (noTop && noBottom)) {
    return toColStr(left, $left) + op + toColStr(right, $right);
  }
  // 1:1
  const allCols = left === 0 && right >= MAX_COLS;
  const haveAbsRow = ($top && !noTop) || ($bottom && !noBottom);
  if ((allCols && !noTop && !noBottom && (!haveAbsRow || top === bottom)) || (noLeft && noRight)) {
    return toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  // A1:1
  if (!noLeft && !noTop && !noRight && noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toColStr(right, $right);
  }
  // A:A1 => A1:1
  if (!noLeft && noTop && !noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(bottom, $bottom) + op + toColStr(right, $right);
  }
  // A1:A
  if (!noLeft && !noTop && noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  // A:A1 => A1:A
  if (noLeft && !noTop && !noRight && !noBottom) {
    return toColStr(right, $right) + toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  // A1:A1
  if (right !== left || bottom !== top || $right !== $left || $bottom !== $top) {
    return toColStr(left, $left) + toRowStr(top, $top) + op +
           toColStr(right, $right) + toRowStr(bottom, $bottom);
  }
  // A1
  return toColStr(left, $left) + toRowStr(top, $top);
}

function splitA1 (str) {
  const m = /^(?=.)(\$(?=\D))?([A-Za-z]{0,3})?(\$)?([1-9][0-9]{0,6})?$/.exec(str);
  if (!m || (!m[2] && !m[4])) {
    return null;
  }
  return [
    m[4] ? fromRow(m[4]) : null, // row index or null
    m[2] ? fromCol(m[2]) : null, // col index or null
    !!m[3], // is row absolute?
    !!m[1]  // is col absolute?
  ];
}

/**
 * Parse a simple string reference to an A1 range into a range object.
 * Will accept `A1`, `A2`, `A:A`, or `1:1`.
 *
 * @private
 * @ignore
 * @see parseA1Ref
 * @param {string} rangeString  A range string
 * @returns {(RangeA1|null)} An object representing a valid range or null if it is invalid.
 */
export function fromA1 (rangeString) {
  let top = null;
  let left = null;
  let bottom = null;
  let right = null;
  let $top = false;
  let $left = false;
  let $bottom = false;
  let $right = false;
  const [ part1, op1, part2, op2, part3 ] = rangeString.split(/(\.?:\.?)/);
  if (op2 || part3) {
    return null;
  }
  const trim = trimDirection(!!op1 && op1[0] === '.', !!op1 && op1[op1.length - 1] === '.');
  const p1 = splitA1(part1);
  const p2 = part2 ? splitA1(part2) : null;
  if (!p1 || (part2 && !p2)) {
    // invalid section
    return null;
  }
  // part 1 bits
  if (p1[0] != null && p1[1] != null) {
    [ top, left, $top, $left ] = p1;
  }
  else if (p1[0] == null && p1[1] != null) {
    [ , left, , $left ] = p1;
  }
  else if (p1[0] != null && p1[1] == null) {
    [ top, , $top ] = p1;
  }
  // part 2 bits
  if (!part2) {
    // part 2 must exist if either top or left is null:
    // this disallows a single num or col patterns
    if (top == null || left == null) {
      return null;
    }
    bottom = top;
    right = left;
    $bottom = $top;
    $right = $left;
  }
  else if (p2[0] != null && p2[1] != null) {
    [ bottom, right, $bottom, $right ] = p2;
  }
  else if (p2[0] == null && p2[1] != null) {
    [ , right, , $right ] = p2;
  }
  else if (p2[0] != null && p2[1] == null) {
    [ bottom, , $bottom ] = p2;
  }
  // flip left/right and top/bottom as needed
  // for partial ranges we perfer the coord on the left-side of the :
  if (right != null && (left == null || (left != null && right < left))) {
    [ left, right, $left, $right ] = [ right, left, $right, $left ];
  }
  if (bottom != null && (top == null || (top != null && bottom < top))) {
    [ top, bottom, $top, $bottom ] = [ bottom, top, $bottom, $top ];
  }
  const r = { top, left, bottom, right, $top, $left, $bottom, $right };
  if (trim) { r.trim = trim; }
  return r;
}

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseA1Ref('Sheet1!A$1:$B2');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     top: 0,
 * //     left: 0,
 * //     bottom: 1,
 * //     right: 1
 * //     $top: true,
 * //     $left: false,
 * //     $bottom: false,
 * //     $right: true
 * //   }
 * // }
 * ```
 *
 * For A:A or A1:A style ranges, `null` will be used for any dimensions that the
 * syntax does not specify:
 *
 * @param {string} refString  An A1-style reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceA1|null)} An object representing a valid reference or null if it is invalid.
 */
export function parseA1Ref (refString, { allowNamed = true, allowTernary = false, xlsx = false } = {}) {
  const d = parseRef(refString, { allowNamed, allowTernary, xlsx, r1c1: false });
  if (d && (d.r0 || d.name)) {
    let range = null;
    if (d.r0) {
      range = fromA1(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
    }
    if (range) {
      return xlsx
        ? { workbookName: d.workbookName, sheetName: d.sheetName, range }
        : { context: d.context, range };
    }
    if (d.name) {
      return xlsx
        ? { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name }
        : { context: d.context, name: d.name };
    }
    return null;
  }
  return null;
}

/**
 * Get an A1-style string representation of a reference object.
 *
 * ```js
 * stringifyA1Ref({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     top: 0,
 *     left: 0,
 *     bottom: 1,
 *     right: 1,
 *     $top: true,
 *     $left: false,
 *     $bottom: false,
 *     $right: true
 *   }
 * });
 * // => 'Sheet1!A$1:$B2'
 * ```
 *
 * @param {ReferenceA1} refObject A reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {string} The reference in A1-style string format
 */
export function stringifyA1Ref (refObject, { xlsx = false } = {}) {
  const prefix = xlsx
    ? stringifyPrefixAlt(refObject)
    : stringifyPrefix(refObject);
  return prefix + (
    refObject.name ? refObject.name : toA1(refObject.range)
  );
}

/**
 * Fill the any missing bounds in range objects. Top will be set to 0, bottom to
 * 1048575, left to 0, and right to 16383, if they are `null` or `undefined`.
 *
 * ```js
 * addA1RangeBounds({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     top: 0,
 *     left: 0,
 *     bottom: 1,
 *     $top: true,
 *     $left: false,
 *     $bottom: false,
 *   }
 * });
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     top: 0,
 * //     left: 0,
 * //     bottom: 1,
 * //     right: 16383,
 * //     $top: true,
 * //     $left: false,
 * //     $bottom: false,
 * //     $right: false
 * //   }
 * // }
 * ```
 *
 * @param {RangeA1} range The range part of a reference object.
 * @returns {RangeA1} same range with missing bounds filled in.
 */
export function addA1RangeBounds (range) {
  if (range.top == null) {
    range.top = 0;
    range.$top = false;
  }
  if (range.bottom == null) {
    range.bottom = MAX_ROWS;
    range.$bottom = false;
  }
  if (range.left == null) {
    range.left = 0;
    range.$left = false;
  }
  if (range.right == null) {
    range.right = MAX_COLS;
    range.$right = false;
  }
  return range;
}
