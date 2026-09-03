import { CONTEXT, CONTEXT_QUOTE, REF_RANGE, REF_NAMED, REF_BEAM, REF_TERNARY, OPERATOR, REF_STRUCT, REF_CELL } from './constants.ts';
import { splitPrefix, unquotePrefix } from './parseRef.ts';
import type { Token } from './types.ts';

const END = '$';
const BR_OPEN = 91; // [
const BR_CLOSE = 93; // ]
const COLON = 58;

const validRunsMerge = [
  // A1 | A1:B2 | A:B | 1:2 | A1:B
  [ REF_CELL, ':', REF_CELL ],
  [ REF_CELL, '.:', REF_CELL ],
  [ REF_CELL, ':.', REF_CELL ],
  [ REF_CELL, '.:.', REF_CELL ],
  [ REF_RANGE ],
  [ REF_BEAM ],
  [ REF_TERNARY ],

  // Sheet1!A1 | 'Sheet1'!A1 | 'Sheet1:Sheet2'!A1
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, ':', REF_CELL ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, '.:', REF_CELL ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, ':.', REF_CELL ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, '.:.', REF_CELL ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_RANGE ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_BEAM ],
  [ [ CONTEXT, CONTEXT_QUOTE ], '!', REF_TERNARY ],

  // 'Sheet1':Sheet2!A1 | 'Sheet1':'Sheet2'!A1
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, ':', REF_CELL ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, '.:', REF_CELL ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, ':.', REF_CELL ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL, '.:.', REF_CELL ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_CELL ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_RANGE ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_BEAM ],
  [ CONTEXT_QUOTE, ':', [ CONTEXT, CONTEXT_QUOTE ], '!', REF_TERNARY ],

  // Sheet1:Sheet2!A1 | 'Sheet1':Sheet2!A1
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_CELL, ':', REF_CELL ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_CELL, '.:', REF_CELL ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_CELL, ':.', REF_CELL ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_CELL, '.:.', REF_CELL ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_CELL ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_RANGE ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_BEAM ],
  [ [ REF_NAMED, CONTEXT, CONTEXT_QUOTE ], ':', CONTEXT, '!', REF_TERNARY ],

  // name | Sheet1!name | Book1.xlsx!name
  [ REF_NAMED ],
  [ CONTEXT, '!', REF_NAMED ],
  [ CONTEXT_QUOTE, '!', REF_NAMED ], // XXX: Context must not contain a :

  // [col] | table![col] | Sheet1!table[col] | 'Sheet1'!table[col]
  [ REF_STRUCT ],
  [ REF_NAMED, REF_STRUCT ],
  [ CONTEXT, '!', REF_NAMED, REF_STRUCT ],
  [ CONTEXT_QUOTE, '!', REF_NAMED, REF_STRUCT ] // XXX: Context must not contain a :
];

type TypeNode = {
  [key: string]: TypeNode | boolean;
};

// valid token runs are converted to a tree structure
const refPartsTree: TypeNode = {};
function packList (f: (string | string[])[], node: TypeNode) {
  if (f.length) {
    const keys = Array.isArray(f[0]) ? f[0] : [ f[0] ];
    for (const key of keys) {
      if (!node[key]) { node[key] = {}; }
      packList(f.slice(1), node[key] as TypeNode);
    }
  }
  else {
    node[END] = true;
  }
}
validRunsMerge.forEach(run => packList(run.concat().reverse(), refPartsTree));

