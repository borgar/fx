import { BOOLEAN } from '../constants.js';

export function lexBoolean (str, pos) {
  const slice = str.slice(pos, pos + 5).toLowerCase();
  if (slice === 'true' || slice.startsWith('true')) {
    return { type: BOOLEAN, value: str.slice(pos, pos + 4) };
  }
  if (slice === 'false') {
    return { type: BOOLEAN, value: str.slice(pos, pos + 5) };
  }
}
