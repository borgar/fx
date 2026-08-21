import { describe, test, expect } from 'vitest';
import type { ReferenceA1 } from './types.ts';
import { stringifyPrefix } from './stringifyPrefix.ts';

function toRef (context: string[]): ReferenceA1 {
  return { context, range: { top: 0, left: 0, bottom: 0, right: 0 } };
}

describe.skip('stringifyPrefix', () => {
  test('basics', () => {
    expect(stringifyPrefix(toRef([ 'xxx' ]))).toBe('xxx!');
    expect(stringifyPrefix(toRef([ 'xxx', 'yyy' ]))).toBe('[xxx]yyy!');
    expect(stringifyPrefix(toRef([ '$Jan' ]))).toBe("'$Jan'!");
  });

  test('R1C1.z:A1.', () => {
    expect(stringifyPrefix(toRef([ 'R1C1.z' ]))).toBe("'R1C1.z'!");
    expect(stringifyPrefix(toRef([ 'A1.' ]))).toBe('A1.!');
    expect(stringifyPrefix(toRef([ 'R1C1.z:A1.' ]))).toBe("'R1C1.z:A1.'!");
    expect(stringifyPrefix(toRef([ 'Book1.xlsx', 'R1C1.z:A1.' ]))).toBe("'[Book1.xlsx]R1C1.z:A1.'!");
  });

  test('Ärger:中文', () => {
    expect(stringifyPrefix(toRef([ 'Ärger' ]))).toBe('Ärger!');
    expect(stringifyPrefix(toRef([ '中文' ]))).toBe('中文!');
    expect(stringifyPrefix(toRef([ 'Ärger:中文' ]))).toBe('Ärger:中文!');
    expect(stringifyPrefix(toRef([ 'Book1.xlsx', 'Ärger:中文' ]))).toBe('[Book1.xlsx]Ärger:中文!');
  });

  // expect(stringifyPrefix(toRef([ 'Book1.xlsx', 'Sales:..' ]))).toBe('[Book1.xlsx]Sales:..!');
  // expect(stringifyPrefix(toRef([ 'Ärger:A1.' ]))).toBe('Ärger:A1.!');

  // expect(stringifyPrefix(toRef([ 'x.y:中文' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ 'A1.:AB' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ 'ø:´¤' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ 'A:Ωmega' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ 'b_:Ærið' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ '..:AB' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ 'R1C1.z:Jan' ]))).toBe('');
  // expect(stringifyPrefix(toRef([ 'Ärger:R1C1' ]))).toBe('');
});
