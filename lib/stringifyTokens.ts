import type { Token } from './types.ts';

/**
 * Collapses a list of tokens into a formula string.
 *
 * @param tokens A list of tokens.
 * @returns A formula string.
 */
export function stringifyTokens (tokens: Token[]): string {
  let s = '';
  for (const token of tokens) {
    s += token.value;
  }
  return s;
}
