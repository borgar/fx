import { OPERATOR_TRIM } from '../constants.ts';
import type { Token } from '../types.ts';
import { startsSheetPrefix } from './advSheetName.ts';

const PERIOD = 46;
const COLON = 58;

export function lexRangeTrim (str: string, pos: number, options: { r1c1?: boolean } = {}): Token | undefined {
  const c0 = str.charCodeAt(pos);
  if (c0 === PERIOD || c0 === COLON) {
    // "." is a sheet-name character, so a sheet may be named ".", and ".:Dec!A1" is then a sheet
    // range rather than a trim operator with nothing on its left. A prefix belongs to the context
    // lexers whole, so give way to one here as the range lexers do.
    if (c0 === PERIOD && startsSheetPrefix(str, pos, !!options.r1c1)) {
      return;
    }
    const c1 = str.charCodeAt(pos + 1);
    if (c0 !== c1) {
      if (c1 === COLON) {
        return {
          type: OPERATOR_TRIM,
          value: str.slice(pos, pos + (str.charCodeAt(pos + 2) === PERIOD ? 3 : 2))
        };
      }
      else if (c1 === PERIOD) {
        return {
          type: OPERATOR_TRIM,
          value: str.slice(pos, pos + 2)
        };
      }
    }
  }
}
