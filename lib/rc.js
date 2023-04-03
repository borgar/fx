/*
** RC notation works differently from A1 in that we can't merge static
** references joined by `:`. Merging can only work between references
** that are relative/absolute on the same axes, so:
** - R1C1:R2C2 will work,
** - R[1]C1:R[2]C2 will also work, but
** - R[1]C[1]:R2C2 doesn't have a direct rectangle represention without context.
*/
import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRef } from './parseRef.js';
import { stringifyPrefix } from './stringifyPrefix.js';

function toCoord (value, isAbs) {
  if (isAbs) {
    return String(value + 1);
  }
  return value ? '[' + value + ']' : '';
}

const clamp = (min, val, max) => Math.min(Math.max(val, min), max);
export function toRC (range) {
  let { r0, c0, r1, c1 } = range;
  const { $c0, $c1, $r0, $r1 } = range;
  const nullR0 = r0 == null;
  const nullC0 = c0 == null;
  let nullR1 = r1 == null;
  let nullC1 = c1 == null;
  r0 = clamp($r0 ? 0 : -MAX_ROWS, r0 | 0, MAX_ROWS);
  c0 = clamp($c0 ? 0 : -MAX_COLS, c0 | 0, MAX_COLS);
  if (!nullR0 && nullR1 && !nullC0 && nullC1) {
    r1 = r0;
    nullR1 = false;
    c1 = c0;
    nullC1 = false;
  }
  else {
    r1 = clamp($r1 ? 0 : -MAX_ROWS, r1 | 0, MAX_ROWS);
    c1 = clamp($c1 ? 0 : -MAX_COLS, c1 | 0, MAX_COLS);
  }
  // C:C
  if ((r0 === 0 && r1 >= MAX_ROWS) || (nullR0 && nullR1)) {
    const a = toCoord(c0, $c0);
    const b = toCoord(c1, $c1);
    return 'C' + (a === b ? a : a + ':C' + b);
  }
  // R:R
  if ((c0 === 0 && c1 >= MAX_COLS) || (nullC0 && nullC1)) {
    const a = toCoord(r0, $r0);
    const b = toCoord(r1, $r1);
    return 'R' + (a === b ? a : a + ':R' + b);
  }
  const s_r0 = toCoord(r0, $r0);
  const s_r1 = toCoord(r1, $r1);
  const s_c0 = toCoord(c0, $c0);
  const s_c1 = toCoord(c1, $c1);
  // RC:R, RC:C
  if (nullR0 || nullR1 || nullC0 || nullC1) {
    return (
      (nullR0 ? '' : 'R' + s_r0) +
      (nullC0 ? '' : 'C' + s_c0) +
      ':' +
      (nullR1 ? '' : 'R' + s_r1) +
      (nullC1 ? '' : 'C' + s_c1)
    );
  }
  // RC:RC
  if (s_r0 !== s_r1 || s_c0 !== s_c1) {
    return 'R' + s_r0 + 'C' + s_c0 + ':R' + s_r1 + 'C' + s_c1;
  }
  // RC
  return 'R' + s_r0 + 'C' + s_c0;
}

function parseRCPart (ref) {
  let r0 = null;
  let c0 = null;
  let $r0 = null;
  let $c0 = null;
  // R part
  const rm = /^R(?:\[([+-]?\d+)\]|(\d+))?/.exec(ref);
  if (rm) {
    if (rm[1]) {
      r0 = parseInt(rm[1], 10);
      $r0 = false;
    }
    else if (rm[2]) {
      r0 = parseInt(rm[2], 10) - 1;
      $r0 = true;
    }
    else {
      r0 = 0;
      $r0 = false;
    }
    ref = ref.slice(rm[0].length);
  }
  // C part
  const cm = /^C(?:\[([+-]?\d+)\]|(\d+))?/.exec(ref);
  if (cm) {
    if (cm[1]) {
      c0 = parseInt(cm[1], 10);
      $c0 = false;
    }
    else if (cm[2]) {
      c0 = parseInt(cm[2], 10) - 1;
      $c0 = true;
    }
    else {
      c0 = 0;
      $c0 = false;
    }
    ref = ref.slice(cm[0].length);
  }
  // must have at least one part (and nothing more)
  if ((!rm && !cm) || ref.length) {
    return null;
  }
  return [ r0, c0, $r0, $c0 ];
}

