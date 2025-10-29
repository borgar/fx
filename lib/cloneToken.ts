import type { Token, TokenEnhanced } from './extraTypes.ts';

export function cloneToken<T extends Token | TokenEnhanced> (token: T): T {
  // Token
  const newToken: Partial<TokenEnhanced> = {
    type: token.type,
    value: token.value
  };
  if (token.loc) {
    newToken.loc = token.loc;
  }
  if (token.unterminated != null) {
    newToken.unterminated = token.unterminated;
  }
  // TokenEnhanced
  if (typeof token.index === 'number') {
    newToken.index = token.index;
    if (typeof token.groupId === 'string') {
      newToken.groupId = token.groupId;
    }
    if (typeof token.depth === 'number') {
      newToken.depth = token.depth;
    }
    if (typeof token.error === 'boolean') {
      newToken.error = token.error;
    }
  }
  return newToken as T;
}
