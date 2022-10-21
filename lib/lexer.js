import {
  FX_PREFIX,
  NEWLINE,
  NUMBER,
  OPERATOR,
  PATH_BRACE,
  PATH_PREFIX,
  PATH_QUOTE,
  RANGE,
  RANGE_BEAM,
  RANGE_NAMED,
  STRING,
  UNKNOWN,
  WHITESPACE,
  tokenHandlersA1,
  tokenHandlersRC
} from './constants.js';

const isType = (t, type) => t && t.type === type;
const isRangeOp = t => t && t.value === ':';
const isBangOp = t => t && t.value === '!';

const defaultOptions = {
  emitRanges: false,
  mergeRanges: true,
  negativeNumbers: false,
  r1c1: false
};

export function getTokens (fx, tokenHandlers, options = {}) {
  const { emitRanges, mergeRanges, negativeNumbers } = Object.assign({}, defaultOptions, options);
  const tokens = [];
  let pos = 0;
  const lookBehind = n => tokens[tokens.length - n];
  const lookBehindIgnoreWS = n => {
    const noWs = tokens.filter(t => !isType(t, WHITESPACE) && !isType(t, NEWLINE));
    return noWs[noWs.length - n];
  };

  if (/^=/.test(fx)) {
    const token = {
      type: FX_PREFIX,
      value: '=',
      ...(emitRanges ? { range: [ 0, 1 ] } : {})
    };
    pos++;
    tokens.push(token);
  }

  while (pos < fx.length) {
    const startPos = pos;
    const s = fx.slice(pos);
    let tokenType = '';
    let tokenValue = '';
    for (let i = 0; i < tokenHandlers.length; i++) {
      const [ type, reTest, fnTest ] = tokenHandlers[i];
      const m = reTest.exec(s);
      if (m && (!fnTest || fnTest(m[0]))) {
        tokenType = type;
        tokenValue = m[0];
        pos += m[0].length;
        break;
      }
    }

    if (!tokenType) {
      tokenType = UNKNOWN;
      tokenValue = fx[pos];
      pos++;
    }

    let token = {
      type: tokenType,
      value: tokenValue,
      ...(emitRanges ? { range: [ startPos, pos ] } : {})
    };

    if (tokenType === STRING && !tokenValue.endsWith('"')) {
      token.unterminated = true;
    } else if (tokenType === PATH_BRACE && !tokenValue.endsWith(']')) {
      token.unterminated = true;
    } else if (tokenType === PATH_QUOTE && !tokenValue.endsWith("'")) {
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

    if (mergeRanges) {
      if (tokenType === RANGE || tokenType === RANGE_NAMED || tokenType === RANGE_BEAM) {
        const merge = [];
        // join A1:A1 or RC:RC-
        if (isRangeOp(lookBehind(1)) && isType(lookBehind(2), RANGE) && tokenType === RANGE) {
          // should not be done this if current or last ranges are A:A or 1:1, or R or C)
          merge.unshift(...tokens.splice(-2, 2));
        }
        // join prefixes
        if (isBangOp(lookBehind(1))) {
          if (isType(lookBehind(2), PATH_QUOTE) || isType(lookBehind(2), PATH_BRACE)) {
            merge.unshift(...tokens.splice(-2, 2));
          }
          else if (isType(lookBehind(2), PATH_PREFIX)) {
            const n = isType(lookBehind(3), PATH_BRACE) ? 3 : 2;
            merge.unshift(...tokens.splice(-n, n));
          }
        }
        // want to merge?
        if (merge.length) {
          token = {
            type: tokenType,
            value: merge.map(d => d.value).join('') + tokenValue,
            ...(emitRanges ? { range: [ merge[0].range[0], pos ] } : {})
          };
        }
      }
    }
    tokens.push(token);
  }

  return tokens;
}

// Formulas can either have RC or A1 style refs, not both: because C1 and R1 are both!
// Refmode: A1 | RC | Anostic emit ranges with RANGE
export function tokenize (fx, options = {}) {
  const tokenHandlers = options.r1c1 ? tokenHandlersRC : tokenHandlersA1;
  return getTokens(fx, tokenHandlers, options);
}
