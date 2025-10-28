import { MAX_ROWS, MAX_COLS } from './constants.js';
import { parseRefCtx, parseRefXlsx } from './parseRef.js';
import { toCol } from './toCol.js';
import { stringifyPrefix, stringifyPrefixAlt } from './stringifyPrefix.js';
import { fromA1 } from './fromA1.js';
import type { RangeA1, ReferenceA1, ReferenceA1Xlsx, ReferenceName, ReferenceNameXlsx } from './extraTypes.ts';

const clamp = (min: number, val: number, max: number) => Math.min(Math.max(val, min), max);
const toColStr = (c: number, a: boolean) => (a ? '$' : '') + toCol(c);
const toRowStr = (r: number, a: boolean) => (a ? '$' : '') + toRow(r);

export function toRelative (range: RangeA1): RangeA1 {
  return Object.assign({}, range, { $left: false, $right: false, $top: false, $bottom: false });
}

export function toAbsolute (range: RangeA1): RangeA1 {
  return Object.assign({}, range, { $left: true, $right: true, $top: true, $bottom: true });
}

export function toRow (top: number): string {
  return String(top + 1);
}

export function rangeOperator (trim: 'head' | 'tail' | 'both' | null | undefined): string {
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

/**
 * Stringify a range object into A1 syntax.
 * @param range A range object
 * @returns An A1-style string represenation of a range
 * @internal
 */
export function toA1 (range: Partial<RangeA1>): string {
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
 * @param refString  An A1-style reference string
 * @param [options.allowNamed=true]  Enable parsing names as well as ranges.
 * @param [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns An object representing a valid reference or null if it is invalid.
 */
export function parseA1Ref (
  refString: string,
  {
    allowNamed = true,
    allowTernary = false,
    xlsx = false
  }: {
    allowNamed?: boolean;
    allowTernary?: boolean;
    xlsx?: boolean;
  } = {}
): ReferenceA1 | ReferenceA1Xlsx | ReferenceName | ReferenceNameXlsx | null {
  if (xlsx) {
    const d = parseRefXlsx(refString, { allowNamed, allowTernary, r1c1: false });
    if (d) {
      if (d.name) {
        return { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name };
      }
      else if (d.r0) {
        if (d.r0) {
          const range = fromA1(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
          if (range) {
            return { workbookName: d.workbookName, sheetName: d.sheetName, range };
          }
        }
      }
    }
  }
  else {
    const d = parseRefCtx(refString, { allowNamed, allowTernary, r1c1: false });
    if (d) {
      if (d.name) {
        return { context: d.context, name: d.name };
      }
      else if (d.r0) {
        const range = fromA1(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
        if (range) {
          return { context: d.context, range };
        }
      }
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
 * @param refObject A reference object
 * @param [options.xlsx=false]  Switches to the `[1]Sheet1!A1` or `[1]!name` prefix syntax form for external workbooks. See: [Prefixes.md](./Prefixes.md)
 * @returns The reference in A1-style string format
 */
export function stringifyA1Ref (
  refObject: ReferenceA1 | ReferenceName | ReferenceA1Xlsx | ReferenceNameXlsx,
  { xlsx = false }: { xlsx?: boolean; } = {}
): string {
  const prefix = xlsx
    ? stringifyPrefixAlt(refObject as ReferenceA1Xlsx | ReferenceNameXlsx)
    : stringifyPrefix(refObject as ReferenceA1 | ReferenceName);
  return prefix + (
    'name' in refObject ? refObject.name : toA1(refObject.range)
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
 * @param range The range part of a reference object.
 * @returns same range with missing bounds filled in.
 */
export function addA1RangeBounds (range: RangeA1): RangeA1 {
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
