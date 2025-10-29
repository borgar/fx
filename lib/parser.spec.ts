import { describe, test, expect } from 'vitest';
import { parse } from './parser.ts';

function isParsed (expr: string, expected: any, opts?: any) {
  const result = parse(expr, { allowTernary: true, withLocation: false, ...opts });
  const cleaned = JSON.parse(JSON.stringify(result));
  expect(cleaned).toEqual(expected);
}

function isInvalidExpr (expr: string, opts?: any) {
  expect(() => parse(expr, { allowTernary: true, ...opts })).toThrow();
}

describe('parser', () => {
  describe('parse numbers', () => {
    test('basic number parsing', () => {
      isParsed('1', { type: 'Literal', value: 1, raw: '1' });
      isParsed('-1', { type: 'Literal', value: -1, raw: '-1' });
      isParsed('2.4e+3', { type: 'Literal', value: 2400, raw: '2.4e+3' });
      isParsed('-1e+10', { type: 'Literal', value: -10000000000, raw: '-1e+10' });
      isParsed('1e-3', { type: 'Literal', value: 0.001, raw: '1e-3' });
    });
  });

  describe('parse booleans', () => {
    test('true values with different cases', () => {
      isParsed('TRUE', { type: 'Literal', value: true, raw: 'TRUE' });
      isParsed('true', { type: 'Literal', value: true, raw: 'true' });
      isParsed('trUe', { type: 'Literal', value: true, raw: 'trUe' });
      isParsed('TRue', { type: 'Literal', value: true, raw: 'TRue' });
    });

    test('false values with different cases', () => {
      isParsed('FALSE', { type: 'Literal', value: false, raw: 'FALSE' });
      isParsed('false', { type: 'Literal', value: false, raw: 'false' });
      isParsed('False', { type: 'Literal', value: false, raw: 'False' });
      isParsed('fAlSe', { type: 'Literal', value: false, raw: 'fAlSe' });
    });
  });

  describe('parse strings', () => {
    test('string literal parsing', () => {
      isParsed('""', { type: 'Literal', value: '', raw: '""' });
      isParsed('""""', { type: 'Literal', value: '"', raw: '""""' });
      isParsed('"  "', { type: 'Literal', value: '  ', raw: '"  "' });
      isParsed('"foobar"', { type: 'Literal', value: 'foobar', raw: '"foobar"' });
      isParsed('"foo  bar"', { type: 'Literal', value: 'foo  bar', raw: '"foo  bar"' });
      isParsed('"foo""bar"', { type: 'Literal', value: 'foo"bar', raw: '"foo""bar"' });
    });
  });

  describe('parse errors', () => {
    test('error literal parsing', () => {
      isParsed('#CALC!', { type: 'ErrorLiteral', value: '#CALC!', raw: '#CALC!' });
      isParsed('#DIV/0!', { type: 'ErrorLiteral', value: '#DIV/0!', raw: '#DIV/0!' });
      isParsed('#FIELD!', { type: 'ErrorLiteral', value: '#FIELD!', raw: '#FIELD!' });
      isParsed('#GETTING_DATA', { type: 'ErrorLiteral', value: '#GETTING_DATA', raw: '#GETTING_DATA' });
      isParsed('#N/A', { type: 'ErrorLiteral', value: '#N/A', raw: '#N/A' });
      isParsed('#NAME?', { type: 'ErrorLiteral', value: '#NAME?', raw: '#NAME?' });
      isParsed('#NULL!', { type: 'ErrorLiteral', value: '#NULL!', raw: '#NULL!' });
      isParsed('#NUM!', { type: 'ErrorLiteral', value: '#NUM!', raw: '#NUM!' });
      isParsed('#REF!', { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' });
      isParsed('#SPILL!', { type: 'ErrorLiteral', value: '#SPILL!', raw: '#SPILL!' });
      isParsed('#SYNTAX?', { type: 'ErrorLiteral', value: '#SYNTAX?', raw: '#SYNTAX?' });
      isParsed('#UNKNOWN!', { type: 'ErrorLiteral', value: '#UNKNOWN!', raw: '#UNKNOWN!' });
      isParsed('#VALUE!', { type: 'ErrorLiteral', value: '#VALUE!', raw: '#VALUE!' });
    });
  });

  describe('parse ranges', () => {
    test('basic range references', () => {
      isParsed('A1', { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' });
      isParsed('A1:B2', { type: 'ReferenceIdentifier', value: 'A1:B2', kind: 'range' });
      isParsed('A:B', { type: 'ReferenceIdentifier', value: 'A:B', kind: 'beam' });
      isParsed('1:2', { type: 'ReferenceIdentifier', value: '1:2', kind: 'beam' });
      isParsed('A1:2', { type: 'ReferenceIdentifier', value: 'A1:2', kind: 'range' });
      isParsed('1:A2', { type: 'ReferenceIdentifier', value: '1:A2', kind: 'range' });
      isParsed('A1.:.B2', { type: 'ReferenceIdentifier', value: 'A1.:.B2', kind: 'range' });
    });

    test('sheet qualified references', () => {
      isParsed('Sheet!A1', { type: 'ReferenceIdentifier', value: 'Sheet!A1', kind: 'range' });
      isParsed('[Workbook]Sheet!A1', { type: 'ReferenceIdentifier', value: '[Workbook]Sheet!A1', kind: 'range' });
      isParsed('\'Sheet\'!A1', { type: 'ReferenceIdentifier', value: '\'Sheet\'!A1', kind: 'range' });
      isParsed('\'[Workbook]Sheet\'!A1', { type: 'ReferenceIdentifier', value: '\'[Workbook]Sheet\'!A1', kind: 'range' });
      isParsed('\'Workbook\'!A1', { type: 'ReferenceIdentifier', value: '\'Workbook\'!A1', kind: 'range' });
      isParsed('\'[Workbook]Sheet\'!A1', { type: 'ReferenceIdentifier', value: '\'[Workbook]Sheet\'!A1', kind: 'range' });
    });

    test('named references', () => {
      isParsed('foo', { type: 'ReferenceIdentifier', value: 'foo', kind: 'name' });
      isParsed('Workbook!foo', { type: 'ReferenceIdentifier', value: 'Workbook!foo', kind: 'name' });
      isParsed('[Workbook]Sheet!foo', { type: 'ReferenceIdentifier', value: '[Workbook]Sheet!foo', kind: 'name' });
    });
  });

  describe('parse array literals', () => {
    test('single element arrays', () => {
      isParsed('{1}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 1, raw: '1' }
        ] ]
      });

      isParsed('{-1}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: -1, raw: '-1' }
        ] ]
      });

      isParsed('{#DIV/0!}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'ErrorLiteral', value: '#DIV/0!', raw: '#DIV/0!' }
        ] ]
      });

      isParsed('{TRUE}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: true, raw: 'TRUE' }
        ] ]
      });

      isParsed('{"foo"}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 'foo', raw: '"foo"' }
        ] ]
      });
    });

    test('multi-element arrays', () => {
      isParsed('{1,2}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' }
        ] ]
      });

      isParsed('{1,2;3}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' }
        ], [
          { type: 'Literal', value: 3, raw: '3' }
        ] ]
      });

      isParsed('{1,2;3,4}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' }
        ], [
          { type: 'Literal', value: 3, raw: '3' },
          { type: 'Literal', value: 4, raw: '4' }
        ] ]
      });

      isParsed('{1;2}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 1, raw: '1' }
        ], [
          { type: 'Literal', value: 2, raw: '2' }
        ] ]
      });

      isParsed('{1;2,3}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: 1, raw: '1' }
        ], [
          { type: 'Literal', value: 2, raw: '2' },
          { type: 'Literal', value: 3, raw: '3' }
        ] ]
      });
    });

    test('arrays with ranges', () => {
      isParsed('{A1,A1:B2;A:A}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
          { type: 'ReferenceIdentifier', value: 'A1:B2', kind: 'range' }
        ], [
          { type: 'ReferenceIdentifier', value: 'A:A', kind: 'beam' }
        ] ]
      }, { permitArrayRanges: true });
    });

    test('mixed type arrays', () => {
      isParsed('{-0.1,"foo";#NAME?,false}', {
        type: 'ArrayExpression',
        elements: [ [
          { type: 'Literal', value: -0.1, raw: '-0.1' },
          { type: 'Literal', value: 'foo', raw: '"foo"' }
        ], [
          { type: 'ErrorLiteral', value: '#NAME?', raw: '#NAME?' },
          { type: 'Literal', value: false, raw: 'false' }
        ] ]
      });
    });

    test('invalid array expressions', () => {
      isInvalidExpr('{A1}', { permitArrayRanges: false });
      isInvalidExpr('{--1}', { negativeNumbers: true });
      isInvalidExpr('{--1}', { negativeNumbers: false });
      isInvalidExpr('{---1}', { negativeNumbers: true });
      isInvalidExpr('{---1}', { negativeNumbers: false });
      isInvalidExpr('{+1}'); // Excel silently corrects this 🤔
      isInvalidExpr('{(1)}');
      isInvalidExpr('{SUM(1)}');
      isInvalidExpr('{{}}');
      isInvalidExpr('{{}');
      isInvalidExpr('{}}');
      isInvalidExpr('{2+2}');
      isInvalidExpr('{}');
      isInvalidExpr('{,}');
      isInvalidExpr('{1,}');
      isInvalidExpr('{,1}');
      isInvalidExpr('{;}');
    });

    test('array expressions with function calls', () => {
      isParsed('={1234; UNIQUE(A:A)}',
        { type: 'ArrayExpression',
          elements: [
            [ { type: 'Literal', value: 1234, raw: '1234' } ],
            [ { type: 'CallExpression',
              callee: { type: 'Identifier', name: 'UNIQUE' },
              arguments: [
                { type: 'ReferenceIdentifier', value: 'A:A', kind: 'beam' }
              ] } ]
          ] },
        { permitArrayCalls: true });

      isParsed('={SUM({1,2}),3}',
        { type: 'ArrayExpression',
          elements: [
            [ { type: 'CallExpression',
              callee: { type: 'Identifier', name: 'SUM' },
              arguments: [
                { type: 'ArrayExpression',
                  elements: [ [
                    { type: 'Literal', value: 1, raw: '1' },
                    { type: 'Literal', value: 2, raw: '2' }
                  ] ] }
              ] },
            { type: 'Literal', value: 3, raw: '3' } ]
          ] },
        { permitArrayCalls: true });
    });
  });

  describe('parse function calls', () => {
    test('basic function calls', () => {
      isParsed('=foo()', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'foo' },
        arguments: []
      });

      isParsed('=FOO()', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: []
      });

      isParsed('=FOO(1)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
      });

      isParsed('=FOO(1,2)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' }
        ]
      });
    });

    test('function calls with many arguments', () => {
      const args = Array(300).fill('1');
      isParsed(`=FOO(${args.join(',')})`, {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [ ...args.map(() => ({ type: 'Literal', value: 1, raw: '1' })) ]
      });
    });

    test('function calls with ranges', () => {
      isParsed('=FOO(A1,B2)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [
          { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
          { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
        ]
      });

      isParsed('=FOO((A1,B2))', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [
          { type: 'BinaryExpression',
            operator: ',',
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] }
        ]
      });
    });

    test('nested function calls', () => {
      isParsed('=FOO(BAR())', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [
          { type: 'CallExpression',
            callee: { type: 'Identifier', name: 'BAR' },
            arguments: [] }
        ]
      });
    });

    test('function calls with null arguments', () => {
      isParsed('=FOO(,)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [ null, null ]
      });

      isParsed('=FOO(,,)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [ null, null, null ]
      });

      isParsed('=FOO(1,)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [ { type: 'Literal', value: 1, raw: '1' }, null ]
      });

      isParsed('=FOO(,1)', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FOO' },
        arguments: [ null, { type: 'Literal', value: 1, raw: '1' } ]
      });
    });

    test('boolean function names', () => {
      isParsed('=FALSE()', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'FALSE' },
        arguments: []
      });

      isParsed('=TRUE()', {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'TRUE' },
        arguments: []
      });
    });

    test('invalid function calls', () => {
      isInvalidExpr('=FOO((1,2))');
      isInvalidExpr('=FOO(');
      isInvalidExpr('=FOO ()');
    });
  });

  describe('parse unary operators', () => {
    describe('unary operator %', () => {
      test('percentage operator', () => {
        isParsed('A1%', {
          type: 'UnaryExpression',
          operator: '%',
          arguments: [ { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' } ]
        });

        isParsed('1%', {
          type: 'UnaryExpression',
          operator: '%',
          arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
        });

        isParsed('(1)%', {
          type: 'UnaryExpression',
          operator: '%',
          arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
        });
      });

      test('invalid percentage usage', () => {
        isInvalidExpr('%');
      });
    });

    describe('unary operator -', () => {
      test('negative numbers', () => {
        isParsed('-1', { type: 'Literal', value: -1, raw: '-1' });

        isParsed('-1', {
          type: 'UnaryExpression',
          operator: '-',
          arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
        }, { negativeNumbers: false });

        isParsed('-"1"', {
          type: 'UnaryExpression',
          operator: '-',
          arguments: [ { type: 'Literal', value: '1', raw: '"1"' } ]
        });

        isParsed('-A1:B2', {
          type: 'UnaryExpression',
          operator: '-',
          arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2', kind: 'range' } ]
        });
      });

      test('double negative', () => {
        isParsed('--1', {
          type: 'UnaryExpression',
          operator: '-',
          arguments: [ { type: 'Literal', value: -1, raw: '-1' } ]
        });

        isParsed('--1', {
          type: 'UnaryExpression',
          operator: '-',
          arguments: [ {
            type: 'UnaryExpression',
            operator: '-',
            arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
          } ]
        }, { negativeNumbers: false });
      });

      test('invalid negative usage', () => {
        isInvalidExpr('--');
        isInvalidExpr('-');
      });
    });

    describe('unary operator +', () => {
      test('positive operator', () => {
        isParsed('+1', {
          type: 'UnaryExpression',
          operator: '+',
          arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
        });

        isParsed('+(1)', {
          type: 'UnaryExpression',
          operator: '+',
          arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
        });

        isParsed('+"1"', {
          type: 'UnaryExpression',
          operator: '+',
          arguments: [ { type: 'Literal', value: '1', raw: '"1"' } ]
        });

        isParsed('+A1:B2', {
          type: 'UnaryExpression',
          operator: '+',
          arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2', kind: 'range' } ]
        });
      });

      test('invalid positive usage', () => {
        isInvalidExpr('++');
        isInvalidExpr('+');
      });
    });

    describe('unary operator #', () => {
      test('spill operator', () => {
        isParsed('D9#', {
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ { type: 'ReferenceIdentifier', value: 'D9', kind: 'range' } ]
        });

        isParsed('A1:B2#', { // this parses but is a runtime error in Excel
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2', kind: 'range' } ]
        });

        isParsed('(A1):(B2)#', { // this parses but is a runtime error in Excel
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ { type: 'BinaryExpression',
            operator: ':',
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] } ]
        });

        isParsed('(A1,B2)#', {
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ { type: 'BinaryExpression',
            operator: ',',
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] } ]
        });

        isParsed('(A1 B2)#', {
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ { type: 'BinaryExpression',
            operator: ' ',
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] } ]
        });

        isParsed('#REF!#', {
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' } ]
        });

        isParsed('INDIRECT("d9")#', {
          type: 'UnaryExpression',
          operator: '#',
          arguments: [ {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'INDIRECT' },
            arguments: [ { type: 'Literal', value: 'd9', raw: '"d9"' } ]
          } ]
        });
      });

      test('invalid spill operator usage', () => {
        isInvalidExpr('1#');
        isInvalidExpr('"foo"#');
        isInvalidExpr('#A1');
        isInvalidExpr('##');
        isInvalidExpr('#VALUE!#');
        isInvalidExpr('#');
        isInvalidExpr('#A1');
      });
    });

    describe('unary operator @', () => {
      test('implicit intersection operator', () => {
        isParsed('@1', {
          type: 'UnaryExpression',
          operator: '@',
          arguments: [ { type: 'Literal', raw: '1', value: 1 } ]
        });

        isParsed('@"foo"', {
          type: 'UnaryExpression',
          operator: '@',
          arguments: [ { type: 'Literal', raw: '"foo"', value: 'foo' } ]
        });

        isParsed('@D9', {
          type: 'UnaryExpression',
          operator: '@',
          arguments: [ { type: 'ReferenceIdentifier', value: 'D9', kind: 'range' } ]
        });

        isParsed('@A1:B2', {
          type: 'UnaryExpression',
          operator: '@',
          arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2', kind: 'range' } ]
        });

        isParsed('@#REF!', {
          type: 'UnaryExpression',
          operator: '@',
          arguments: [ { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' } ]
        });

        isParsed('@FOO()', {
          type: 'UnaryExpression',
          operator: '@',
          arguments: [ {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'FOO' },
            arguments: []
          } ]
        });
      });

      test('invalid implicit intersection usage', () => {
        isInvalidExpr('@');
        isInvalidExpr('@@');
      });
    });
  });

  describe('parse binary operators', () => {
    const operators = [ '+', '-', '^', '*', '/', '&', '=', '<', '>', '<=', '>=', '<>' ];

    operators.forEach(op => {
      describe(`binary operator ${op}`, () => {
        test(`basic ${op} operations`, () => {
          isParsed(`1${op}2`, {
            type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'Literal', value: 1, raw: '1' },
              { type: 'Literal', value: 2, raw: '2' }
            ]
          });

          isParsed(`1${op}2${op}3`, {
            type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'BinaryExpression',
                operator: op,
                arguments: [
                  { type: 'Literal', value: 1, raw: '1' },
                  { type: 'Literal', value: 2, raw: '2' }
                ] },
              { type: 'Literal', value: 3, raw: '3' }
            ]
          });
        });

        test(`${op} with strings`, () => {
          isParsed(`"foo"${op}"bar"`, {
            type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'Literal', value: 'foo', raw: '"foo"' },
              { type: 'Literal', value: 'bar', raw: '"bar"' }
            ]
          });
        });

        test(`${op} with arrays`, () => {
          isParsed(`{1,2}${op}{3,4}`, {
            type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ArrayExpression',
                elements: [ [
                  { type: 'Literal', value: 1, raw: '1' },
                  { type: 'Literal', value: 2, raw: '2' }
                ] ] },
              { type: 'ArrayExpression',
                elements: [ [
                  { type: 'Literal', value: 3, raw: '3' },
                  { type: 'Literal', value: 4, raw: '4' }
                ] ] }
            ]
          });
        });

        test(`${op} with function calls`, () => {
          isParsed(`FOO()${op}BAR()`, {
            type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' }, arguments: [] },
              { type: 'CallExpression', callee: { type: 'Identifier', name: 'BAR' }, arguments: [] }
            ]
          });
        });

        test(`invalid ${op} usage`, () => {
          isInvalidExpr(op);
          isInvalidExpr(op + op);
          isInvalidExpr('1' + op);
          if (op !== '+' && op !== '-') {
            isInvalidExpr('=' + op + '1');
          }
        });
      });
    });
  });

  describe('parse range operators', () => {
    const rangeOps = [
      [ ':', 'range-join' ],
      [ ',', 'union' ],
      [ ' ', 'intersection' ]
    ];

    rangeOps.forEach(([ op, opName ]) => {
      describe(`${opName} operator "${op}"`, () => {
        test('basic range operations', () => {
          isParsed(`named1${op}named2`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'named1', kind: 'name' },
              { type: 'ReferenceIdentifier', value: 'named2', kind: 'name' }
            ] });

          isParsed(`A1${op}named2`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'named2', kind: 'name' }
            ] });

          isParsed(`named1${op}B2`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'named1', kind: 'name' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] });

          isParsed(`(A1)${op}(B2)`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] });
        });

        test('range operator with whitespace', () => {
          isParsed(`A1 ${op} B2`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] });
        });

        test('invalid range operations', () => {
          isInvalidExpr(`A1${op}0`);
          isInvalidExpr(`0${op}A1`);
          isInvalidExpr(`0${op}0`);
          isInvalidExpr(`"foo"${op}"bar"`);
          isInvalidExpr(`TRUE${op}FALSE`);
          isInvalidExpr(`A1${op}#NAME?`);
          isInvalidExpr(`A1${op}#VALUE!`);
          isInvalidExpr(`#NULL!${op}A1`);
        });

        test('range operations with REF errors', () => {
          isParsed(`A1${op}#REF!`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
              { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' }
            ] });

          isParsed(`#REF!${op}B2`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' },
              { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
            ] });
        });

        test('range operations with complex expressions', () => {
          isParsed(`(A1,B2)${op}C3`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'BinaryExpression',
                operator: ',',
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
                  { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
                ] },
              { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' }
            ] });

          isParsed(`C3${op}(A1,B2)`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' },
              { type: 'BinaryExpression',
                operator: ',',
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
                  { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
                ] }
            ] });

          isParsed(`(A1 B2)${op}C3`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'BinaryExpression',
                operator: ' ',
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
                  { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
                ] },
              { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' }
            ] });

          isParsed(`C3${op}(A1 B2)`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' },
              { type: 'BinaryExpression',
                operator: ' ',
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
                  { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
                ] }
            ] });

          isParsed(`(A1:(B2))${op}C3`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'BinaryExpression',
                operator: ':',
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
                  { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
                ] },
              { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' }
            ] });

          isParsed(`C3${op}(A1:(B2))`, { type: 'BinaryExpression',
            operator: op,
            arguments: [
              { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' },
              { type: 'BinaryExpression',
                operator: ':',
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
                  { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
                ] }
            ] });
        });

        test('range operations with ref functions', () => {
          const refFunctions = [
            [ 'ANCHORARRAY', true ],
            [ 'CHOOSE', true ],
            [ 'DROP', true ],
            [ 'IF', true ],
            [ 'IFS', true ],
            [ 'INDEX', true ],
            [ 'INDIRECT', true ],
            [ 'OFFSET', true ],
            [ 'REDUCE', true ],
            [ 'SINGLE', true ],
            [ 'SWITCH', true ],
            [ 'TAKE', true ],
            [ 'XLOOKUP', true ],
            [ 'CELL', false ],
            [ 'COUNT', false ],
            [ 'HSTACK', false ],
            [ 'N', false ],
            [ 'SUM', false ]
          ];

          refFunctions.forEach(([ funcName, shouldWork ]) => {
            if (shouldWork) {
              isParsed(`${funcName}()${op}C3`, { type: 'BinaryExpression',
                operator: op,
                arguments: [
                  { type: 'CallExpression', callee: { type: 'Identifier', name: funcName }, arguments: [] },
                  { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' }
                ] });

              isParsed(`C3${op}${funcName}()`, { type: 'BinaryExpression',
                operator: op,
                arguments: [
                  { type: 'ReferenceIdentifier', value: 'C3', kind: 'range' },
                  { type: 'CallExpression', callee: { type: 'Identifier', name: funcName }, arguments: [] }
                ] });
            }
            else {
              isInvalidExpr(`${funcName}()${op}C3`);
              isInvalidExpr(`C3${op}${funcName}()`);
            }
          });
        });
      });
    });
  });

  describe('advanced parsing features', () => {
    test('union operators are normalized', () => {
      isParsed('A1 B2', {
        type: 'BinaryExpression',
        operator: ' ',
        arguments: [
          { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
          { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
        ]
      });

      isParsed('A1    B2', {
        type: 'BinaryExpression',
        operator: ' ',
        arguments: [
          { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
          { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
        ]
      });
    });

    test('does not tolerate unterminated tokens', () => {
      isInvalidExpr('="foo');
    });

    test('position information is correct', () => {
      isParsed(
        '=123.45',
        { type: 'Literal', value: 123.45, loc: [ 1, 7 ], raw: '123.45' },
        { withLocation: true }
      );

      isParsed(
        '="foo"',
        { type: 'Literal', value: 'foo', loc: [ 1, 6 ], raw: '"foo"' },
        { withLocation: true }
      );

      isParsed(
        '=true',
        { type: 'Literal', value: true, loc: [ 1, 5 ], raw: 'true' },
        { withLocation: true }
      );

      isParsed(
        '=Sheet1!A1:B2',
        { type: 'ReferenceIdentifier', value: 'Sheet1!A1:B2', kind: 'range', loc: [ 1, 13 ] },
        { withLocation: true }
      );

      isParsed(
        '=(#VALUE!)',
        { type: 'ErrorLiteral', value: '#VALUE!', loc: [ 2, 9 ], raw: '#VALUE!' },
        { withLocation: true }
      );

      // UnaryExpression
      isParsed(
        '=-A1',
        { type: 'UnaryExpression',
          loc: [ 1, 4 ],
          operator: '-',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1', kind: 'range', loc: [ 2, 4 ] }
          ] },
        { withLocation: true }
      );

      isParsed(
        '=10%',
        { type: 'UnaryExpression',
          loc: [ 1, 4 ],
          operator: '%',
          arguments: [
            { type: 'Literal', value: 10, loc: [ 1, 3 ], raw: '10' }
          ] },
        { withLocation: true }
      );

      isParsed(
        '=-(123)',
        { type: 'UnaryExpression',
          loc: [ 1, 6 ],
          operator: '-',
          arguments: [
            { type: 'Literal', value: 123, loc: [ 3, 6 ], raw: '123' }
          ] },
        { withLocation: true }
      );

      isParsed(
        '(123+(234))',
        { type: 'BinaryExpression',
          loc: [ 1, 9 ],
          operator: '+',
          arguments: [
            { type: 'Literal', value: 123, loc: [ 1, 4 ], raw: '123' },
            { type: 'Literal', value: 234, loc: [ 6, 9 ], raw: '234' }
          ] },
        { withLocation: true }
      );

      isParsed(
        '=(A1 B2)',
        { type: 'BinaryExpression',
          loc: [ 2, 7 ],
          operator: ' ',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1', kind: 'range', loc: [ 2, 4 ] },
            { type: 'ReferenceIdentifier', value: 'B2', kind: 'range', loc: [ 5, 7 ] }
          ] },
        { withLocation: true }
      );

      isParsed(
        '=SUM(4,5)',
        { type: 'CallExpression',
          loc: [ 1, 9 ],
          callee: { type: 'Identifier', name: 'SUM', loc: [ 1, 4 ] },
          arguments: [
            { type: 'Literal', value: 4, loc: [ 5, 6 ], raw: '4' },
            { type: 'Literal', value: 5, loc: [ 7, 8 ], raw: '5' }
          ] },
        { withLocation: true }
      );

      // ArrayExpression
      isParsed(
        '={ 1, 2; 3, 4 }',
        { type: 'ArrayExpression',
          loc: [ 1, 15 ],
          elements: [
            [ { type: 'Literal', value: 1, loc: [ 3, 4 ], raw: '1' },
              { type: 'Literal', value: 2, loc: [ 6, 7 ], raw: '2' } ],
            [ { type: 'Literal', value: 3, loc: [ 9, 10 ], raw: '3' },
              { type: 'Literal', value: 4, loc: [ 12, 13 ], raw: '4' } ]
          ] },
        { withLocation: true }
      );
    });

    test('whitespace handling in various contexts', () => {
      // whitespace in arrays
      isParsed('=SORT({ A:A, B:B })',
        { type: 'CallExpression',
          callee: { type: 'Identifier', name: 'SORT' },
          arguments: [
            { type: 'ArrayExpression',
              elements: [
                [ { type: 'ReferenceIdentifier', value: 'A:A', kind: 'beam' },
                  { type: 'ReferenceIdentifier', value: 'B:B', kind: 'beam' } ]
              ] }
          ] },
        { permitArrayRanges: true });

      // whitespace in arguments
      isParsed('=A2:A5=XLOOKUP(B1,C:C, D:D)',
        { type: 'BinaryExpression',
          operator: '=',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A2:A5', kind: 'range' },
            { type: 'CallExpression',
              callee: { type: 'Identifier', name: 'XLOOKUP' },
              arguments: [
                { type: 'ReferenceIdentifier', value: 'B1', kind: 'range' },
                { type: 'ReferenceIdentifier', value: 'C:C', kind: 'beam' },
                { type: 'ReferenceIdentifier', value: 'D:D', kind: 'beam' }
              ] }
          ] },
        { permitArrayRanges: true });

      // whitespace surrounding comma
      isParsed('=SUM(12 , B:B)',
        { type: 'CallExpression',
          callee: { type: 'Identifier', name: 'SUM' },
          arguments: [
            { type: 'Literal', value: 12, raw: '12' },
            { type: 'ReferenceIdentifier', value: 'B:B', kind: 'beam' }
          ] },
        { permitArrayCalls: true });

      // whitespace tailing operator
      isParsed('=A:A= C1',
        { type: 'BinaryExpression',
          operator: '=',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A:A', kind: 'beam' },
            { type: 'ReferenceIdentifier', value: 'C1', kind: 'range' }
          ] },
        { permitArrayCalls: true });
    });

    test('parser can permit xlsx mode references', () => {
      isInvalidExpr('=SUM([Workbook.xlsx]!A1+[Workbook.xlsx]!Table1[#Data])');
      isParsed('=SUM([Workbook.xlsx]!A1+[Workbook.xlsx]!Table1[#Data])',
        { type: 'CallExpression',
          callee: { type: 'Identifier', name: 'SUM' },
          arguments: [
            { type: 'BinaryExpression',
              operator: '+',
              arguments: [
                { type: 'ReferenceIdentifier', value: '[Workbook.xlsx]!A1', kind: 'range' },
                { type: 'ReferenceIdentifier', value: '[Workbook.xlsx]!Table1[#Data]', kind: 'table' }
              ] }
          ] },
        { xlsx: true });
    });

    test('parser supports LAMBDA expressions', () => {
      // Invalid LAMBDA expressions
      isInvalidExpr('LAMBDA(,)');
      isInvalidExpr('LAMBDA(a,)');
      isInvalidExpr('LAMBDA(a,,)');
      isInvalidExpr('=LAMBDA(1,1)');
      isInvalidExpr('=LAMBDA(a,1,a)');
      isInvalidExpr('=LAMBDA(a,A,1)');
      isInvalidExpr('=LAMBDA(a,a,1)');
      isInvalidExpr('=LAMBDA(A1,B1,1)');

      // Valid LAMBDA expressions
      isParsed('=LAMBDA()', {
        type: 'LambdaExpression',
        params: [],
        body: null
      });

      isParsed('=LAMBDA(1)', {
        type: 'LambdaExpression',
        params: [],
        body: {
          type: 'Literal',
          value: 1,
          raw: '1'
        }
      });

      isParsed('=LAMBDA(1+1)', {
        type: 'LambdaExpression',
        params: [],
        body: {
          type: 'BinaryExpression',
          operator: '+',
          arguments: [
            { type: 'Literal', value: 1, raw: '1' },
            { type: 'Literal', value: 1, raw: '1' }
          ]
        }
      });

      isParsed('=LAMBDA(a,1)', {
        type: 'LambdaExpression',
        body: { type: 'Literal', value: 1, raw: '1' },
        params: [
          { type: 'Identifier', name: 'a' }
        ]
      });

      isParsed('=LAMBDA(a,b,1)', {
        type: 'LambdaExpression',
        body: { type: 'Literal', value: 1, raw: '1' },
        params: [
          { type: 'Identifier', name: 'a' },
          { type: 'Identifier', name: 'b' }
        ]
      });

      isParsed('=lambda(a,b,a*b)', {
        type: 'LambdaExpression',
        body: {
          type: 'BinaryExpression',
          operator: '*',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'a', kind: 'name' },
            { type: 'ReferenceIdentifier', value: 'b', kind: 'name' }
          ]
        },
        params: [
          { type: 'Identifier', name: 'a' },
          { type: 'Identifier', name: 'b' }
        ]
      });

      isParsed('=lambda( a , b , a b )', {
        type: 'LambdaExpression',
        body: {
          type: 'BinaryExpression',
          operator: ' ',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'a', kind: 'name' },
            { type: 'ReferenceIdentifier', value: 'b', kind: 'name' }
          ]
        },
        params: [
          { type: 'Identifier', name: 'a' },
          { type: 'Identifier', name: 'b' }
        ]
      });

      // r and c are forbidden as names, but should work here
      isParsed('=LAMBDA(r,c,r*c)', {
        type: 'LambdaExpression',
        body: {
          type: 'BinaryExpression',
          operator: '*',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'r', kind: 'name' },
            { type: 'ReferenceIdentifier', value: 'c', kind: 'name' }
          ]
        },
        params: [
          { type: 'Identifier', name: 'r' },
          { type: 'Identifier', name: 'c' }
        ]
      });
    });

    test('parser allows calling refs, lambda, let, and call expressions', () => {
      // Invalid function calls
      isInvalidExpr('1()');
      isInvalidExpr('"str"()');
      isInvalidExpr('#VALUE!()');
      isInvalidExpr('foo%()');
      isInvalidExpr('foo ()');

      // Valid callable expressions
      isParsed('=lambda()()', {
        type: 'CallExpression',
        callee: {
          type: 'LambdaExpression',
          params: [],
          body: null
        },
        arguments: []
      });

      isParsed('=lambda(1)(1)', {
        type: 'CallExpression',
        callee: {
          type: 'LambdaExpression',
          params: [],
          body: { type: 'Literal', value: 1, raw: '1' }
        },
        arguments: [
          { type: 'Literal', value: 1, raw: '1' }
        ]
      });

      isParsed('=FOO()()', {
        type: 'CallExpression',
        callee: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'FOO' },
          arguments: []
        },
        arguments: []
      });

      isParsed('=(A1)()', {
        type: 'CallExpression',
        callee: { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
        arguments: []
      });

      isParsed('=LET(a,1,a)()', {
        type: 'CallExpression',
        callee: {
          type: 'LetExpression',
          declarations: [
            { type: 'LetDeclarator',
              id: { type: 'Identifier', name: 'a' },
              init: { type: 'Literal', value: 1, raw: '1' } }
          ],
          body: { type: 'ReferenceIdentifier', value: 'a', kind: 'name' }
        },
        arguments: []
      });

      isParsed('=#REF!()', {
        type: 'CallExpression',
        callee: {
          type: 'ErrorLiteral',
          value: '#REF!',
          raw: '#REF!'
        },
        arguments: []
      });

      // this is allowed because in Excel: `foo#()` is really `ANCHORARRAY(foo)()`
      isParsed('foo#()', {
        type: 'CallExpression',
        callee: {
          type: 'UnaryExpression',
          operator: '#',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'foo', kind: 'name' }
          ]
        },
        arguments: []
      });
    });

    test('parser supports LET expressions', () => {
      // Invalid LET expressions
      isInvalidExpr('LET(,)');
      isInvalidExpr('LET(1,a,1)');
      isInvalidExpr('LET()');
      isInvalidExpr('LET(a,b)');
      isInvalidExpr('LET(a,)');
      isInvalidExpr('LET(a,a,1,1)');
      isInvalidExpr('LET(a,a,1,a)');
      isInvalidExpr('LET(a,1,b,1,c,1,a1+b,1)');
      isInvalidExpr('LET(a,1,a,1,1)');
      isInvalidExpr('LET(a,1,A,1,1)');

      // Valid LET expressions
      isParsed('=LET(a,1,)', {
        type: 'LetExpression',
        declarations: [
          {
            type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'a' },
            init: { type: 'Literal', value: 1, raw: '1' }
          }
        ],
        body: null
      });

      isParsed('=LET(a,1,a)', {
        type: 'LetExpression',
        declarations: [
          {
            type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'a' },
            init: { type: 'Literal', value: 1, raw: '1' }
          }
        ],
        body: { type: 'ReferenceIdentifier', value: 'a', kind: 'name' }
      });

      isParsed('=LET(a,1,b,1,c,1,a+b*c)', {
        type: 'LetExpression',
        declarations: [
          { type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'a' },
            init: { type: 'Literal', value: 1, raw: '1' } },
          { type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'b' },
            init: { type: 'Literal', value: 1, raw: '1' } },
          { type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'c' },
            init: { type: 'Literal', value: 1, raw: '1' } }
        ],
        body: {
          type: 'BinaryExpression',
          operator: '+',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'a', kind: 'name' },
            { type: 'BinaryExpression',
              operator: '*',
              arguments: [
                { type: 'ReferenceIdentifier', value: 'b', kind: 'name' },
                { type: 'ReferenceIdentifier', value: 'c', kind: 'name' }
              ] }
          ]
        }
      });

      // r and c are forbidden as names, but should work here
      isParsed('LET(r,1,c,1,r*c)', {
        type: 'LetExpression',
        declarations: [
          { type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'r' },
            init: { type: 'Literal', value: 1, raw: '1' } },
          {
            type: 'LetDeclarator',
            id: { type: 'Identifier', name: 'c' },
            init: { type: 'Literal', value: 1, raw: '1' }
          }
        ],
        body: {
          type: 'BinaryExpression',
          operator: '*',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'r', kind: 'name' },
            { type: 'ReferenceIdentifier', value: 'c', kind: 'name' }
          ]
        }
      });
    });

    test('parser whitespace handling', () => {
      isParsed('\tA1\u00a0+\nB2\r', {
        type: 'BinaryExpression',
        operator: '+',
        arguments: [
          { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
          { type: 'ReferenceIdentifier', value: 'B2', kind: 'range' }
        ]
      });
    });

    test('looseRefCalls: true relaxes ref function restrictions', () => {
      isInvalidExpr('A1:TESTFN()');
      isParsed('A1:TESTFN()', {
        type: 'BinaryExpression',
        operator: ':',
        arguments: [
          { type: 'ReferenceIdentifier', value: 'A1', kind: 'range' },
          { type: 'CallExpression', callee: { type: 'Identifier', name: 'TESTFN' }, arguments: [] }
        ]
      }, { looseRefCalls: true });
    });
  });
});
