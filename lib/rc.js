/*
** RC notation works differently from A1 in that we can't merge static
** references joined by `:`. Merging can only work between references
** that are relative/absolute on the same axes, so:
** - R1C1:R2C2 will work,
** - R[1]C1:R[2]C2 will also work, but
** - R[1]C[1]:R2C2 doesn't have a direct rectangle represention without context.
*/
import { rangeOperator } from './a1.js';
import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRef } from './parseRef.js';
import { stringifyPrefix, stringifyPrefixAlt } from './stringifyPrefix.js';

const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

function toCoord (value, isAbs) {
  if (isAbs) {
    return String(value + 1);
  }
  return value ? '[' + value + ']' : '';
}

/**
 * Stringify a range object into R1C1 syntax.
 *
 * @ignore
 * @private
 * @see parseR1C1Ref
 * @param {RangeR1C1} range  A range object
 * @returns {string}  An R1C1-style string represenation of a range
 */
export function toR1C1 (range) {
  let { r0, c0, r1, c1 } = range;
  const { trimTL, trimBR } = range;
  const { $c0, $c1, $r0, $r1 } = range;
  const nullR0 = r0 == null;
  const nullC0 = c0 == null;
  let nullR1 = r1 == null;
  let nullC1 = c1 == null;
  const op = rangeOperator(trimTL, trimBR);
  const hasTrim = trimTL || trimBR;
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
  const allRows = r0 === 0 && r1 >= MAX_ROWS;
  if ((allRows && !nullC0 && !nullC1) || (nullR0 && nullR1)) {
    const a = toCoord(c0, $c0);
    const b = toCoord(c1, $c1);
    return 'C' + (a === b && !hasTrim ? a : a + op + 'C' + b);
  }
  // R:R
  const allCols = c0 === 0 && c1 >= MAX_COLS;
  if ((allCols && !nullR0 && !nullR1) || (nullC0 && nullC1)) {
    const a = toCoord(r0, $r0);
    const b = toCoord(r1, $r1);
    return 'R' + (a === b && !hasTrim ? a : a + op + 'R' + b);
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
      op +
      (nullR1 ? '' : 'R' + s_r1) +
      (nullC1 ? '' : 'C' + s_c1)
    );
  }
  // RC:RC
  if (s_r0 !== s_r1 || s_c0 !== s_c1) {
    return 'R' + s_r0 + 'C' + s_c0 + op + 'R' + s_r1 + 'C' + s_c1;
  }
  // RC
  return 'R' + s_r0 + 'C' + s_c0;
}

function parseR1C1Part (ref) {
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
 *
 * @private
 * @ignore
 * @see parseA1Ref
 * @param {string} rangeString  A range string
 * @returns {(RangeR1C1|null)} An object representing a valid reference or null if it is invalid.
 */
export function fromR1C1 (rangeString) {
  let final = null;
  const [ part1, op, part2, overflow ] = rangeString.split(/(\.?:\.?)/);
  if (overflow) {
    return null;
  }
  const range = parseR1C1Part(part1);
  const trimTL = !!op && op.at(0) === '.';
  const trimBR = !!op && op.at(-1) === '.';
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
        final.trimTL = trimTL;
        final.trimBR = trimBR;
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
        $c1: false,
        trimTL,
        trimBR
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
        $c1: $c0,
        trimTL,
        trimBR
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
        $c1: $c0 || false,
        trimTL,
        trimBR
      };
    }
  }
  return final;
}

/**
 * Parse a string reference into an object representing it.
 *
 * ```js
 * parseR1C1Ref('Sheet1!R[9]C9:R[9]C9');
 * // => {
 * //   context: [ 'Sheet1' ],
 * //   range: {
 * //     r0: 9,
 * //     c0: 8,
 * //     r1: 9,
 * //     c1: 8,
 * //     $c0: true,
 * //     $c1: true
 * //     $r0: false,
 * //     $r1: false
 * //   }
 * // }
 * ```
 *
 * @param {string} refString An R1C1-style reference string
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {(ReferenceR1C1|null)} An object representing a valid reference or null if it is invalid.
 */
export function parseR1C1Ref (refString, { allowNamed = true, allowTernary = false, xlsx = false } = {}) {
  const d = parseRef(refString, { allowNamed, allowTernary, xlsx, r1c1: true });
  if (d && (d.r0 || d.name)) {
    const range = d.r1
      ? fromR1C1(d.r0 + d.operator + d.r1)
      : fromR1C1(d.r0);
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
 * Get an R1C1-style string representation of a reference object.
 *
 * ```js
 * stringifyR1C1Ref({
 *   context: [ 'Sheet1' ],
 *   range: {
 *     r0: 9,
 *     c0: 8,
 *     r1: 9,
 *     c1: 8,
 *     $c0: true,
 *     $c1: true
 *     $r0: false,
 *     $r1: false
 *   }
 * });
 * // => 'Sheet1!R[9]C9:R[9]C9'
 * ```
 *
 * @param {ReferenceR1C1} refObject A reference object
 * @param {object} [options={}]  Options
 * @param {boolean} [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns {string} The reference in R1C1-style string format
 */
export function stringifyR1C1Ref (refObject, { xlsx = false } = {}) {
  const prefix = xlsx
    ? stringifyPrefixAlt(refObject)
    : stringifyPrefix(refObject);
  return prefix + (
    refObject.name ? refObject.name : toR1C1(refObject.range)
  );
}
