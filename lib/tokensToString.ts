import type { Token } from './types.ts';

export function stringifyTokens (tokens: Token[]): string {
  let s = '';
  for (const token of tokens) {
    s += token.value;
  }
  return s;
}
