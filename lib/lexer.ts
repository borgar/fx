import {
  FX_PREFIX,
  NEWLINE,
  NUMBER,
  OPERATOR,
  REF_NAMED,
  UNKNOWN,
  WHITESPACE,
  FUNCTION,
  OPERATOR_TRIM,
  REF_RANGE
} from './constants.ts';
import { mergeRefTokens } from './mergeRefTokens.ts';
import { lexers, type PartLexer } from './lexers/sets.ts';
import type { Token } from './extraTypes.ts';

const reLetLambda = /^l(?:ambda|et)$/i;
const isType = (t: Token, type: string) => t && t.type === type;
const isTextTokenType = (tokenType: string) => tokenType === REF_NAMED || tokenType === FUNCTION;

const causesBinaryMinus = (token: Token) => {
  return !isType(token, OPERATOR) || (
    token.value === '%' ||
    token.value === '}' ||
    token.value === ')' ||
    token.value === '#'
  );
};

function fixRCNames (tokens: Token[]): Token[] {
  let withinCall = 0;
  let parenDepth = 0;
  let lastToken: Token;
  for (const token of tokens) {
    if (token.type === OPERATOR) {
      if (token.value === '(') {
        parenDepth++;
        if (lastToken.type === FUNCTION) {
          if (reLetLambda.test(lastToken.value)) {
            withinCall = parenDepth;
          }
        }
      }
      else if (token.value === ')') {
        parenDepth--;
        if (parenDepth < withinCall) {
          withinCall = 0;
        }
      }
    }
    else if (withinCall && token.type === UNKNOWN && /^[rc]$/.test(token.value)) {
      token.type = REF_NAMED;
    }
    lastToken = token;
  }
  return tokens;
}

type GetTokensOptions = {
  withLocation?: boolean,
  mergeRefs?: boolean,
  negativeNumbers?: boolean
  allowTernary?: boolean
  r1c1?: boolean
  xlsx?: boolean
};

