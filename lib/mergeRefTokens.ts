import { CONTEXT, CONTEXT_QUOTE, REF_RANGE, REF_NAMED, REF_BEAM, REF_TERNARY, OPERATOR, REF_STRUCT } from './constants.ts';
import type { Token } from './types.ts';

const END = '$';

const validRunsMerge = [
  [ REF_RANGE, ':', REF_RANGE ],
  [ REF_RANGE, '.:', REF_RANGE ],
  [ REF_RANGE, ':.', REF_RANGE ],
  [ REF_RANGE, '.:.', REF_RANGE ],
  [ REF_RANGE ],
  [ REF_BEAM ],
  [ REF_TERNARY ],
  [ CONTEXT, '!', REF_RANGE, ':', REF_RANGE ],
  [ CONTEXT, '!', REF_RANGE, '.:', REF_RANGE ],
  [ CONTEXT, '!', REF_RANGE, ':.', REF_RANGE ],
  [ CONTEXT, '!', REF_RANGE, '.:.', REF_RANGE ],
  [ CONTEXT, '!', REF_RANGE ],
  [ CONTEXT, '!', REF_BEAM ],
  [ CONTEXT, '!', REF_TERNARY ],
  [ CONTEXT_QUOTE, '!', REF_RANGE, ':', REF_RANGE ],
  [ CONTEXT_QUOTE, '!', REF_RANGE, '.:', REF_RANGE ],
  [ CONTEXT_QUOTE, '!', REF_RANGE, ':.', REF_RANGE ],
  [ CONTEXT_QUOTE, '!', REF_RANGE, '.:.', REF_RANGE ],
  [ CONTEXT_QUOTE, '!', REF_RANGE ],
  [ CONTEXT_QUOTE, '!', REF_BEAM ],
  [ CONTEXT_QUOTE, '!', REF_TERNARY ],
  [ REF_NAMED ],
  [ CONTEXT, '!', REF_NAMED ],
  [ CONTEXT_QUOTE, '!', REF_NAMED ],
  [ REF_STRUCT ],
  [ REF_NAMED, REF_STRUCT ],
  [ CONTEXT, '!', REF_NAMED, REF_STRUCT ],
  [ CONTEXT_QUOTE, '!', REF_NAMED, REF_STRUCT ]
];

type TypeNode = {
  [key: string]: TypeNode | boolean;
};

// valid token runs are converted to a tree structure
const refPartsTree: TypeNode = {};
function packList (f: string[], node: TypeNode) {
  if (f.length) {
    const key = f[0];
    if (!node[key]) { node[key] = {}; }
    packList(f.slice(1), node[key] as TypeNode);
  }
  else {
    node[END] = true;
  }
}
validRunsMerge.forEach(run => packList(run.concat().reverse(), refPartsTree));

// attempt to match a backwards run of tokens from a given point
// to a path in the tree
const matcher = (tokens: Token[], currNode, anchorIndex, index = 0) => {
  let i = index;
  let node = currNode;
  const max = tokens.length - index;
  // keep walking as long as the next backward token matches a child key
  while (i <= max) {
    const token = tokens[anchorIndex - i];
    if (token) {
      const key = (token.type === OPERATOR) ? token.value : token.type;
      if (key in node) {
        node = node[key];
        i += 1;
        continue;
      }
    }
    // can't advance further; accept only if current node is a terminal
    return node[END] ? i : 0;
  }
};

/**
 * Merges context with reference tokens as possible in a list of tokens.
 *
 * When given a tokenlist, this function returns a new list with ranges returned
 * as whole references (`Sheet1!A1:B2`) rather than separate tokens for each
 * part: (`Sheet1`,`!`,`A1`,`:`,`B2`).
 *
 * @param tokenlist An array of tokens.
 * @returns A new list of tokens with range parts merged.
 */
export function mergeRefTokens (tokenlist: Token[]): Token[] {
  const finalTokens = [];
  // this seeks backwards because it's really the range part
  // that controls what can be joined.
  for (let i = tokenlist.length - 1; i >= 0; i--) {
    let token = tokenlist[i];
    const type = token.type;
    // Quick check if token type could even start a valid run
    if (type === REF_RANGE || type === REF_BEAM || type === REF_TERNARY ||
        type === REF_NAMED || type === REF_STRUCT) {
      const valid = matcher(tokenlist, refPartsTree, i);
      if (valid > 1) {
        token = { ...token, value: '' };
        const start = i - valid + 1;
        for (let j = start; j <= i; j++) {
          token.value += tokenlist[j].value;
        }
        // adjust the offsets to include all the text
        if (token.loc && tokenlist[start].loc) {
          token.loc[0] = tokenlist[start].loc[0];
        }
        i -= valid - 1;
      }
    }
    finalTokens[finalTokens.length] = token;
  }
  return finalTokens.reverse();
}
