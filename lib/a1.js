import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRef } from './parseRef.js';

export function fromCol (columnId) {
  const x = (columnId || '');
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

export function toCol (left) {
  return (
    (left >= 702 ? String.fromCharCode((((left - 702) / 676) - 0) % 26 + 65) : '') +
    (left >= 26 ? String.fromCharCode(Math.floor(((left / 26) - 1) % 26 + 65)) : '') +
    String.fromCharCode((left % 26 + 65))
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

export function toA1 (range) {
  const toAbs = d => (d ? '$' : '');
  const { top, left, bottom, right, $left, $right, $top, $bottom } = range;
  // A:A
  if (top === 0 && bottom === MAX_ROWS) {
    return toAbs($left) + toCol(left) + ':' + toAbs($right) + toCol(right);
  }
  // 1:1
  if (left === 0 && right === MAX_COLS) {
    return toAbs($top) + toRow(top) + ':' + toAbs($bottom) + toRow(bottom);
  }
  // A1:A1
  if (right != null && bottom != null && (right !== left || bottom !== top)) {
    return toAbs($left) + toCol(left) + toAbs($top) + toRow(top) + ':' + toAbs($right) + toCol(right) + toAbs($bottom) + toRow(bottom);
  }
  // A1
  return toAbs($left) + toCol(left) + toAbs($top) + toRow(top);
}

export function fromA1 (rangeStr) {
  let m;
  let top = 0;
  let left = 0;
  let bottom = MAX_ROWS;
  let right = MAX_COLS;
  let $top = false;
  let $left = false;
  let $bottom = false;
  let $right = false;
  // A:A
  if ((m = /^(\$?)([A-Z]{1,3}):(\$?)([A-Z]{1,3})$/.exec(rangeStr))) {
    const a = fromCol(m[2]);
    const b = fromCol(m[4]);
    left = Math.min(a, b);
    right = Math.max(a, b);
    $left = !!m[a <= b ? 1 : 3];
    $right = !!m[a <= b ? 3 : 1];
    $top = true;
    $bottom = true;
    return { top, left, bottom, right, $top, $left, $bottom, $right };
  }
  // 1:1
  else if ((m = /^(\$?)([1-9]\d{0,6}):(\$?)([1-9]\d{0,6})$/.exec(rangeStr))) {
    const a = fromRow(m[2]);
    const b = fromRow(m[4]);
    top = Math.min(a, b);
    bottom = Math.max(a, b);
    $top = !!m[a <= b ? 1 : 3];
    $bottom = !!m[a <= b ? 3 : 1];
    $left = true;
    $right = true;
    return { top, left, bottom, right, $top, $left, $bottom, $right };
  }
  // A1 | A1:B2
  else {
    const [ part1, part2 ] = rangeStr.split(':');
    if ((m = /^(\$?)([A-Z]{1,3})(\$?)([1-9]\d{0,6})$/i.exec(part1))) {
      left = fromCol(m[2]);
      top = fromRow(m[4]);
      $left = !!m[1];
      $top = !!m[3];
      if (part2 && (m = /^(\$?)([A-Z]{1,3})(\$?)([1-9]\d{0,6})$/i.exec(part2))) {
        right = fromCol(m[2]);
        bottom = fromRow(m[4]);
        $right = !!m[1];
        $bottom = !!m[3];
        // need to flip?
        if (bottom < top) {
          [ top, bottom, $top, $bottom ] = [ bottom, top, $bottom, $top ];
        }
        if (right < left) {
          [ left, right, $left, $right ] = [ right, left, $right, $left ];
        }
      }
      else {
        bottom = top;
        right = left;
        $bottom = $top;
        $right = $left;
      }
      return { top, left, bottom, right, $top, $left, $bottom, $right };
    }
  }
  return null;
}

export function parseA1Ref (ref, allow_named = true) {
  const d = parseRef(ref, allow_named, false);
  if (d && (d.r0 || d.name)) {
    let range = null;
    if (d.r0) {
      range = d.r1 ? fromA1(d.r0 + ':' + d.r1) : fromA1(d.r0);
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

export default {
  fromCol,
  toCol,
  toRelative,
  toAbsolute,
  to: toA1,
  from: fromA1,
  parse: parseA1Ref
};
