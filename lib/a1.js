import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRef } from './parseRef.js';
import { stringifyPrefix } from './stringifyPrefix.js';

const clamp = (min, val, max) => Math.min(Math.max(val, min), max);
const toColStr = (c, a) => (a ? '$' : '') + toCol(c);
const toRowStr = (r, a) => (a ? '$' : '') + toRow(r);

/**
 * Convert a column string representation to a 0 based
 * offset number (`"C"` = `2`).
 *
 * The method expects a valid column identifier made up of _only_
 * A-Z letters, which may be either upper or lower case. Other input will
 * return garbage.
 *
 * @param {string} columnString  The column string identifier
 * @return {number}  Zero based column index number
 */
export function fromCol (columnString) {
  const x = (columnString || '');
  const l = x.length;
  let n = 0;
  if (l > 2) {
    const c = x.charCodeAt(l - 3);
    const a = c > 95 ? 32 : 0;
    n += (1 + c - a - 65) * 676;
  }
  if (l > 1) {
    const c = x.charCodeAt(l - 2);
    const a = c > 95 ? 32 : 0;
    n += (1 + c - a - 65) * 26;
  }
  if (l) {
    const c = x.charCodeAt(l - 1);
    const a = c > 95 ? 32 : 0;
    n += (c - a) - 65;
  }
  return n;
}

/**
 * Convert a 0 based offset number to a column string
 * representation (`2` = `"C"`).
 *
 * The method expects a number between 0 and 16383. Other input will
 * return garbage.
 *
 * @param {number} columnIndex Zero based column index number
 * @return {string} The column string identifier
 */
export function toCol (columnIndex) {
  return (
    (columnIndex >= 702 ? String.fromCharCode((((columnIndex - 702) / 676) - 0) % 26 + 65) : '') +
    (columnIndex >= 26 ? String.fromCharCode(Math.floor(((columnIndex / 26) - 1) % 26 + 65)) : '') +
    String.fromCharCode((columnIndex % 26 + 65))
  );
}

export function fromRow (rowStr) {
  return +rowStr - 1;
}

export function toRow (top) {
  return String(top + 1);
}

export function toRelative (range) {
  const { top, left, bottom, right } = range;
  return { top, left, bottom, right, $left: false, $right: false, $top: false, $bottom: false };
}

export function toAbsolute (range) {
  const { top, left, bottom, right } = range;
  return { top, left, bottom, right, $left: true, $right: true, $top: true, $bottom: true };
}

/**
 * Stringify a range object into A1 syntax.
 *
 * @private
 * @see parseA1Ref
 * @param {Object} range  A range object
 * @return {string}  An A1-style string represenation of a range
 */
export function toA1 (range) {
  let { top, left, bottom, right } = range;
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
  // A:A
  if ((top === 0 && bottom >= MAX_ROWS) || (noTop && noBottom)) {
    return toColStr(left, $left) + ':' + toColStr(right, $right);
  }
  // 1:1
  else if ((left === 0 && right >= MAX_COLS) || (noLeft && noRight)) {
    return toRowStr(top, $top) + ':' + toRowStr(bottom, $bottom);
  }
  // A1:1
  else if (!noLeft && !noTop && !noRight && noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + ':' + toColStr(right, $right);
  }
  // A:A1 => A1:1
  else if (!noLeft && noTop && !noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(bottom, $bottom) + ':' + toColStr(right, $right);
  }
  // A1:A
  else if (!noLeft && !noTop && noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + ':' + toRowStr(bottom, $bottom);
  }
  // A:A1 => A1:A
  else if (noLeft && !noTop && !noRight && !noBottom) {
    return toColStr(right, $right) + toRowStr(top, $top) + ':' + toRowStr(bottom, $bottom);
  }
  // A1:A1
  if (right !== left || bottom !== top || $right !== $left || $bottom !== $top) {
    return toColStr(left, $left) + toRowStr(top, $top) + ':' +
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
 * @see parseA1Ref
 * @param {string} rangeString  A range string
 * @return {(Object|null)} An object representing a valid reference or null if it is invalid.
 */
export function fromA1 (rangeStr) {
  let top = null;
  let left = null;
  let bottom = null;
  let right = null;
  let $top = false;
  let $left = false;
  let $bottom = false;
  let $right = false;
  const [ part1, part2, part3 ] = rangeStr.split(':');
  if (part3) {
    return null;
  }
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
  return { top, left, bottom, right, $top, $left, $bottom, $right };
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
 * For A:A or A1:A style ranges, `null will be used for any dimensions that the
 * syntax does not specify:
 *
 * @param {string} refString  An A1-style reference string
 * @param {Object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @return {(Object|null)} An object representing a valid reference or null if it is invalid.
 */
export function parseA1Ref (refString, { allowNamed = true, allowTernary = false } = {}) {
  const d = parseRef(refString, { allowNamed, allowTernary, r1c1: false });
  if (d && (d.r0 || d.name)) {
    let range = null;
    if (d.r0) {
      range = fromA1(d.r1 ? d.r0 + ':' + d.r1 : d.r0);
    }
    if (d.name || range) {
      d.range = range;
      delete d.r0;
      delete d.r1;
      return d;
    }
    else {
      return null;
    }
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
 * @param {Object} refObject A reference object
 * @return {Object} The reference in A1-style string format
 */
export function stringifyA1Ref (refObject) {
  return stringifyPrefix(refObject) + (
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
 * @param {Object} range The range part of a reference object.
 * @return {Object} same range with missing bounds filled in.
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
