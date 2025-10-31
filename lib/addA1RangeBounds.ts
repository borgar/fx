import { MAX_ROWS, MAX_COLS } from './constants.ts';
import type { RangeA1 } from './types.ts';

/**
 * Fill the any missing bounds in range objects. Top will be set to 0, bottom to
 * 1048575, left to 0, and right to 16383, if they are `null` or `undefined`.
 *
 * ```js
 * addA1RangeBounds({
 *   top: 0,
 *   left: 0,
 *   bottom: 1,
 *   $top: true,
 *   $left: false,
 *   $bottom: false,
 * });
 * // => {
 * //   top: 0,
 * //   left: 0,
 * //   bottom: 1,
 * //   right: 16383,  // ← Added
 * //   $top: true,
 * //   $left: false,
 * //   $bottom: false,
 * //   $right: false  // ← Added
 * // }
 * ```
 *
 * @param range The range part of a reference object.
 * @returns The same range with missing bounds filled in.
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
