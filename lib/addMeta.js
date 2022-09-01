import { RANGE, RANGE_BEAM, UNKNOWN } from './constants.js';
import { parseA1Ref, toRelative, toA1 } from './a1.js';

function getIDer () {
  let i = 1;
  return () => 'fxg' + (i++);
}

// when context is Sheet1, we should consider Sheet!A1 == A1
export function addMeta (tokens, { sheetName = '', workbookName = '' } = {}) {
  const parenStack = [];
  let arrayStart = null;
  const a1Map = {};
  const uid = getIDer();

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
    else if (token.type === RANGE || token.type === RANGE_BEAM) {
      const ref = parseA1Ref(token.value, false);
      const a1 = ref && (`[${ref.workbookName || workbookName}]${ref.sheetName || sheetName}!${ref.range ? toA1(toRelative(ref.range)) : ref.name}`).toLowerCase();
      if (a1) {
        if (a1 in a1Map) {
          token.groupId = a1Map[a1];
        }
        else {
          token.groupId = uid();
          a1Map[a1] = token.groupId;
        }
      }
    }
    else if (token.type === UNKNOWN) {
      token.error = true;
    }
  });
  return tokens;
}
