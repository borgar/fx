import { REF_RANGE, REF_BEAM, REF_TERNARY, UNKNOWN, REF_STRUCT } from './constants.ts';
import { parseA1Ref } from './parseA1Ref.ts';
import { parseStructRef } from './parseStructRef.ts';
import type { ReferenceA1Xlsx, ReferenceStructXlsx, Token, TokenEnhanced } from './extraTypes.ts';

function getIDer (): () => string {
  let i = 1;
  return () => 'fxg' + (i++);
}

function sameValue (a: unknown, b: unknown): boolean {
  if (a == null && b == null) {
    return true;
  }
  return a === b;
}

function sameArray (a: unknown[], b: unknown[]): boolean {
  if ((Array.isArray(a) !== Array.isArray(b)) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!sameValue(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

function sameStr (a: string, b: string): boolean {
  if (!a && !b) {
    return true;
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function isEquivalent (refA, refB): boolean {
  // if named, name must match
  if ((refA.name || refB.name) && refA.name !== refB.name) {
    return false;
  }
  // if structured
  if ((refA.columns || refB.columns)) {
    if (refA.table !== refB.table) {
      return false;
    }
    if (!sameArray(refA.columns, refB.columns)) {
      return false;
    }
    if (!sameArray(refA.sections, refB.sections)) {
      return false;
    }
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
    !sameStr(refA.workbookName, refB.workbookName) ||
    !sameStr(refA.sheetName, refB.sheetName)
  ) {
    return false;
  }
  return true;
}

function addContext (ref, sheetName: string, workbookName: string) {
  if (!ref.sheetName) {
    ref.sheetName = sheetName;
  }
  if (!ref.workbookName) {
    ref.workbookName = workbookName;
  }
  return ref;
}

type RefWithGroupId = (ReferenceA1Xlsx | ReferenceStructXlsx) & { groupId: string };
class Reflist {
  refs: RefWithGroupId[];
  uid: () => string;

  constructor (uid: () => string) {
    this.refs = [];
    this.uid = uid;
  }

  getGroupId (ref: ReferenceA1Xlsx | ReferenceStructXlsx): string {
    const known = this.refs.find(d => isEquivalent(d, ref));
    if (known) {
      return known.groupId;
    }
    else {
      const r: RefWithGroupId = Object.assign(ref, { groupId: this.uid() });
      this.refs.push(r);
      return r.groupId;
    }
  }
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
 * @param tokenlist An array of tokens (from `tokenize()`)
 * @param [context={}] A contest used to match `A1` to `Sheet1!A1`.
 * @param [context.sheetName=''] An implied sheet name ('Sheet1')
 * @param [context.workbookName=''] An implied workbook name ('report.xlsx')
 * @returns The input array with the enchanced tokens
 */
export function addTokenMeta (tokenlist: Token[], { sheetName = '', workbookName = '' } = {}): TokenEnhanced[] {
  const parenStack = [];
  let arrayStart = null;
  const uid = getIDer();
  const knownRefs = new Reflist(uid);

  const getCurrDepth = () => parenStack.length + (arrayStart ? 1 : 0);

  tokenlist.forEach((token, i) => {
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
    else if (
      token.type === REF_RANGE ||
      token.type === REF_BEAM ||
      token.type === REF_TERNARY
    ) {
      const ref = parseA1Ref(token.value, { allowTernary: true, xlsx: true });
      if (ref && 'range' in ref) {
        addContext(ref, sheetName, workbookName);
        token.groupId = knownRefs.getGroupId(ref);
      }
    }
    else if (token.type === REF_STRUCT) {
      const ref = parseStructRef(token.value, { xlsx: true });
      if (ref) {
        addContext(ref, sheetName, workbookName);
        token.groupId = knownRefs.getGroupId(ref);
      }
    }
    else if (token.type === UNKNOWN) {
      token.error = true;
    }
  });

  return tokenlist as TokenEnhanced[];
}
