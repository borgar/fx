import {
  FX_PREFIX,
  NEWLINE,
  NUMBER,
  OPERATOR,
  REF_NAMED,
  STRING,
  UNKNOWN,
  WHITESPACE,
  FUNCTION
} from './constants.js';
import { lexers } from './lexerParts.js';
import { mergeRefTokens } from './mergeRefTokens.js';

const isType = (t, type) => t && t.type === type;

const defaultOptions = {
  withLocation: false,
  mergeRefs: true,
  allowTernary: false,
  negativeNumbers: true,
  r1c1: false
};

const isTextToken = token => {
  return (
    token.type === REF_NAMED ||
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
  const { withLocation, mergeRefs, negativeNumbers } = opts;
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
      if (withLocation) {
        lastToken.loc[1] = token.loc[1];
      }
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
      ...(withLocation ? { loc: [ 0, 1 ] } : {})
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
      ...(withLocation ? { loc: [ startPos, pos ] } : {})
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
          !causesBinaryMinus(tail1)
        ) {
          const minus = tokens.pop();
          token.value = '-' + tokenValue;
          if (withLocation) {
            // ensure offsets are up to date
            token.loc[0] = minus.loc[0];
          }
          // next step tries to counter the screwing around with the tailing
          // it should be correct again once we pushToken()
          tail0 = tail1;
          lastToken = tokens[tokens.length - 1];
        }
      }
    }

    pushToken(token);
  }

  if (mergeRefs) {
    return mergeRefTokens(tokens);
  }

  return tokens;
}

/**
 * Breaks a string formula into a list of tokens.
 *
 * The returned output will be an array of objects representing the tokens:
 *
 * ```js
 * [
 *   { type: FX_PREFIX, value: '=' },
 *   { type: FUNCTION, value: 'SUM' },
 *   { type: OPERATOR, value: '(' },
 *   { type: REF_RANGE, value: 'A1:B2' },
 *   { type: OPERATOR, value: ')' }
 * ]
 * ```
 *
 * Token types may be found as an Object as the
 * [`tokenTypes` export]{@link tokenTypes} on the package
 * (`import {tokenTypes} from '@borgar/fx';`).
 *
 * To support syntax highlighting as you type, `STRING` tokens are allowed to be
 * "unterminated". For example, the incomplete formula `="Hello world` would be
 * tokenized as:
 *
 * ```js
 * [
 *   { type: FX_PREFIX, value: '=' },
 *   { type: STRING, value: '"Hello world', unterminated: true },
 * ]
 * ```
 *
 * @see tokenTypes
 * @param {string} formula An Excel formula string (an Excel expression) or an array of tokens.
 * @param {object} [options={}]  Options
 * @param {boolean} [options.allowTernary=false]  Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported by Google Sheets but not Excel. See: References.md.
 * @param {boolean} [options.negativeNumbers=true]  Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1` (alternatively these will be unary operations in the tree).
 * @param {boolean} [options.r1c1=false]  Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
 * @param {boolean} [options.withLocation=true]  Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
 * @param {boolean} [options.mergeRefs=true]  Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens)
 * @param {boolean} [options.xlsx=false]  Enables a `[1]Sheet1!A1` or `[1]!name` syntax form for external workbooks found only in XLSX files.
 * @returns {Array<Token>} An AST of nodes
 */
export function tokenize (formula, options = {}) {
  return getTokens(formula, lexers, options);
}
