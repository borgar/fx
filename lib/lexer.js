import {
  FX_PREFIX,
  NEWLINE,
  NUMBER,
  OPERATOR,
  PATH_BRACE,
  PATH_QUOTE,
  RANGE_NAMED,
  STRING,
  UNKNOWN,
  WHITESPACE,
  FUNCTION
} from './constants.js';
import { lexers } from './lexerParts.js';
import { mergeRefTokens } from './mergeRefTokens.js';

const isType = (t, type) => t && t.type === type;

const defaultOptions = {
  emitRanges: false,
  mergeRanges: true,
  negativeNumbers: false,
  r1c1: false
};

const isTextToken = token => {
  return (
    token.type === RANGE_NAMED ||
    token.type === FUNCTION
  );
};

export function getTokens (fx, tokenHandlers, options = {}) {
  const opts = Object.assign({}, defaultOptions, options);
  const { emitRanges, mergeRanges, negativeNumbers } = opts;
  const tokens = [];
  let pos = 0;
  const lookBehind = n => tokens[tokens.length - n];

  const lookBehindIgnoreWS = n => {
    const noWs = tokens.filter(t => !isType(t, WHITESPACE) && !isType(t, NEWLINE));
    return noWs[noWs.length - n];
  };

  const pushToken = token => {
    const lastToken = lookBehind(1);
    const isCurrUnknown = token.type === UNKNOWN;
    const isLastUnknown = lastToken && lastToken.type === UNKNOWN;
    if (lastToken && (
      (isCurrUnknown && isLastUnknown) ||
      (isCurrUnknown && isTextToken(lastToken)) ||
      (isLastUnknown && isTextToken(token))
    )) {
      // UNKNOWN tokens "contaminate" sibling text tokens
      lastToken.value += token.value;
      lastToken.type = UNKNOWN;
    }
    else {
      // push token as normally
      tokens.push(token);
    }
  };

  if (/^=/.test(fx)) {
    const token = {
      type: FX_PREFIX,
      value: '=',
      ...(emitRanges ? { range: [ 0, 1 ] } : {})
    };
    pos++;
    pushToken(token);
  }

  while (pos < fx.length) {
    const startPos = pos;
    const s = fx.slice(pos);
    let tokenType = '';
    let tokenValue = '';
    for (let i = 0; i < tokenHandlers.length; i++) {
      const t = tokenHandlers[i](s, opts);
      if (t) {
        tokenType = t.type;
        tokenValue = t.value;
        pos += tokenValue.length;
        break;
      }
    }

    if (!tokenType) {
      tokenType = UNKNOWN;
      tokenValue = fx[pos];
      pos++;
    }

    const token = {
      type: tokenType,
      value: tokenValue,
      ...(emitRanges ? { range: [ startPos, pos ] } : {})
    };

    if (tokenType === STRING && (tokenValue === '"' || !tokenValue.endsWith('"'))) {
      token.unterminated = true;
    }
    else if (tokenType === PATH_BRACE && !tokenValue.endsWith(']')) {
      token.unterminated = true;
    }
    else if (tokenType === PATH_QUOTE && (tokenValue === "'" || !tokenValue.endsWith("'"))) {
      token.unterminated = true;
    }

    if (negativeNumbers && tokenType === NUMBER) {
      const last1 = lookBehind(1);
      if (last1 && isType(last1, OPERATOR) && last1.value === '-') {
        // we have a number preceded by a minus
        const last2 = lookBehindIgnoreWS(2);
        // missing last2 means we are at the start of the stream
        if (!last2 || isType(last2, FX_PREFIX) || (isType(last2, OPERATOR) && ![ '%', '}', ')', '#' ].includes(last2.value))) {
          tokens.pop();
          token.value = '-' + tokenValue;
        }
      }
    }

    pushToken(token);
  }

  if (mergeRanges) {
    return mergeRefTokens(tokens);
  }

  return tokens;
}

// Formulas can either have RC or A1 style refs, not both: because C1 and R1 are both!
// Refmode: A1 | RC | Anostic emit ranges with RANGE
export function tokenize (fx, options = {}) {
  return getTokens(fx, lexers, options);
}
