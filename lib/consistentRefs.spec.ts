import { describe, test, expect } from 'vitest';
import { stringifyA1Ref, stringifyA1RefXlsx } from './stringifyA1Ref.ts';
import { parseA1Ref, parseA1RefXlsx } from './parseA1Ref.ts';
import type { ReferenceA1, ReferenceA1Xlsx, ReferenceName, ReferenceNameXlsx, ReferenceStruct, ReferenceStructXlsx, Token } from './types.ts';
import { CONTEXT, CONTEXT_QUOTE, OPERATOR, REF_NAMED, REF_RANGE, REF_STRUCT, UNKNOWN } from './constants.ts';
import { tokenize, tokenizeXlsx } from './tokenize.ts';
import { parseStructRef, parseStructRefXlsx } from './parseStructRef.ts';
import { stringifyStructRef, stringifyStructRefXlsx } from './stringifyStructRef.ts';

type TestData = {
  input: string;
  output?: string;
  tokens: Token[];
  only?: boolean;
} & ({
  ref: undefined | ReferenceA1 | ReferenceName | ReferenceStruct;
  xlsx?: false;
} | {
  ref: undefined | ReferenceA1Xlsx | ReferenceNameXlsx | ReferenceStructXlsx;
  xlsx: true;
});

describe('round-trip A1 references', () => {
  const range = { $bottom: false, $left: false, $right: false, $top: false, bottom: 0, left: 0, right: 0, top: 0 };
  const table = { columns: [ 'column' ], sections: [], table: 'table' };
  const REF_TESTS: TestData[] = [
    {
      xlsx: true,
      input: 'A1',
      output: 'A1',
      ref: {
        range: range,
        sheetName: '',
        workbookName: ''
      },
      tokens: [
        { type: REF_RANGE, value: 'A1' }
      ]
    },
    {
      xlsx: false,
      input: 'A1',
      output: 'A1',
      ref: {
        range: range,
        context: []
      },
      tokens: [
        { type: REF_RANGE, value: 'A1' }
      ]
    },
    {
      xlsx: true,
      input: 'Sheet1!A1',
      output: 'Sheet1!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1',
        workbookName: ''
      },
      tokens: [
        { type: REF_RANGE, value: 'Sheet1!A1' }
      ]
    },
    {
      xlsx: false,
      input: 'Sheet1!A1',
      output: 'Sheet1!A1',
      ref: {
        range: range,
        context: [ 'Sheet1' ]
      },
      tokens: [
        { type: REF_RANGE, value: 'Sheet1!A1' }
      ]
    },

    {
      xlsx: true,
      input: '[Book1.xlsx]!A1',
      output: '[Book1.xlsx]!A1',
      ref: {
        range: range,
        sheetName: '',
        workbookName: 'Book1.xlsx'
      },
      tokens: [
        { type: REF_RANGE, value: '[Book1.xlsx]!A1' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]!A1',
      output: null,
      ref: undefined,
      tokens: [
        { type: UNKNOWN, value: '[Book1.xlsx]' },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]'!A1",
      output: '[Book1.xlsx]!A1',
      ref: {
        range: range,
        sheetName: '',
        workbookName: 'Book1.xlsx'
      },
      tokens: [
        { type: REF_RANGE, value: "'[Book1.xlsx]'!A1" }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]'!A1",
      output: null,
      ref: undefined,
      tokens: [
        { type: UNKNOWN, value: "'" },
        { type: REF_STRUCT, value: '[Book1.xlsx]' },
        { type: UNKNOWN, value: "'" },
        { type: OPERATOR, value: '!' },
        { type: REF_RANGE, value: 'A1' }
      ]
    },
    {
      xlsx: true,
      input: "'Sheet1'!A1",
      output: 'Sheet1!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1',
        workbookName: ''
      },
      tokens: [
        { type: REF_RANGE, value: "'Sheet1'!A1" }
      ]
    },
    {
      xlsx: false,
      input: "'Sheet1'!A1",
      output: 'Sheet1!A1',
      ref: {
        range: range,
        context: [ 'Sheet1' ]
      },
      tokens: [
        { type: REF_RANGE, value: "'Sheet1'!A1" }
      ]
    },
    {
      xlsx: true,
      input: 'Sheet1:Sheet2!A1',
      output: 'Sheet1:Sheet2!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1:Sheet2',
        workbookName: ''
      },
      tokens: [
        { type: REF_RANGE, value: 'Sheet1:Sheet2!A1' }
      ]
    },
    {
      xlsx: false,
      input: 'Sheet1:Sheet2!A1',
      output: 'Sheet1:Sheet2!A1',
      ref: {
        range: range,
        context: [ 'Sheet1:Sheet2' ]
      },
      tokens: [
        { type: REF_RANGE, value: 'Sheet1:Sheet2!A1' }
      ]
    },
    {
      xlsx: true,
      input: "'Sheet1:Sheet2'!A1",
      output: 'Sheet1:Sheet2!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1:Sheet2',
        workbookName: ''
      },
      tokens: [
        { type: REF_RANGE, value: "'Sheet1:Sheet2'!A1" }
      ]
    },
    {
      xlsx: false,
      input: "'Sheet1:Sheet2'!A1",
      output: 'Sheet1:Sheet2!A1',
      ref: {
        range: range,
        context: [ 'Sheet1:Sheet2' ]
      },
      tokens: [
        { type: REF_RANGE, value: "'Sheet1:Sheet2'!A1" }
      ]
    },
    {
      xlsx: true,
      input: '[Book1.xlsx]Sheet1!A1',
      output: '[Book1.xlsx]Sheet1!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1',
        workbookName: 'Book1.xlsx'
      },
      tokens: [
        { type: REF_RANGE, value: '[Book1.xlsx]Sheet1!A1' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]Sheet1!A1',
      output: '[Book1.xlsx]Sheet1!A1',
      ref: {
        range: range,
        context: [ 'Book1.xlsx', 'Sheet1' ]
      },
      tokens: [
        { type: REF_RANGE, value: '[Book1.xlsx]Sheet1!A1' }
      ]
    },
    {
      xlsx: true,
      input: '[Book1.xlsx]Sheet1:Sheet2!A1',
      output: '[Book1.xlsx]Sheet1:Sheet2!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1:Sheet2',
        workbookName: 'Book1.xlsx'
      },
      tokens: [
        { type: REF_RANGE, value: '[Book1.xlsx]Sheet1:Sheet2!A1' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]Sheet1:Sheet2!A1',
      output: '[Book1.xlsx]Sheet1:Sheet2!A1',
      ref: {
        range: range,
        context: [ 'Book1.xlsx', 'Sheet1:Sheet2' ]
      },
      tokens: [
        { type: REF_RANGE, value: '[Book1.xlsx]Sheet1:Sheet2!A1' }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]Sheet1'!A1",
      output: '[Book1.xlsx]Sheet1!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1',
        workbookName: 'Book1.xlsx'
      },
      tokens: [
        { type: REF_RANGE, value: "'[Book1.xlsx]Sheet1'!A1" }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]Sheet1'!A1",
      output: '[Book1.xlsx]Sheet1!A1',
      ref: {
        range: range,
        context: [ 'Book1.xlsx', 'Sheet1' ]
      },
      tokens: [
        { type: REF_RANGE, value: "'[Book1.xlsx]Sheet1'!A1" }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]Sheet1:Sheet2'!A1",
      output: '[Book1.xlsx]Sheet1:Sheet2!A1',
      ref: {
        range: range,
        sheetName: 'Sheet1:Sheet2',
        workbookName: 'Book1.xlsx'
      },
      tokens: [
        { type: REF_RANGE, value: "'[Book1.xlsx]Sheet1:Sheet2'!A1" }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]Sheet1:Sheet2'!A1",
      output: '[Book1.xlsx]Sheet1:Sheet2!A1',
      ref: {
        range: range,
        context: [ 'Book1.xlsx', 'Sheet1:Sheet2' ]
      },
      tokens: [
        { type: REF_RANGE, value: "'[Book1.xlsx]Sheet1:Sheet2'!A1" }
      ]
    },

    // NAMED RANGES

    {
      xlsx: true,
      input: 'name',
      output: 'name',
      ref: { name: 'name', sheetName: '', workbookName: '' },
      tokens: [
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      xlsx: false,
      input: 'name',
      output: 'name',
      ref: { name: 'name', context: [] },
      tokens: [
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      xlsx: true,
      input: 'Sheet1!name',
      output: 'Sheet1!name',
      ref: { name: 'name', sheetName: 'Sheet1', workbookName: '' },
      tokens: [
        { type: REF_NAMED, value: 'Sheet1!name' }
      ]
    },
    {
      xlsx: false,
      input: 'Sheet1!name',
      output: 'Sheet1!name',
      ref: { name: 'name', context: [ 'Sheet1' ] },
      tokens: [
        { type: REF_NAMED, value: 'Sheet1!name' }
      ]
    },
    {
      xlsx: true,
      input: "'Sheet1'!name",
      output: 'Sheet1!name',
      ref: { name: 'name', sheetName: 'Sheet1', workbookName: '' },
      tokens: [
        { type: REF_NAMED, value: "'Sheet1'!name" }
      ]
    },
    {
      xlsx: false,
      input: "'Sheet1'!name",
      output: 'Sheet1!name',
      ref: { name: 'name', context: [ 'Sheet1' ] },
      tokens: [
        { type: REF_NAMED, value: "'Sheet1'!name" }
      ]
    },
    {
      xlsx: true,
      input: 'Sheet1:Sheet2!name',
      output: 'Sheet1:Sheet2!name',
      ref: undefined,
      tokens: [
        { type: REF_NAMED, value: 'Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Sheet2!name' }
      ]
    },
    {
      xlsx: false,
      input: 'Sheet1:Sheet2!name',
      output: 'Sheet1:Sheet2!name',
      ref: undefined,
      tokens: [
        { type: REF_NAMED, value: 'Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Sheet2!name' }
      ]
    },
    {
      xlsx: true,
      input: "'Sheet1:Sheet2'!name",
      output: "'Sheet1:Sheet2'!name",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'Sheet1:Sheet2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      xlsx: false,
      input: "'Sheet1:Sheet2'!name",
      output: "'Sheet1:Sheet2'!name",
      ref: { name: 'name', context: [ 'Sheet1:Sheet2' ] },
      tokens: [
        { type: REF_NAMED, value: "'Sheet1:Sheet2'!name" }
      ]
    },
    {
      xlsx: true,
      input: '[Book1.xlsx]Sheet1!name',
      output: '[Book1.xlsx]Sheet1!name',
      ref: { name: 'name', sheetName: 'Sheet1', workbookName: 'Book1.xlsx' },
      tokens: [
        { type: REF_NAMED, value: '[Book1.xlsx]Sheet1!name' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]Sheet1!name',
      output: '[Book1.xlsx]Sheet1!name',
      ref: { name: 'name', context: [ 'Book1.xlsx', 'Sheet1' ] },
      tokens: [
        { type: REF_NAMED, value: '[Book1.xlsx]Sheet1!name' }
      ]
    },
    {
      xlsx: true,
      input: '[Book1.xlsx]Sheet1:Sheet2!name',
      output: '[Book1.xlsx]Sheet1:Sheet2!name',
      ref: undefined,
      tokens: [
        { type: CONTEXT, value: '[Book1.xlsx]Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Sheet2!name' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]Sheet1:Sheet2!name',
      output: '[Book1.xlsx]Sheet1:Sheet2!name',
      ref: undefined,
      tokens: [
        { type: CONTEXT, value: '[Book1.xlsx]Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_NAMED, value: 'Sheet2!name' }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]Sheet1'!name",
      output: '[Book1.xlsx]Sheet1!name',
      ref: { name: 'name', sheetName: 'Sheet1', workbookName: 'Book1.xlsx' },
      tokens: [
        { type: REF_NAMED, value: "'[Book1.xlsx]Sheet1'!name" }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]Sheet1'!name",
      output: '[Book1.xlsx]Sheet1!name',
      ref: { name: 'name', context: [ 'Book1.xlsx', 'Sheet1' ] },
      tokens: [
        { type: REF_NAMED, value: "'[Book1.xlsx]Sheet1'!name" }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]Sheet1:Sheet2'!name",
      output: "'[Book1.xlsx]Sheet1:Sheet2'!name",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'[Book1.xlsx]Sheet1:Sheet2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]Sheet1:Sheet2'!name",
      output: "'[Book1.xlsx]Sheet1:Sheet2'!name",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'[Book1.xlsx]Sheet1:Sheet2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      // The valid version of this should be `'[/path/to/foo:bar]'!name`
      xlsx: true,
      input: "'/path/to/foo:bar'!name",
      output: "'/path/to/foo:bar'!name",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'/path/to/foo:bar'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      xlsx: false,
      input: "'/path/to/foo:bar'!name",
      output: "'/path/to/foo:bar'!name",
      ref: { name: 'name', context: [ '/path/to/foo:bar' ] },
      tokens: [
        { type: REF_NAMED, value: "'/path/to/foo:bar'!name" }
      ]
    },
    {
      xlsx: true,
      input: "'c:\\path\\to\\Book1.xlsx'!name",
      output: "'c:\\path\\to\\Book1.xlsx'!name",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'c:\\path\\to\\Book1.xlsx'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'name' }
      ]
    },
    {
      xlsx: false,
      input: "'c:\\path\\to\\Book1.xlsx'!name",
      output: "'c:\\path\\to\\Book1.xlsx'!name",
      ref: { name: 'name', context: [ 'c:\\path\\to\\Book1.xlsx' ] },
      tokens: [
        { type: REF_NAMED, value: "'c:\\path\\to\\Book1.xlsx'!name" }
      ]
    },
    {
      xlsx: true,
      input: "'[c:\\path\\to\\Book1.xlsx]'!name",
      output: "'[c:\\path\\to\\Book1.xlsx]'!name",
      ref: {
        name: 'name',
        sheetName: '',
        workbookName: 'c:\\path\\to\\Book1.xlsx'
      },
      tokens: [
        { type: REF_NAMED, value: "'[c:\\path\\to\\Book1.xlsx]'!name" }
      ]
    },
    {
      xlsx: false,
      input: "'[c:\\path\\to\\Book1.xlsx]'!name",
      output: null,
      ref: undefined,
      tokens: [
        { type: UNKNOWN, value: "'" },
        { type: REF_STRUCT, value: '[c:\\path\\to\\Book1.xlsx]' },
        { type: UNKNOWN, value: "'" },
        { type: OPERATOR, value: '!' },
        { type: REF_NAMED, value: 'name' }
      ]
    },

    // STRUCTURED RANGES

    {
      xlsx: true,
      input: 'table[column]',
      output: 'table[column]',
      ref: { ...table, sheetName: '', workbookName: '' },
      tokens: [
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      xlsx: false,
      input: 'table[column]',
      output: 'table[column]',
      ref: { ...table, context: [] },
      tokens: [
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      xlsx: true,
      input: 'Sheet1!table[column]',
      output: 'Sheet1!table[column]',
      ref: { ...table, sheetName: 'Sheet1', workbookName: '' },
      tokens: [
        { type: REF_STRUCT, value: 'Sheet1!table[column]' }
      ]
    },
    {
      xlsx: false,
      input: 'Sheet1!table[column]',
      output: 'Sheet1!table[column]',
      ref: { ...table, context: [ 'Sheet1' ] },
      tokens: [
        { type: REF_STRUCT, value: 'Sheet1!table[column]' }
      ]
    },
    {
      xlsx: true,
      input: "'Sheet1'!table[column]",
      output: 'Sheet1!table[column]',
      ref: { ...table, sheetName: 'Sheet1', workbookName: '' },
      tokens: [
        { type: REF_STRUCT, value: "'Sheet1'!table[column]" }
      ]
    },
    {
      xlsx: false,
      input: "'Sheet1'!table[column]",
      output: 'Sheet1!table[column]',
      ref: { ...table, context: [ 'Sheet1' ] },
      tokens: [
        { type: REF_STRUCT, value: "'Sheet1'!table[column]" }
      ]
    },
    {
      xlsx: true,
      input: 'Sheet1:Sheet2!table[column]',
      output: 'Sheet1:Sheet2!table[column]',
      ref: undefined,
      tokens: [
        { type: REF_NAMED, value: 'Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_STRUCT, value: 'Sheet2!table[column]' }
      ]
    },
    {
      xlsx: false,
      input: 'Sheet1:Sheet2!table[column]',
      output: 'Sheet1:Sheet2!table[column]',
      ref: undefined,
      tokens: [
        { type: REF_NAMED, value: 'Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_STRUCT, value: 'Sheet2!table[column]' }
      ]
    },
    {
      xlsx: true,
      input: "'Sheet1:Sheet2'!table[column]",
      output: "'Sheet1:Sheet2'!table[column]",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'Sheet1:Sheet2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      xlsx: false,
      input: "'Sheet1:Sheet2'!table[column]",
      output: "'Sheet1:Sheet2'!table[column]",
      ref: { ...table, context: [ 'Sheet1:Sheet2' ] },
      tokens: [
        { type: REF_STRUCT, value: "'Sheet1:Sheet2'!table[column]" }
      ]
    },
    {
      xlsx: true,
      input: '[Book1.xlsx]Sheet1!table[column]',
      output: '[Book1.xlsx]Sheet1!table[column]',
      ref: { ...table, sheetName: 'Sheet1', workbookName: 'Book1.xlsx' },
      tokens: [
        { type: REF_STRUCT, value: '[Book1.xlsx]Sheet1!table[column]' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]Sheet1!table[column]',
      output: '[Book1.xlsx]Sheet1!table[column]',
      ref: { ...table, context: [ 'Book1.xlsx', 'Sheet1' ] },
      tokens: [
        { type: REF_STRUCT, value: '[Book1.xlsx]Sheet1!table[column]' }
      ]
    },
    {
      xlsx: true,
      input: '[Book1.xlsx]Sheet1:Sheet2!table[column]',
      output: '[Book1.xlsx]Sheet1:Sheet2!table[column]',
      ref: undefined,
      tokens: [
        { type: CONTEXT, value: '[Book1.xlsx]Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_STRUCT, value: 'Sheet2!table[column]' }
      ]
    },
    {
      xlsx: false,
      input: '[Book1.xlsx]Sheet1:Sheet2!table[column]',
      output: '[Book1.xlsx]Sheet1:Sheet2!table[column]',
      ref: undefined,
      tokens: [
        { type: CONTEXT, value: '[Book1.xlsx]Sheet1' },
        { type: OPERATOR, value: ':' },
        { type: REF_STRUCT, value: 'Sheet2!table[column]' }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]Sheet1'!table[column]",
      output: '[Book1.xlsx]Sheet1!table[column]',
      ref: { ...table, sheetName: 'Sheet1', workbookName: 'Book1.xlsx' },
      tokens: [
        { type: REF_STRUCT, value: "'[Book1.xlsx]Sheet1'!table[column]" }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]Sheet1'!table[column]",
      output: '[Book1.xlsx]Sheet1!table[column]',
      ref: { ...table, context: [ 'Book1.xlsx', 'Sheet1' ] },
      tokens: [
        { type: REF_STRUCT, value: "'[Book1.xlsx]Sheet1'!table[column]" }
      ]
    },
    {
      xlsx: true,
      input: "'[Book1.xlsx]Sheet1:Sheet2'!table[column]",
      output: "'[Book1.xlsx]Sheet1:Sheet2'!table[column]",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'[Book1.xlsx]Sheet1:Sheet2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      xlsx: false,
      input: "'[Book1.xlsx]Sheet1:Sheet2'!table[column]",
      output: "'[Book1.xlsx]Sheet1:Sheet2'!table[column]",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'[Book1.xlsx]Sheet1:Sheet2'" },
        { type: OPERATOR, value: '!' },
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      // The valid version of this should be `'[/path/to/foo:bar]'!table[column]`
      xlsx: true,
      input: "'/path/to/foo:bar'!table[column]",
      output: "'/path/to/foo:bar'!table[column]",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'/path/to/foo:bar'" },
        { type: OPERATOR, value: '!' },
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      xlsx: false,
      input: "'/path/to/foo:bar'!table[column]",
      output: "'/path/to/foo:bar'!table[column]",
      ref: { ...table, context: [ '/path/to/foo:bar' ] },
      tokens: [
        { type: REF_STRUCT, value: "'/path/to/foo:bar'!table[column]" }
      ]
    },
    {
      xlsx: true,
      input: "'c:\\path\\to\\Book1.xlsx'!table[column]",
      output: "'c:\\path\\to\\Book1.xlsx'!table[column]",
      ref: undefined,
      tokens: [
        { type: CONTEXT_QUOTE, value: "'c:\\path\\to\\Book1.xlsx'" },
        { type: OPERATOR, value: '!' },
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    },
    {
      xlsx: false,
      input: "'c:\\path\\to\\Book1.xlsx'!table[column]",
      output: "'c:\\path\\to\\Book1.xlsx'!table[column]",
      ref: { ...table, context: [ 'c:\\path\\to\\Book1.xlsx' ] },
      tokens: [
        { type: REF_STRUCT, value: "'c:\\path\\to\\Book1.xlsx'!table[column]" }
      ]
    },
    {
      xlsx: true,
      input: "'[c:\\path\\to\\Book1.xlsx]'!table[column]",
      output: "'[c:\\path\\to\\Book1.xlsx]'!table[column]",
      ref: { ...table, sheetName: '', workbookName: 'c:\\path\\to\\Book1.xlsx' },
      tokens: [
        { type: REF_STRUCT, value: "'[c:\\path\\to\\Book1.xlsx]'!table[column]" }
      ]
    },
    {
      xlsx: false,
      input: "'[c:\\path\\to\\Book1.xlsx]'!table[column]",
      output: null,
      ref: undefined,
      tokens: [
        { type: UNKNOWN, value: "'" },
        { type: REF_STRUCT, value: '[c:\\path\\to\\Book1.xlsx]' },
        { type: UNKNOWN, value: "'" },
        { type: OPERATOR, value: '!' },
        { type: REF_STRUCT, value: 'table[column]' }
      ]
    }
  ];

  describe('regular mode', () => {
    for (const item of REF_TESTS) {
      if (item.xlsx) { continue; }
      const tfn = item.only ? test.only : test;
      tfn(item.input, () => {
        const tokens = tokenize(item.input, { withLocation: false });
        expect(tokens).toEqual(item.tokens);
        const isStruct = tokens.at(-1)?.type === REF_STRUCT;
        const r: any = isStruct ? parseStructRef(item.input) : parseA1Ref(item.input);
        expect(r).toEqual(item.ref);
        if (r) {
          expect(isStruct ? stringifyStructRef(r) : stringifyA1Ref(r)).toBe(item.output);
        }
      });
    }
  });
  describe('xlsx mode', () => {
    for (const item of REF_TESTS) {
      if (!item.xlsx) { continue; }
      const tfn = item.only ? test.only : test;
      tfn(item.input, () => {
        const tokens = tokenizeXlsx(item.input, { withLocation: false });
        expect(tokens).toEqual(item.tokens);
        const isStruct = tokens.at(-1)?.type === REF_STRUCT;
        const r: any = isStruct ? parseStructRefXlsx(item.input) : parseA1RefXlsx(item.input);
        expect(r).toEqual(item.ref);
        if (r) {
          expect(isStruct ? stringifyStructRefXlsx(r) : stringifyA1RefXlsx(r)).toBe(item.output);
        }
      });
    }
  });
});
