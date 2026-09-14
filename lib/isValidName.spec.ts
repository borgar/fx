import { describe, test, expect } from 'vitest';
import { isValidName } from './isValidName.ts';

describe('isValidName', () => {
  test('accepts ordinary names', () => {
    expect(isValidName('foo')).toBe(true);
    expect(isValidName('_foo')).toBe(true);
    expect(isValidName('a')).toBe(true);
    expect(isValidName('a1')).toBe(false);
    expect(isValidName('foo.bar')).toBe(true);
    expect(isValidName('foo?')).toBe(true);
  });

  test('accepts names above the ASCII range', () => {
    expect(isValidName('æði')).toBe(true);
    expect(isValidName('らーめん')).toBe(true);
  });

  test('rejects an empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  test('requires 3 characters after a leading backslash', () => {
    expect(isValidName('\\foo')).toBe(true);
    expect(isValidName('\\fo')).toBe(true);
    expect(isValidName('\\f')).toBe(false);
    expect(isValidName('\\')).toBe(false);
  });

  test('rejects an invalid first character', () => {
    expect(isValidName('9foo')).toBe(false);
    expect(isValidName('.foo')).toBe(false);
    expect(isValidName('?foo')).toBe(false);
  });

  test('rejects punctuation in later positions', () => {
    expect(isValidName('foo bar')).toBe(false);
    expect(isValidName('foo-bar')).toBe(false);
    expect(isValidName('a$b')).toBe(false);
    expect(isValidName('a+b')).toBe(false);
    expect(isValidName('a!b')).toBe(false);
    expect(isValidName('a:b')).toBe(false);
    expect(isValidName('foo(')).toBe(false);
  });

  test('accepts names up to 255 characters', () => {
    expect(isValidName('a'.repeat(254))).toBe(true);
    expect(isValidName('a'.repeat(255))).toBe(true);
    expect(isValidName('a'.repeat(256))).toBe(false);
  });

  test('rejects R and C prefixed names', () => {
    expect(isValidName('R')).toBe(false);
    expect(isValidName('C')).toBe(false);
    expect(isValidName('r')).toBe(false);
    expect(isValidName('c')).toBe(false);
    expect(isValidName('RC')).toBe(false);
    expect(isValidName('rc')).toBe(false);
    expect(isValidName('cr')).toBe(true);
    expect(isValidName('c000000')).toBe(true);
    expect(isValidName('c000001')).toBe(false);
    expect(isValidName('c1')).toBe(false);
    expect(isValidName('c1.')).toBe(true);
    expect(isValidName('c1')).toBe(false);
    expect(isValidName('c113')).toBe(false);
    expect(isValidName('c16383')).toBe(false);
    expect(isValidName('c999999')).toBe(false);
    expect(isValidName('c9999990')).toBe(true);
    expect(isValidName('r000000')).toBe(true);
    expect(isValidName('r000000c1')).toBe(true);
    expect(isValidName('r000001')).toBe(false);
    expect(isValidName('r1c99999999')).toBe(false);
    expect(isValidName('r99.99')).toBe(true);
    expect(isValidName('r999.999')).toBe(true);
    expect(isValidName('r999999')).toBe(false);
    expect(isValidName('r999999.')).toBe(true);
    expect(isValidName('r9999999')).toBe(true);
    expect(isValidName('r99999999')).toBe(true);
    expect(isValidName('r999999?')).toBe(false);
    expect(isValidName('r999999\\')).toBe(false);
    expect(isValidName('r999999_')).toBe(false);
    expect(isValidName('r999999a')).toBe(false);
    expect(isValidName('r999999a')).toBe(false);
    expect(isValidName('r999999c1')).toBe(false);
    expect(isValidName('r999999c99999999')).toBe(false);
    expect(isValidName('r99999c99999')).toBe(false);
    expect(isValidName('r99999c999999')).toBe(false);
    expect(isValidName('r99999c9999999')).toBe(false);
    expect(isValidName('r99999c99999999')).toBe(false);
    expect(isValidName('r9c9999.')).toBe(false);
    expect(isValidName('R1')).toBe(false);
    expect(isValidName('Rc1')).toBe(false);
    expect(isValidName('rc1')).toBe(false);
    expect(isValidName('r1c1')).toBe(false);
    expect(isValidName('r1c1.')).toBe(false);
    expect(isValidName('R1')).toBe(false);
    expect(isValidName('R1C1')).toBe(false);
    expect(isValidName('R1C1.foo')).toBe(false);
    expect(isValidName('R1C1_foo')).toBe(false);
    expect(isValidName('R1C_foo')).toBe(false);
    expect(isValidName('RC_foo')).toBe(true);
  });

  test('name may not look like an A1 range', () => {
    expect(isValidName('A1')).toBe(false);
    expect(isValidName('ZZ100')).toBe(false);
    expect(isValidName('ZZ100.foo')).toBe(true);
    expect(isValidName('XFD1048576')).toBe(false);
    expect(isValidName('XFD1048577')).toBe(true);
    expect(isValidName('XFE1048576')).toBe(true);
  });
});
