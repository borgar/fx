import { RANGE, RANGE_BEAM, RANGE_PART, UNKNOWN } from './constants.js';
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

// when context is Sheet1, we should consider Sheet!A1 == A1
export function addMeta (tokens, { sheetName = '', workbookName = '' } = {}) {
  const parenStack = [];
  let arrayStart = null;
  const uid = getIDer();
  const knownRefs = [];

  tokens.forEach((token, i) => {
    token.index = i;
    token.depth = parenStack.length;
    if (token.value === '(') {
      token.depth = parenStack.length + 1;
      parenStack.push(token);
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
      }
      else {
        token.error = true;
      }
    }
    else if (token.value === '}') {
      if (arrayStart) {
        const pairId = uid();
        token.groupId = pairId;
        arrayStart.groupId = pairId;
      }
      else {
        token.error = true;
      }
      arrayStart = null;
    }
    else if (token.type === RANGE || token.type === RANGE_BEAM || token.type === RANGE_PART) {
      const ref = parseA1Ref(token.value, { allowNamed: false, allowPartials: true });
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
