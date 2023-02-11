/*
** RC notation works differently from A1 in that we can't merge static
** references joined by `:`. Merging can only work between references
** that are relative/absolute on the same axes, so:
** - R1C1:R2C2 will work,
** - R[1]C1:R[2]C2 will also work, but
** - R[1]C[1]:R2C2 cannot be represented simply by a rectangle
**   without knowing the cell context.
*/

import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRef } from './parseRef.js';

function toCoord (value, isAbs) {
  if (isAbs) {
    return String(value + 1);
  }
  return value ? '[' + value + ']' : '';
}

export function toRC (range) {
  const { r0, c0, r1, c1, $c0, $c1, $r0, $r1 } = range;
  // C:C
  if (r0 === 0 && r1 === MAX_ROWS) {
    const a = toCoord(c0, $c0);
    const b = toCoord(c1, $c1);
    return 'C' + (a === b ? a : a + ':C' + b);
  }
  // R:R
  if (c0 === 0 && c1 === MAX_COLS) {
    const a = toCoord(r0, $r0);
    const b = toCoord(r1, $r1);
    return 'R' + (a === b ? a : a + ':R' + b);
  }
  // RC:RC
  const s_r0 = toCoord(r0, $r0);
  const s_r1 = toCoord(r1, $r1);
  const s_c0 = toCoord(c0, $c0);
  const s_c1 = toCoord(c1, $c1);
  if (s_r0 !== s_r1 || s_c0 !== s_c1) {
    return 'R' + s_r0 + 'C' + s_c0 + ':R' + s_r1 + 'C' + s_c1;
  }
  // RC
  return 'R' + s_r0 + 'C' + s_c0;
}

function parseRCPart (ref) {
  let r0 = 0;
  let c0 = 0;
  let r1 = MAX_ROWS;
  let c1 = MAX_COLS;
  let $r0 = false;
  let $c0 = false;
  let $r1 = false;
  let $c1 = false;
  // R part
  const rm = /^R(?:\[([+-]?\d+)\]|(\d+))?/.exec(ref);
  if (rm) {
    if (rm[1]) {
      r0 = parseInt(rm[1], 10);
    }
    else if (rm[2]) {
      r0 = parseInt(rm[2], 10) - 1;
      $r0 = true;
    }
    r1 = r0;
    $r1 = $r0;
    ref = ref.slice(rm[0].length);
  }
  else {
    // r0 = 0, r1 = MAX_ROWS
    $r0 = true;
    $r1 = true;
  }
  // C part
  const cm = /^C(?:\[([+-]?\d+)\]|(\d+))?/.exec(ref);
  if (cm) {
    if (cm[1]) {
      c0 = parseInt(cm[1], 10);
    }
    else if (cm[2]) {
      c0 = parseInt(cm[2], 10) - 1;
      $c0 = true;
    }
    c1 = c0;
    $c1 = $c0;
    ref = ref.slice(cm[0].length);
  }
  else {
    // c0 = 0, c1 = MAX_COLS
    $c0 = true;
    $c1 = true;
  }
  // must have at least one part (and nothing more)
  if ((!rm && !cm) || ref.length) {
    return null;
  }
  return { r0, c0, r1, c1, $r0, $c0, $r1, $c1 };
}

export function fromRC (ref) {
  const [ part1, part2 ] = ref.split(':', 2);
  const range = parseRCPart(part1);
  if (!range) {
    return null;
  }
  if (range && part2) {
    const extendTo = parseRCPart(part2);
    if (extendTo) {
      // Note: R[-1]C[-1]:R1C1 is only meaningful once we have an anchor
      range.r1 = extendTo.r1;
      range.c1 = extendTo.c1;
      range.$r1 = extendTo.$r1;
      range.$c1 = extendTo.$c1;
    }
    else {
      return null;
    }
  }
  return range;
}

export function parseRCRef (ref, allow_named = true) {
  const d = parseRef(ref, allow_named, true);
  if (d && (d.r0 || d.name)) {
    const range = d.r1 ? fromRC(d.r0 + ':' + d.r1) : fromRC(d.r0);
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
  to: toRC,
  from: fromRC,
  parse: parseRCRef
};
