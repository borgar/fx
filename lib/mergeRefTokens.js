import { CONTEXT, CONTEXT_QUOTE, RANGE, RANGE_NAMED, RANGE_BEAM, RANGE_TERNARY, OPERATOR } from './constants.js';

const END = '$';

const validRunsMerge = [
  [ RANGE, ':', RANGE ],
  [ RANGE ],
  [ RANGE_BEAM ],
  [ RANGE_TERNARY ],
  [ CONTEXT, '!', RANGE, ':', RANGE ],
  [ CONTEXT, '!', RANGE ],
  [ CONTEXT, '!', RANGE_BEAM ],
  [ CONTEXT, '!', RANGE_TERNARY ],
  [ CONTEXT_QUOTE, '!', RANGE, ':', RANGE ],
  [ CONTEXT_QUOTE, '!', RANGE ],
  [ CONTEXT_QUOTE, '!', RANGE_BEAM ],
  [ CONTEXT_QUOTE, '!', RANGE_TERNARY ],
  [ RANGE_NAMED ],
  [ CONTEXT, '!', RANGE_NAMED ],
  [ CONTEXT_QUOTE, '!', RANGE_NAMED ]
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
      // adjust the range to include all the text
      if (token.range && toMerge[0].range) {
        token.range[0] = toMerge[0].range[0];
      }
      i -= valid - 1;
    }
    finalTokens.unshift(token);
  }
  return finalTokens;
}
