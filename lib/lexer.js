import {
  FX_PREFIX,
  NEWLINE,
  NUMBER,
  OPERATOR,
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
  allowTernary: false,
  negativeNumbers: true,
  r1c1: false
};

const isTextToken = token => {
  return (
    token.type === RANGE_NAMED ||
    token.type === FUNCTION
  );
};

const causesBinaryMinus = token => {
  return !isType(token, OPERATOR) || (
    token.value === '%' ||
    token.value === '}' ||
    token.value === ')' ||
    token.value === '#'
  );
};

export function getTokens (fx, tokenHandlers, options = {}) {
  const opts = Object.assign({}, defaultOptions, options);
  const { emitRanges, mergeRanges, negativeNumbers } = opts;
  const tokens = [];
  let pos = 0;

  let tail0 = null; // last non-whitespace token
  let tail1 = null; // penultimate non-whitespace token
  let lastToken = null; // last token
  const pushToken = token => {
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
      lastToken = token;
      if (token.type !== WHITESPACE && token.type !== NEWLINE) {
        tail1 = tail0;
        tail0 = token;
      }
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

    // check for termination
    if (tokenType === STRING) {
      const l = tokenValue.length;
      if (tokenValue === '""') {
        // common case that IS terminated
      }
      else if (tokenValue === '"' || tokenValue[l - 1] !== '"') {
        token.unterminated = true;
      }
      else if (tokenValue !== '""' && tokenValue[l - 2] === '"') {
        let p = l - 1;
        while (tokenValue[p] === '"') { p--; }
        const atStart = (p + 1);
        const oddNum = ((l - p + 1) % 2 === 0);
        if (!atStart ^ oddNum) {
          token.unterminated = true;
        }
      }
    }

    if (negativeNumbers && tokenType === NUMBER) {
      const last1 = lastToken;
      // do we have a number preceded by a minus?
      if (last1 && isType(last1, OPERATOR) && last1.value === '-') {
        // missing tail1 means we are at the start of the stream
        if (
          !tail1 ||
          isType(tail1, FX_PREFIX) ||
          !causesBinaryMinus(tail1, OPERATOR)
        ) {
          tokens.pop();
          token.value = '-' + tokenValue;
          // next step tries to counter the screwing around with the tailing
          // it should be correct again once we pushToken()
          tail0 = tail1;
          lastToken = tokens[tokens.length - 1];
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
