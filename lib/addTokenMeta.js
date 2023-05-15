import { REF_RANGE, REF_BEAM, REF_TERNARY, UNKNOWN } from './constants.js';
import { parseA1Ref } from './a1.js';

function getIDer () {
  let i = 1;
  return () => 'fxg' + (i++);
}

function sameValue (a, b) {
  if (a == null && b == null) {
    return true;
  }
  return a === b;
}

function sameStr (a, b) {
  if (!a && !b) {
    return true;
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function isEquivalent (refA, refB) {
  // if named, name must match
  if ((refA.name || refB.name) && refA.name !== refB.name) {
    return false;
  }
  // if ranged, range must have the same dimensions (we don't care about $)
  if (refA.range || refB.range) {
    if (
      !sameValue(refA.range.top, refB.range.top) ||
      !sameValue(refA.range.bottom, refB.range.bottom) ||
      !sameValue(refA.range.left, refB.range.left) ||
      !sameValue(refA.range.right, refB.range.right)
    ) {
      return false;
    }
  }
  // must have same context
  if (
    !sameStr(refA.context[0], refB.context[0]) ||
    !sameStr(refA.context[1], refB.context[1])
  ) {
    return false;
  }
  return true;
}

/**
 * Runs through a list of tokens and adds extra attributes such as matching
 * parens and ranges.
 *
 * The `context` parameter defines default reference attributes:
 * `{ workbookName: 'report.xlsx', sheetName: 'Sheet1' }`.
 * If supplied, these are used to match `A1` to `Sheet1!A1`.
 *
 * All tokens will be tagged with a `.depth` number value to indicating the
 * level of nesting in parentheses as well as an `.index` number indicating
 * their zero based position in the list.
 *
 * The returned output will be the same array of tokens but the following
 * properties will added to tokens (as applicable):
 *
 * #### Parentheses ( )
 *
 * Matching parens will be tagged with `.groupId` string identifier as well as
 * a `.depth` number value (indicating the level of nesting).
 *
 * Closing parens without a counterpart will be tagged with `.error`
 * (boolean true).
 *
 * #### Curly brackets { }
 *
 * Matching curly brackets will be tagged with `.groupId` string identifier.
 * These may not be nested in Excel.
 *
 * Closing curly brackets without a counterpart will be tagged with `.error`
 * (boolean `true`).
 *
 * #### Ranges (`REF_RANGE` or `REF_BEAM` type tokens)
 *
 * All ranges will be tagged with `.groupId` string identifier regardless of
 * the number of times they occur.
 *
 * #### Tokens of type `UNKNOWN`
 *
 * All will be tagged with `.error` (boolean `true`).
 *
 * @param {Array<Object>} tokenlist An array of tokens (from `tokenize()`)
 * @param {Object} [context={}] A contest used to match `A1` to `Sheet1!A1`.
 * @param {string} [context.sheetName=''] An implied sheet name ('Sheet1')
 * @param {string} [context.workbookName=''] An implied workbook name ('report.xlsx')
 * @return {Array<Object>} The input array with the enchanced tokens
 */
export function addTokenMeta (tokens, { sheetName = '', workbookName = '' } = {}) {
  const parenStack = [];
  let arrayStart = null;
  const uid = getIDer();
  const knownRefs = [];

  const getCurrDepth = () => parenStack.length + (arrayStart ? 1 : 0);

  tokens.forEach((token, i) => {
    token.index = i;
    token.depth = getCurrDepth();
    if (token.value === '(') {
      parenStack.push(token);
      token.depth = getCurrDepth();
    }
    else if (token.value === ')') {
      const counter = parenStack.pop();
      if (counter) {
        const pairId = uid();
        token.groupId = pairId;
        token.depth = counter.depth;
        counter.groupId = pairId;
      }
      else {
        token.error = true;
      }
    }
    else if (token.value === '{') {
      if (!arrayStart) {
        arrayStart = token;
        token.depth = getCurrDepth();
      }
      else {
        token.error = true;
      }
    }
    else if (token.value === '}') {
      if (arrayStart) {
        const pairId = uid();
        token.groupId = pairId;
        token.depth = arrayStart.depth;
        arrayStart.groupId = pairId;
      }
      else {
        token.error = true;
      }
      arrayStart = null;
    }
    else if (token.type === REF_RANGE || token.type === REF_BEAM || token.type === REF_TERNARY) {
      const ref = parseA1Ref(token.value, { allowTernary: true });
      if (ref && ref.range) {
        ref.source = token.value;
        if (!ref.context.length) {
          ref.context = [ workbookName, sheetName ];
        }
        else if (ref.context.length === 1) {
          const scope = ref.context[0];
          if (scope === sheetName || scope === workbookName) {
            ref.context = [ workbookName, sheetName ];
          }
          else {
            // a single scope on a non-named range is going to be a sheet name
            ref.context = [ workbookName, scope ];
          }
        }
        const known = knownRefs.find(d => isEquivalent(d, ref));
        if (known) {
          token.groupId = known.groupId;
        }
        else {
          ref.groupId = uid();
          token.groupId = ref.groupId;
          knownRefs.push(ref);
        }
      }
    }
    else if (token.type === UNKNOWN) {
      token.error = true;
    }
  });
  return tokens;
}
