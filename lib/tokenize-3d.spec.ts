import { describe, test, expect } from 'vitest';
import { UNKNOWN, OPERATOR, REF_RANGE, REF_BEAM, REF_NAMED, REF_STRUCT, REF_TERNARY, CONTEXT, CONTEXT_QUOTE } from './constants.ts';
import { tokenize } from './tokenize.ts';

describe('lexer: 3d ranges', () => {
  describe('basics', () => {
    test('regular 3d range', () => {
      expect(tokenize('Alpha:Gamma!A1', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('Alpha:Gamma!A1')).toEqual([
        { type: REF_RANGE, value: 'Alpha:Gamma!A1' }
      ]);
    });
    test('beam 3d range', () => {
      expect(tokenize('Alpha:Gamma!A:A', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_BEAM, value: 'A:A' }
      ]);
      expect(tokenize('Alpha:Gamma!A:A')).toEqual([
        { type: REF_BEAM, value: 'Alpha:Gamma!A:A' }
      ]);
    });
    test('ternary 3d range', () => {
      expect(tokenize('Alpha:Gamma!A2:B', { mergeRefs: false, allowTernary: true })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_TERNARY, value: 'A2:B' }
      ]);
      expect(tokenize('Alpha:Gamma!A2:B', { allowTernary: true })).toEqual([
        { type: REF_TERNARY, value: 'Alpha:Gamma!A2:B' }
      ]);
    });
    test('names cannot be 3d ranges', () => {
      expect(tokenize('Alpha:Gamma!SomeName', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'SomeName' }
      ]);
      expect(tokenize('Alpha:Gamma!SomeName')).toEqual([
        { type: 'range_named', value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: 'range_named', value: 'Gamma!SomeName' }
      ]);
    });
    test('structured refs cannot be 3d', () => {
      expect(tokenize('Alpha:Gamma!Table1[Col]', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'Table1' },
        { type: REF_STRUCT, value: '[Col]' }
      ]);
      expect(tokenize('Alpha:Gamma!Table1[Col]')).toEqual([
        { type: 'range_named', value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: 'structured', value: 'Gamma!Table1[Col]' }
      ]);
    });
  });

  describe('quoted', () => {
    test('First section quoted', () => {
      expect(tokenize("'Alpha':Gamma!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha':Gamma!A1")).toEqual([
        { type: REF_RANGE, value: "'Alpha':Gamma!A1" }
      ]);
    });
    test('Second section quoted', () => {
      expect(tokenize("Alpha:'Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("Alpha:'Gamma'!A1")).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'Gamma'!A1" }
      ]);
    });
    test('Both sections quoted independently', () => {
      expect(tokenize("'Alpha':'Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha':'Gamma'!A1")).toEqual([
        { type: REF_RANGE, value: "'Alpha':'Gamma'!A1" }
      ]);
    });
    test('Both sections quoted together', () => {
      expect(tokenize("'Alpha:Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha:Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha:Gamma'!A1")).toEqual([
        { type: REF_RANGE, value: "'Alpha:Gamma'!A1" }
      ]);
    });
  });

  describe("don't get confused by extra scopes", () => {
    test('two quoted scopes + an unquoted scope', () => {
      expect(tokenize("'Alpha:Beta':Gamma!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha:Beta'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha:Beta':Gamma!A1")).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha:Beta'" },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Gamma!A1' }
      ]);
    });
    test('an unquoted scope + two quoted scopes', () => {
      expect(tokenize("Alpha:'Beta:Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Beta:Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("Alpha:'Beta:Gamma'!A1")).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'Beta:Gamma'!A1" }
      ]);
    });
    test('three unquoted scopes', () => {
      expect(tokenize('Alpha:Beta:Gamma!A1', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Beta' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('Alpha:Beta:Gamma!A1')).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Beta:Gamma!A1' }
      ]);
    });
    test('four unquoted scopes', () => {
      expect(tokenize('Alpha:Beta:Gamma:Delta!A1', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Beta' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Gamma' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Delta' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('Alpha:Beta:Gamma:Delta!A1')).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Beta' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Gamma:Delta!A1' }
      ]);
    });
    test('unquoted scope + two quoted + unquoted', () => {
      expect(tokenize("Alpha:'Beta:Gamma':Delta!A1", { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Beta:Gamma'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Delta' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("Alpha:'Beta:Gamma':Delta!A1")).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Beta:Gamma'" },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Delta!A1' }
      ]);
    });
  });

  describe('with workbook', () => {
    test('basic 3d-range with workbook', () => {
      expect(tokenize('[Book.xlsx]Alpha:Gamma!A1', { mergeRefs: false })).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('[Book.xlsx]Alpha:Gamma!A1')).toEqual([
        { type: REF_RANGE, value: '[Book.xlsx]Alpha:Gamma!A1' }
      ]);
    });

    test('with only first section quoted', () => {
      // XXX: ensure fixranges deals with this
      // Excel will correct this to `'[Book.xlsx]Alpha:Gamma'!A1`
      expect(tokenize("'[Book.xlsx]Alpha':Gamma!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'[Book.xlsx]Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'[Book.xlsx]Alpha':Gamma!A1")).toEqual([
        { type: REF_RANGE, value: "'[Book.xlsx]Alpha':Gamma!A1" }
      ]);
    });

    test('with only second section quoted', () => {
      expect(tokenize("[Book.xlsx]Alpha:'Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("[Book.xlsx]Alpha:'Gamma'!A1")).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'Gamma'!A1" }
      ]);
    });

    test('fully quoted', () => {
      expect(tokenize("'[Book.xlsx]Alpha:Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'[Book.xlsx]Alpha:Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'[Book.xlsx]Alpha:Gamma'!A1")).toEqual([
        { type: REF_RANGE, value: "'[Book.xlsx]Alpha:Gamma'!A1" }
      ]);
    });

    test('both sections quoted, but independently', () => {
      // XXX: ensure fixranges deals with this
      // Excel will correct this to `'[Book.xlsx]Alpha:Gamma'!A1`
      expect(tokenize("'[Book.xlsx]Alpha':'Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'[Book.xlsx]Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'[Book.xlsx]Alpha':'Gamma'!A1")).toEqual([
        { type: REF_RANGE, value: "'[Book.xlsx]Alpha':'Gamma'!A1" }
      ]);
    });

    test('workbook bit in both sections', () => {
      expect(tokenize('[Book.xlsx]Alpha:[Book.xlsx]Gamma!A1', { mergeRefs: false })).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: '[Book.xlsx]Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('[Book.xlsx]Alpha:[Book.xlsx]Gamma!A1')).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: '[Book.xlsx]Gamma!A1' }
      ]);
    });

    test('workbook features in second bit', () => {
      // Excel parses the `Alpha:` as the path of `Book.xlsx`, but we don't support paths so this
      // is correct for us. Either will be a syntax error when it hits the parser.
      expect(tokenize('Alpha:[Book.xlsx]Gamma!A1', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: '[Book.xlsx]Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('Alpha:[Book.xlsx]Gamma!A1')).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: '[Book.xlsx]Gamma!A1' }
      ]);
    });

    test('workbook features in second section, first section quoted', () => {
      expect(tokenize("'Alpha':[Book.xlsx]Gamma!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: '[Book.xlsx]Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha':[Book.xlsx]Gamma!A1")).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: '[Book.xlsx]Gamma!A1' }
      ]);
    });

    test('workbook features in second section, second section quoted', () => {
      expect(tokenize("Alpha:'[Book.xlsx]Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'[Book.xlsx]Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("Alpha:'[Book.xlsx]Gamma'!A1")).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'[Book.xlsx]Gamma'!A1" }
      ]);
    });

    test('workbook features in second section, second section quoted', () => {
      expect(tokenize("Alpha:'[Book.xlsx]Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'[Book.xlsx]Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("Alpha:'[Book.xlsx]Gamma'!A1")).toEqual([
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'[Book.xlsx]Gamma'!A1" }
      ]);
    });

    test('workbook features in second section, everything quoted', () => {
      expect(tokenize("'Alpha:[Book.xlsx]Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: UNKNOWN, value: "'Alpha" },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "[Book.xlsx]Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha:[Book.xlsx]Gamma'!A1")).toEqual([
        { type: UNKNOWN, value: "'Alpha" },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "[Book.xlsx]Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
    });

    test('workbook features in second section, both quoted independently', () => {
      expect(tokenize("'Alpha':'[Book.xlsx]Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT_QUOTE, value: "'[Book.xlsx]Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'Alpha':'[Book.xlsx]Gamma'!A1")).toEqual([
        { type: CONTEXT_QUOTE, value: "'Alpha'" },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: "'[Book.xlsx]Gamma'!A1" }
      ]);
    });
  });

  describe('extra ranges with workbook', () => {
    test('S:[W]S:S', () => {
      expect(tokenize('Delta:[Book.xlsx]Alpha:Gamma!A1', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Delta' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('Delta:[Book.xlsx]Alpha:Gamma!A1')).toEqual([
        { type: REF_NAMED, value: 'Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: '[Book.xlsx]Alpha:Gamma!A1' }
      ]);
    });

    test('S:S:[W]S:S', () => {
      expect(tokenize('Delta:Beta:[Book.xlsx]Alpha:Gamma!A1', { mergeRefs: false })).toEqual([
        { type: REF_NAMED, value: 'Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Beta' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: '[Book.xlsx]Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('Delta:Beta:[Book.xlsx]Alpha:Gamma!A1')).toEqual([
        { type: REF_NAMED, value: 'Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Beta' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: '[Book.xlsx]Alpha:Gamma!A1' }
      ]);
    });

    test('[W]S:S:S', () => {
      expect(tokenize('[Book.xlsx]Delta:Alpha:Gamma!A1', { mergeRefs: false })).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: CONTEXT, value: 'Gamma' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize('[Book.xlsx]Delta:Alpha:Gamma!A1')).toEqual([
        { type: CONTEXT, value: '[Book.xlsx]Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_RANGE, value: 'Alpha:Gamma!A1' }
      ]);
    });

    test("'[W]S:S:S'", () => {
      expect(tokenize("'[Book.xlsx]Delta:Alpha:Gamma'!A1", { mergeRefs: false })).toEqual([
        { type: UNKNOWN, value: "'" },
        { type: CONTEXT, value: '[Book.xlsx]Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
      expect(tokenize("'[Book.xlsx]Delta:Alpha:Gamma'!A1")).toEqual([
        { type: UNKNOWN, value: "'" },
        { type: CONTEXT, value: '[Book.xlsx]Delta' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Alpha' },
        { type: OPERATOR, value: ':' },
        { type: UNKNOWN, value: "Gamma'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]);
    });
  });

  test('colons within braces', () => {
    expect(tokenize("'[foo:bar]:baz:smu'!A1", { mergeRefs: false })).toEqual([
      { type: UNKNOWN, value: "'" },
      { type: REF_STRUCT, value: '[foo:bar]' },
      { type: OPERATOR, value: ':' },
      { type: REF_NAMED, value: 'baz' },
      { type: OPERATOR, value: ':' },
      { type: UNKNOWN, value: "smu'" },
      { type: OPERATOR, value: '!' },
      { type: REF_RANGE, value: 'A1' }
    ]);
    expect(tokenize("'[foo:bar]baz:smu'!A1")).toEqual([
      { type: UNKNOWN, value: "'[" },
      { type: REF_BEAM, value: 'foo:bar' },
      { type: UNKNOWN, value: ']baz' },
      { type: OPERATOR, value: ':' },
      { type: UNKNOWN, value: "smu'" },
      { type: OPERATOR, value: '!' },
      { type: REF_RANGE, value: 'A1' }
    ]);
    expect(tokenize('[foo:bar]baz:smu!A1')).toEqual([
      { type: UNKNOWN, value: '[' },
      { type: REF_BEAM, value: 'foo:bar' },
      { type: UNKNOWN, value: ']baz' },
      { type: OPERATOR, value: ':' },
      { type: REF_RANGE, value: 'smu!A1' }
    ]);
  });
});