export function getTokens (fx: string, tokenHandlers: PartLexer[], options: GetTokensOptions = {}) {
  const {
    withLocation = false,
    mergeRefs = true,
    negativeNumbers = true
  } = options;
  const opts = {
    withLocation: withLocation,
    mergeRefs: mergeRefs,
    allowTernary: options.allowTernary ?? false,
    negativeNumbers: negativeNumbers,
    r1c1: options.r1c1 ?? false,
    xlsx: options.xlsx ?? false
  };

  const tokens = [];
  let pos = 0;
  let letOrLambda = 0;
  let unknownRC = 0;
  const trimOps = [];

  let tail0: Token; // last non-whitespace token
  let tail1: Token; // penultimate non-whitespace token
  let lastToken: Token; // last token
  const pushToken = (token: Token) => {
    let tokenType = token.type;
    const isCurrUnknown = tokenType === UNKNOWN;
    const isLastUnknown = lastToken && lastToken.type === UNKNOWN;
    if (lastToken && (
      (isCurrUnknown && isLastUnknown) ||
      (isCurrUnknown && isTextTokenType(lastToken.type)) ||
      (isLastUnknown && isTextTokenType(tokenType))
    )) {
      // UNKNOWN tokens "contaminate" sibling text tokens
      lastToken.value += token.value;
      lastToken.type = UNKNOWN;
      if (withLocation) {
        lastToken.loc[1] = token.loc[1];
      }
    }
    else {
      if (tokenType === OPERATOR_TRIM) {
        trimOps.push(tokens.length);
        tokenType = UNKNOWN;
        token.type = UNKNOWN;
      }
      // push token as normally
      tokens[tokens.length] = token;
      lastToken = token;
      if (tokenType !== WHITESPACE && tokenType !== NEWLINE) {
        tail1 = tail0;
        tail0 = token;
      }
    }
  };

  if (fx.startsWith('=')) {
    const token: Token = { type: FX_PREFIX, value: '=' };
    if (withLocation) {
      token.loc = [ 0, 1 ];
    }
    pos++;
    pushToken(token);
  }

  const numHandlers = tokenHandlers.length;
  while (pos < fx.length) {
    const startPos = pos;
    let token;
    for (let i = 0; i < numHandlers; i++) {
      token = tokenHandlers[i](fx, pos, opts);
      if (token) {
        pos += token.value.length;
        break;
      }
    }

    if (!token) {
      token = {
        type: UNKNOWN,
        value: fx[pos]
      };
      pos++;
    }
    if (withLocation) {
      token.loc = [ startPos, pos ];
    }

    // make a note if we found a let/lambda call
    if (lastToken && token.value === '(' && lastToken.type === FUNCTION) {
      if (reLetLambda.test(lastToken.value)) {
        letOrLambda++;
      }
    }
    // make a note if we found a R or C unknown
    if (token.type === UNKNOWN && token.value.length === 1) {
      const valLC = token.value.toLowerCase();
      unknownRC += (valLC === 'r' || valLC === 'c') ? 1 : 0;
    }

    if (negativeNumbers && token.type === NUMBER) {
      const last1 = lastToken;
      // do we have a number preceded by a minus?
      if (last1?.type === OPERATOR && last1.value === '-') {
        // missing tail1 means we are at the start of the stream
        if (
          !tail1 ||
          tail1.type === FX_PREFIX ||
          !causesBinaryMinus(tail1)
        ) {
          const minus = tokens.pop();
          token.value = '-' + token.value;
          if (token.loc) {
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

  // if we encountered both a LAMBDA/LET call, and unknown 'r' or 'c' tokens
  // we'll turn the unknown tokens into names within the call.
  if (unknownRC && letOrLambda) {
    fixRCNames(tokens);
  }

  // Any OPERATOR_TRIM tokens have been indexed already, they now need to be
  // either turned into OPERATORs or UNKNOWNs. Trim operators are only allowed
  // between two REF_RANGE tokens as they are not valid in expressions as full
  // operators.
  for (const index of trimOps) {
    const before = tokens[index - 1];
    const after = tokens[index + 1];
    tokens[index].type = (before?.type === REF_RANGE && after?.type === REF_RANGE)
      ? OPERATOR
      : UNKNOWN;
  }

  if (mergeRefs) {
    return mergeRefTokens(tokens);
  }

  return tokens;
}

export type TokenizeOptions = {
  /**
   * Nodes will include source position offsets to the tokens: `{ loc: [ start, end ] }`
   * @defaultValue true
   */
  withLocation?: boolean,
  /**
   * Should ranges be returned as whole references (`Sheet1!A1:B2`) or as separate tokens for each
   * part: (`Sheet1`,`!`,`A1`,`:`,`B2`). This is the same as calling [`mergeRefTokens`](#mergeRefTokens)
   * @defaultValue true
   */
  mergeRefs?: boolean,
  /**
   * Merges unary minuses with their immediately following number tokens (`-`,`1`) => `-1`
   * (alternatively these will be unary operations in the tree).
   * @defaultValue true
   */
  negativeNumbers?: boolean
  /**
   * Enables the recognition of ternary ranges in the style of `A1:A` or `A1:1`. These are supported
   * by Google Sheets but not Excel. See: References.md.
   * @defaultValue false
   */
  allowTernary?: boolean
  /**
   * Ranges are expected to be in the R1C1 style format rather than the more popular A1 style.
   * @defaultValue false
   */
  r1c1?: boolean
  /**
   * Enables a `[1]Sheet1!A1` or `[1]!name` syntax form for external workbooks found only in XLSX files.
   * @defaultValue false
   */
  xlsx?: boolean
};

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
 * _Warning:_ To support syntax highlighting as you type, `STRING` tokens are allowed to be
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
 * @param formula An Excel formula string (an Excel expression).
 * @param [options]  Options
 * @returns An array of Tokens
 */
export function tokenize (
  formula: string,
  options: TokenizeOptions = {}
): Token[] {
  return getTokens(formula, lexers, options);
}