// attempt to match a backwards run of tokens from a given point to a path in the tree
const matcher = (
  tokens: Token[],
  currNode: TypeNode,
  anchorIndex: number,
  rootType: string,
  xlsx: boolean = false
) => {
  let i = 0;
  let node = currNode;
  const max = tokens.length; // 8 is the longest valid runs length
  let cols = 0;
  let brackets = 0;
  let inPrefix = false;
  // the longest run so far that ended on a terminal: a longer run may turn out
  // to be invalid, in which case we fall back to the best valid subset run
  let best = 0;

  runloop: while (i <= max) {
    // a run may only have a single ":" in its prefix part
    if (node[END] && cols < 2) {
      best = i;
    }

    const token = tokens[anchorIndex - i];
    if (!token) { break; }

    const value = token.value;
    if (inPrefix) {
      const firstChar = value.charCodeAt(0);
      if (firstChar === COLON) {
        cols++;
        if (cols >= 2 || brackets) { break runloop; }
      }
      // Note: (token.type === REF_NAMED) is not needed here because names cannot contain any of []:
      // unquoted prefix
      else if (token.type === CONTEXT) {
        // "[Book1.xlsx]"
        if (firstChar === BR_OPEN) {
          // don't allow []foo
          if (!xlsx && value.charCodeAt(value.length - 1) === BR_CLOSE) {
            break runloop;
          }
          brackets++;
          // only a single bracketed token is allowed per-run
          if (brackets >= 2) {
            break runloop;
          }
        }
        // "Sheet1"
        else {
          if (value.includes(':')) {
            cols++;
            if (cols >= 2) { break runloop; }
            if (rootType === REF_NAMED || rootType === REF_STRUCT) {
              break runloop;
            }
          }
        }
      }
      // quoted prefix
      else if (token.type === CONTEXT_QUOTE) {
        const parts = splitPrefix(unquotePrefix(token.value));
        // an empty quoted prefix ('') names nothing that can be referenced
        if (!parts.length) {
          break runloop;
        }
        if (!parts.at(-1).braced && parts.at(-1)?.value.includes(':')) {
          cols++;
          if (cols >= 2) {
            break runloop;
          }
        }
        if (!xlsx && parts.length === 1) {
          // don't allow []foo
          if (parts[0].braced) {
            break runloop;
          }
        }
        if (xlsx || parts.length > 1) {
          for (const part of parts) {
            if (part.braced) {
              brackets++;
              if (brackets >= 2) {
                break runloop;
              }
            }
            else if (part.value.includes(':')) {
              if (rootType === REF_NAMED || rootType === REF_STRUCT) {
                break runloop;
              }
            }
          }
        }
      }
    }
    let key: string = token.type;
    if (token.type === OPERATOR) {
      if (value === '!') {
        inPrefix = true;
      }
      key = value;
    }
    // prevent merging ["A1" ":" "B2:C3"] as a range may only have one ":" operator
    if (key === REF_RANGE && !value.includes(':')) {
      key = REF_CELL;
    }
    if (!(key in node)) { break; }
    node = node[key] as TypeNode;
    i += 1;
  }
  return best;
};

function isBangAfter (tokenlist: Token[], i: number): boolean {
  const next = tokenlist[i + 1];
  return !!next && next.type === OPERATOR && next.value === '!';
}

function commonMergeRefTokens (tokenlist: Token[], xlsx: boolean): Token[] {
  const finalTokens = [];
  // this seeks backwards because it's really the range part
  // that controls what can be joined.
  for (let i = tokenlist.length - 1; i >= 0; i--) {
    let token = tokenlist[i];
    const type = token.type;
    // Quick check if token type can start a valid run
    if (type === REF_RANGE || type === REF_BEAM || type === REF_TERNARY ||
        type === REF_NAMED || type === REF_STRUCT) {
      const valid = matcher(tokenlist, refPartsTree, i, type, xlsx);
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
    // A quoted scope with no `!` after it is a name, not a scope. One that has its `!` stays a
    // scope, merged or not.
    if (token.type === CONTEXT_QUOTE && !isBangAfter(tokenlist, i)) {
      token = { ...token, type: REF_NAMED };
    }
    finalTokens[finalTokens.length] = token;
  }
  return finalTokens.reverse();
}

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
  return commonMergeRefTokens(tokenlist, false);
}

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
export function mergeRefTokensXlsx (tokenlist: Token[]): Token[] {
  return commonMergeRefTokens(tokenlist, true);
}
