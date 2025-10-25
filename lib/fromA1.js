import { fromCol } from './fromCol.js';

export function fromRow (rowStr) {
  return +rowStr - 1;
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
