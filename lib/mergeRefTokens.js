import { CONTEXT, CONTEXT_QUOTE, REF_RANGE, REF_NAMED, REF_BEAM, REF_TERNARY, OPERATOR, REF_STRUCT } from './constants.js';

const END = '$';

const validRunsMerge = [
  [ REF_RANGE, ':', REF_RANGE ],
  [ REF_RANGE ],
  [ REF_BEAM ],
  [ REF_TERNARY ],
  [ CONTEXT, '!', REF_RANGE, ':', REF_RANGE ],
  [ CONTEXT, '!', REF_RANGE ],
  [ CONTEXT, '!', REF_BEAM ],
  [ CONTEXT, '!', REF_TERNARY ],
  [ CONTEXT_QUOTE, '!', REF_RANGE, ':', REF_RANGE ],
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

// valid token runs are converted to a tree structure
const refPartsTree = {};
function packList (f, node) {
  if (f.length) {
    const key = f[0];
    node[key] = node[key] || {};
    packList(f.slice(1), node[key]);
  }
  else {
    node[END] = true;
  }
}
validRunsMerge.forEach(run => packList(run.concat().reverse(), refPartsTree));

// attempt to match a backwards run of tokens from a given point
// to a path in the tree
const matcher = (tokens, currNode, anchorIndex, index = 0) => {
  const token = tokens[anchorIndex - index];
  if (token) {
    const key = (token.type === OPERATOR) ? token.value : token.type;
    if (key in currNode) {
      return matcher(tokens, currNode[key], anchorIndex, index + 1);
    }
  }
  if (currNode[END]) {
    // we may end here so this is a match
    return index;
  }
  // no match
  return 0;
};

// merge reference tokens as possible in a list of tokens
export function mergeRefTokens (tokens) {
  const finalTokens = [];
  // this seeks backwards because it's really the range part
  // that controls what can be joined.
  for (let i = tokens.length - 1; i >= 0; i--) {
    let token = tokens[i];
    const valid = matcher(tokens, refPartsTree, i);
    if (valid) {
      const toMerge = tokens.slice(i - valid + 1, i + 1);
      // use the meta properties from the "first" token (right-most token)
      token = { ...token };
      token.value = toMerge.map(d => d.value).join('');
      // adjust the offsets to include all the text
      if (token.loc && toMerge[0].loc) {
        token.loc[0] = toMerge[0].loc[0];
      }
      i -= valid - 1;
    }
    finalTokens.unshift(token);
  }
  return finalTokens;
}
