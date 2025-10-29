/*
** RC notation works differently from A1 in that we can't merge static
** references joined by `:`. Merging can only work between references
** that are relative/absolute on the same axes, so:
** - R1C1:R2C2 will work,
** - R[1]C1:R[2]C2 will also work, but
** - R[1]C[1]:R2C2 doesn't have a direct rectangle represention without context.
*/
import type { RangeR1C1 } from './types.ts';

function trimDirection (head: boolean, tail: boolean): 'both' | 'head' | 'tail' | undefined {
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

function parseR1C1Part (ref: string): [number, number, boolean, boolean] {
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

/**
 * Parse a simple string reference to an R1C1 range into a range object.
 * @internal
 */
export function fromR1C1 (rangeString: string): RangeR1C1 | null {
  let final: RangeR1C1 | null = null;
  const [ part1, op, part2, overflow ] = rangeString.split(/(\.?:\.?)/);
  if (overflow) {
    return null;
  }
  const range = parseR1C1Part(part1);
  // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
  const trim = trimDirection(!!op && op[0] === '.', !!op && op[op.length - 1] === '.');
  if (range) {
    const [ r0, c0, $r0, $c0 ] = range;
    if (part2) {
      const extendTo = parseR1C1Part(part2);
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
      final = {
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
      final = {
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
      final = {
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
  if (final && trim) {
    final.trim = trim;
  }
  return final;
}
