import { describe, expect, it } from 'vitest';
import {
  addA1RangeBounds,
  addTokenMeta,
  fixTokenRanges,
  fixFormulaRanges,
  fromCol,
  isError,
  isFunction,
  isFxPrefix,
  isLiteral,
  isOperator,
  isRange,
  isReference,
  isWhitespace,
  mergeRefTokens,
  nodeTypes,
  parse,
  parseA1Ref,
  parseR1C1Ref,
  parseStructRef,
  stringifyA1Ref,
  stringifyR1C1Ref,
  stringifyStructRef,
  toCol,
  tokenize,
  tokenTypes,
  translateToA1,
  translateToR1C1
} from './index.ts';

// What happens when B2:A1 -> should work!
describe('fx main interface', () => {
  it('addA1RangeBounds exists', () => {
    expect(typeof addA1RangeBounds === 'function').toBeTruthy();
  });
  it('addTokenMeta exists', () => {
    expect(typeof addTokenMeta === 'function').toBeTruthy();
  });
  it('fixTokenRanges exists', () => {
    expect(typeof fixTokenRanges === 'function').toBeTruthy();
  });
  it('fixFormulaRanges exists', () => {
    expect(typeof fixFormulaRanges === 'function').toBeTruthy();
  });
  it('fromCol exists', () => {
    expect(typeof fromCol === 'function').toBeTruthy();
  });
  it('isError exists', () => {
    expect(typeof isError === 'function').toBeTruthy();
  });
  it('isFunction exists', () => {
    expect(typeof isFunction === 'function').toBeTruthy();
  });
  it('isFxPrefix exists', () => {
    expect(typeof isFxPrefix === 'function').toBeTruthy();
  });
  it('isLiteral exists', () => {
    expect(typeof isLiteral === 'function').toBeTruthy();
  });
  it('isOperator exists', () => {
    expect(typeof isOperator === 'function').toBeTruthy();
  });
  it('isRange exists', () => {
    expect(typeof isRange === 'function').toBeTruthy();
  });
  it('isReference exists', () => {
    expect(typeof isReference === 'function').toBeTruthy();
  });
  it('isWhitespace exists', () => {
    expect(typeof isWhitespace === 'function').toBeTruthy();
  });
  it('mergeRefTokens exists', () => {
    expect(typeof mergeRefTokens === 'function').toBeTruthy();
  });
  it('parse exists', () => {
    expect(typeof parse === 'function').toBeTruthy();
  });
  it('parseA1Ref exists', () => {
    expect(typeof parseA1Ref === 'function').toBeTruthy();
  });
  it('parseR1C1Ref exists', () => {
    expect(typeof parseR1C1Ref === 'function').toBeTruthy();
  });
  it('parseStructRef exists', () => {
    expect(typeof parseStructRef === 'function').toBeTruthy();
  });
  it('stringifyA1Ref exists', () => {
    expect(typeof stringifyA1Ref === 'function').toBeTruthy();
  });
  it('stringifyR1C1Ref exists', () => {
    expect(typeof stringifyR1C1Ref === 'function').toBeTruthy();
  });
  it('stringifyStructRef exists', () => {
    expect(typeof stringifyStructRef === 'function').toBeTruthy();
  });
  it('toCol exists', () => {
    expect(typeof toCol === 'function').toBeTruthy();
  });
  it('tokenize exists', () => {
    expect(typeof tokenize === 'function').toBeTruthy();
  });
  it('translateToA1 exists', () => {
    expect(typeof translateToA1 === 'function').toBeTruthy();
  });
  it('translateToR1C1 exists', () => {
    expect(typeof translateToR1C1 === 'function').toBeTruthy();
  });
  it('nodeTypes exists', () => {
    expect(typeof nodeTypes === 'object').toBeTruthy();
  });
  it('tokenTypes exists', () => {
    expect(typeof tokenTypes === 'object').toBeTruthy();
  });
});