export function fromRC (ref) {
  let final = null;
  const [ part1, part2 ] = ref.split(':', 2);
  const range = parseRCPart(part1);
  if (range) {
    const [ r0, c0, $r0, $c0 ] = range;
    if (part2) {
      const extendTo = parseRCPart(part2);
      if (extendTo) {
        final = {};
        const [ r1, c1, $r1, $c1 ] = extendTo;
        // rows
        if (r0 != null && r1 != null) {
          final.r0 = $r0 === $r1 ? Math.min(r0, r1) : r0;
          final.$r0 = $r0;
          final.r1 = $r0 === $r1 ? Math.max(r0, r1) : r1;
          final.$r1 = $r1;
        }
        else if (r0 != null && r1 == null) {
          // partial RC:C
          final.r0 = r0;
          final.$r0 = $r0;
          final.r1 = null;
          final.$r1 = $r0;
        }
        else if (r0 == null && r1 != null) {
          // partial C:RC
          final.r0 = r1;
          final.$r0 = $r1;
          final.r1 = null;
          final.$r1 = $r1;
        }
        else if (r0 == null && r1 == null) {
          // C:C
          final.r0 = null;
          final.$r0 = false;
          final.r1 = null;
          final.$r1 = false;
        }
        // columns
        if (c0 != null && c1 != null) {
          final.c0 = $c0 === $c1 ? Math.min(c0, c1) : c0;
          final.$c0 = $c0;
          final.c1 = $c0 === $c1 ? Math.max(c0, c1) : c1;
          final.$c1 = $c1;
        }
        else if (c0 != null && c1 == null) {
          final.c0 = c0;
          final.$c0 = $c0;
          final.c1 = null;
          final.$c1 = $c0;
        }
        else if (c0 == null && c1 != null) {
          final.c0 = c1;
          final.$c0 = $c1;
          final.c1 = null;
          final.$c1 = $c1;
        }
        else if (c0 == null && c1 == null) {
          final.c0 = null;
          final.$c0 = false;
          final.c1 = null;
          final.$c1 = false;
        }
      }
      else {
        return null;
      }
    }
    // range only - no second part
    else if (r0 != null && c0 == null) {
      return {
        r0: r0,
        c0: null,
        r1: r0,
        c1: null,
        $r0: $r0,
        $c0: false,
        $r1: $r0,
        $c1: false
      };
    }
    else if (r0 == null && c0 != null) {
      return {
        r0: null,
        c0: c0,
        r1: null,
        c1: c0,
        $r0: false,
        $c0: $c0,
        $r1: false,
        $c1: $c0
      };
    }
    else {
      return {
        r0: r0 || 0,
        c0: c0 || 0,
        r1: r0 || 0,
        c1: c0 || 0,
        $r0: $r0 || false,
        $c0: $c0 || false,
        $r1: $r0 || false,
        $c1: $c0 || false
      };
    }
  }
  return final;
}

export function parseRCRef (ref, { allowNamed = true, allowTernary = false } = {}) {
  const d = parseRef(ref, { allowNamed, allowTernary, r1c1: true });
  if (d && (d.r0 || d.name)) {
    const range = d.r1
      ? fromRC(d.r0 + ':' + d.r1)
      : fromRC(d.r0);
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

export function stringifyRCRef (ref) {
  return stringifyPrefix(ref) + (
    ref.name ? ref.name : toRC(ref.range)
  );
}

export default {
  to: toRC,
  from: fromRC,
  parse: parseRCRef,
  stringify: stringifyRCRef
};
