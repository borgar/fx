/* eslint-disable object-property-newline, object-curly-newline */
import { test, Test } from 'tape';
import { parse } from './parser.js';

Test.prototype.isParsed = function isParsed (expr, expect, opts) {
  const result = parse(expr, { allowTernary: true, withLocation: false, ...opts });
  const cleaned = JSON.parse(JSON.stringify(result));
  this.deepEqual(cleaned, expect, `\x1b[32m${expr}\x1b[0m`);
};

Test.prototype.isInvalidExpr = function isInvalidExpr (expr, opts) {
  this.throws(
    () => parse(expr, { allowTernary: true, ...opts }),
    `\x1b[36m${expr}\x1b[0m`
  );
};

test('parse numbers', t => {
  t.isParsed('1', { type: 'Literal', value: 1, raw: '1' });
  t.isParsed('-1', { type: 'Literal', value: -1, raw: '-1' });
  t.isParsed('2.4e+3', { type: 'Literal', value: 2400, raw: '2.4e+3' });
  t.isParsed('-1e+10', { type: 'Literal', value: -10000000000, raw: '-1e+10' });
  t.isParsed('1e-3', { type: 'Literal', value: 0.001, raw: '1e-3' });
  t.end();
});

test('parse booleans', t => {
  t.isParsed('TRUE', { type: 'Literal', value: true, raw: 'TRUE' });
  t.isParsed('true', { type: 'Literal', value: true, raw: 'true' });
  t.isParsed('trUe', { type: 'Literal', value: true, raw: 'trUe' });
  t.isParsed('TRue', { type: 'Literal', value: true, raw: 'TRue' });
  t.isParsed('FALSE', { type: 'Literal', value: false, raw: 'FALSE' });
  t.isParsed('false', { type: 'Literal', value: false, raw: 'false' });
  t.isParsed('False', { type: 'Literal', value: false, raw: 'False' });
  t.isParsed('fAlSe', { type: 'Literal', value: false, raw: 'fAlSe' });
  t.end();
});

test('parse strings', t => {
  t.isParsed('""', { type: 'Literal', value: '', raw: '""' });
  t.isParsed('""""', { type: 'Literal', value: '"', raw: '""""' });
  t.isParsed('"  "', { type: 'Literal', value: '  ', raw: '"  "' });
  t.isParsed('"foobar"', { type: 'Literal', value: 'foobar', raw: '"foobar"' });
  t.isParsed('"foo  bar"', { type: 'Literal', value: 'foo  bar', raw: '"foo  bar"' });
  t.isParsed('"foo""bar"', { type: 'Literal', value: 'foo"bar', raw: '"foo""bar"' });
  t.end();
});

test('parse errors', t => {
  t.isParsed('#CALC!', { type: 'ErrorLiteral', value: '#CALC!', raw: '#CALC!' });
  t.isParsed('#DIV/0!', { type: 'ErrorLiteral', value: '#DIV/0!', raw: '#DIV/0!' });
  t.isParsed('#FIELD!', { type: 'ErrorLiteral', value: '#FIELD!', raw: '#FIELD!' });
  t.isParsed('#GETTING_DATA', { type: 'ErrorLiteral', value: '#GETTING_DATA', raw: '#GETTING_DATA' });
  t.isParsed('#N/A', { type: 'ErrorLiteral', value: '#N/A', raw: '#N/A' });
  t.isParsed('#NAME?', { type: 'ErrorLiteral', value: '#NAME?', raw: '#NAME?' });
  t.isParsed('#NULL!', { type: 'ErrorLiteral', value: '#NULL!', raw: '#NULL!' });
  t.isParsed('#NUM!', { type: 'ErrorLiteral', value: '#NUM!', raw: '#NUM!' });
  t.isParsed('#REF!', { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' });
  t.isParsed('#SPILL!', { type: 'ErrorLiteral', value: '#SPILL!', raw: '#SPILL!' });
  t.isParsed('#SYNTAX?', { type: 'ErrorLiteral', value: '#SYNTAX?', raw: '#SYNTAX?' });
  t.isParsed('#UNKNOWN!', { type: 'ErrorLiteral', value: '#UNKNOWN!', raw: '#UNKNOWN!' });
  t.isParsed('#VALUE!', { type: 'ErrorLiteral', value: '#VALUE!', raw: '#VALUE!' });
  t.end();
});

test('parse ranges', t => {
  t.isParsed('A1', { type: 'ReferenceIdentifier', value: 'A1' });
  t.isParsed('A1:B2', { type: 'ReferenceIdentifier', value: 'A1:B2' });
  t.isParsed('A:B', { type: 'ReferenceIdentifier', value: 'A:B' });
  t.isParsed('1:2', { type: 'ReferenceIdentifier', value: '1:2' });
  t.isParsed('A1:2', { type: 'ReferenceIdentifier', value: 'A1:2' });
  t.isParsed('1:A2', { type: 'ReferenceIdentifier', value: '1:A2' });
  t.isParsed('Sheet!A1', { type: 'ReferenceIdentifier', value: 'Sheet!A1' });
  t.isParsed('[Workbook]Sheet!A1', { type: 'ReferenceIdentifier', value: '[Workbook]Sheet!A1' });
  t.isParsed('\'Sheet\'!A1', { type: 'ReferenceIdentifier', value: '\'Sheet\'!A1' });
  t.isParsed('\'[Workbook]Sheet\'!A1', { type: 'ReferenceIdentifier', value: '\'[Workbook]Sheet\'!A1' });
  t.isParsed('foo', { type: 'ReferenceIdentifier', value: 'foo' });
  t.isParsed('Workbook!foo', { type: 'ReferenceIdentifier', value: 'Workbook!foo' });
  t.isParsed('[Workbook]Sheet!foo', { type: 'ReferenceIdentifier', value: '[Workbook]Sheet!foo' });
  t.isParsed('\'Workbook\'!A1', { type: 'ReferenceIdentifier', value: '\'Workbook\'!A1' });
  t.isParsed('\'[Workbook]Sheet\'!A1', { type: 'ReferenceIdentifier', value: '\'[Workbook]Sheet\'!A1' });
  t.end();
});

test('parse array literals', t => {
  t.isParsed('{1}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' }
    ] ]
  });
  t.isParsed('{-1}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: -1, raw: '-1' }
    ] ]
  });
  t.isParsed('{#DIV/0!}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'ErrorLiteral', value: '#DIV/0!', raw: '#DIV/0!' }
    ] ]
  });
  t.isParsed('{TRUE}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: true, raw: 'TRUE' }
    ] ]
  });
  t.isParsed('{"foo"}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 'foo', raw: '"foo"' }
    ] ]
  });
  t.isParsed('{1,2}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' },
      { type: 'Literal', value: 2, raw: '2' }
    ] ]
  });
  t.isParsed('{1,2;3}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' },
      { type: 'Literal', value: 2, raw: '2' }
    ], [
      { type: 'Literal', value: 3, raw: '3' }
    ] ]
  });
  t.isParsed('{1,2;3,4}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' },
      { type: 'Literal', value: 2, raw: '2' }
    ], [
      { type: 'Literal', value: 3, raw: '3' },
      { type: 'Literal', value: 4, raw: '4' }
    ] ]
  });
  t.isParsed('{1;2}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' }
    ], [
      { type: 'Literal', value: 2, raw: '2' }
    ] ]
  });
  t.isParsed('{1;2,3}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' }
    ], [
      { type: 'Literal', value: 2, raw: '2' },
      { type: 'Literal', value: 3, raw: '3' }
    ] ]
  });
  t.isParsed('{1;2,3}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: 1, raw: '1' }
    ], [
      { type: 'Literal', value: 2, raw: '2' },
      { type: 'Literal', value: 3, raw: '3' }
    ] ]
  });
  t.isParsed('{A1,A1:B2;A:A}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'ReferenceIdentifier', value: 'A1' },
      { type: 'ReferenceIdentifier', value: 'A1:B2' }
    ], [
      { type: 'ReferenceIdentifier', value: 'A:A' }
    ] ]
  }, { permitArrayRanges: true });
  t.isParsed('{-0.1,"foo";#NAME?,false}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: -0.1, raw: '-0.1' },
      { type: 'Literal', value: 'foo', raw: '"foo"' }
    ], [
      { type: 'ErrorLiteral', value: '#NAME?', raw: '#NAME?' },
      { type: 'Literal', value: false, raw: 'false' }
    ] ]
  });
  t.isParsed('{-0.1,"foo";#NAME?,false}', {
    type: 'ArrayExpression',
    elements: [ [
      { type: 'Literal', value: -0.1, raw: '-0.1' },
      { type: 'Literal', value: 'foo', raw: '"foo"' }
    ], [
      { type: 'ErrorLiteral', value: '#NAME?', raw: '#NAME?' },
      { type: 'Literal', value: false, raw: 'false' }
    ] ]
  });
  // TODO: consider supporting this?:
  // t.isParsed('{-0.1}', {
  //   type: 'ArrayExpression',
  //   elements: [ [
  //     { type: 'Literal', value: -0.1, raw: '-0.1' }
  //   ] ]
  // }, { negativeNumbers: false });
  t.isInvalidExpr('{A1}', { permitArrayRanges: false });
  // TODO: WHY???
  // t.isInvalidExpr('{-1}', { negativeNumbers: true });
  t.isInvalidExpr('{--1}', { negativeNumbers: true });
  t.isInvalidExpr('{--1}', { negativeNumbers: false });
  t.isInvalidExpr('{---1}', { negativeNumbers: true });
  t.isInvalidExpr('{---1}', { negativeNumbers: false });
  t.isInvalidExpr('{+1}'); // Excel silently corrects this 🤔
  t.isInvalidExpr('{(1)}');
  t.isInvalidExpr('{SUM(1)}');
  t.isInvalidExpr('{{}}');
  t.isInvalidExpr('{{}');
  t.isInvalidExpr('{}}');
  t.isInvalidExpr('{2+2}');
  t.isInvalidExpr('{}');
  t.isInvalidExpr('{,}');
  t.isInvalidExpr('{1,}');
  t.isInvalidExpr('{,1}');
  t.isInvalidExpr('{;}');

  // permitArrayCalls
  t.isParsed('={1234; UNIQUE(A:A)}',
    { type: 'ArrayExpression', elements: [
      [ { type: 'Literal', value: 1234, raw: '1234' } ],
      [ { type: 'CallExpression', callee: { type: 'Identifier', name: 'UNIQUE' }, arguments: [
        { type: 'ReferenceIdentifier', value: 'A:A' }
      ] } ] ] },
    { permitArrayCalls: true });
  // permitArrayCalls can be nested
  t.isParsed('={SUM({1,2}),3}',
    { type: 'ArrayExpression', elements: [
      [ { type: 'CallExpression', callee: { type: 'Identifier', name: 'SUM' }, arguments: [
        { type: 'ArrayExpression', elements: [ [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' } ] ] }
      ] },
      { type: 'Literal', value: 3, raw: '3' } ] ] },
    { permitArrayCalls: true });
  t.end();
});

test('parse function calls', t => {
  t.isParsed('=foo()', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'foo' },
    arguments: []
  });
  t.isParsed('=FOO()', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: []
  });
  t.isParsed('=FOO(1)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
  });
  t.isParsed('=FOO(1,2)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [
      { type: 'Literal', value: 1, raw: '1' },
      { type: 'Literal', value: 2, raw: '2' } ]
  });
  const args = Array(300).fill('1');
  t.isParsed(`=FOO(${args.join(',')})`, {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [ ...args.map(() => ({ type: 'Literal', value: 1, raw: '1' })) ]
  });
  t.isParsed('=FOO(A1,B2)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [
      { type: 'ReferenceIdentifier', value: 'A1' },
      { type: 'ReferenceIdentifier', value: 'B2' } ]
  });
  t.isParsed('=FOO((A1,B2))', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [
      { type: 'BinaryExpression', operator: ',', arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ReferenceIdentifier', value: 'B2' } ] } ]
  });
  t.isParsed('=FOO(BAR())', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [
      { type: 'CallExpression', callee: { type: 'Identifier', name: 'BAR' },
        arguments: [] } ]
  });
  t.isParsed('=FOO(,)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [ null, null ]
  });
  t.isParsed('=FOO(,,)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [ null, null, null ]
  });
  t.isParsed('=FOO(1,)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [ { type: 'Literal', value: 1, raw: '1' }, null ]
  });
  t.isParsed('=FOO(,1)', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' },
    arguments: [ null, { type: 'Literal', value: 1, raw: '1' } ]
  });
  t.isInvalidExpr('=FOO((1,2))');
  t.isInvalidExpr('=FOO(');
  t.isInvalidExpr('=FOO ()');
  t.isParsed('=FALSE()', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'FALSE' },
    arguments: []
  });
  t.isParsed('=TRUE()', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'TRUE' },
    arguments: []
  });
  t.end();
});

test('parse unary operator %', t => {
  t.isParsed('A1%', {
    type: 'UnaryExpression', operator: '%',
    arguments: [ { type: 'ReferenceIdentifier', value: 'A1' } ]
  });
  t.isParsed('1%', {
    type: 'UnaryExpression', operator: '%',
    arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
  });
  t.isParsed('(1)%', {
    type: 'UnaryExpression', operator: '%',
    arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
  });
  t.isInvalidExpr('%');
  t.end();
});

test('parse unary operator -', t => {
  t.isParsed('-1', { type: 'Literal', value: -1, raw: '-1' });
  t.isParsed('-1', {
    type: 'UnaryExpression', operator: '-',
    arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
  }, { negativeNumbers: false });
  t.isParsed('-"1"', {
    type: 'UnaryExpression', operator: '-',
    arguments: [ { type: 'Literal', value: '1', raw: '"1"' } ]
  });
  t.isParsed('-A1:B2', {
    type: 'UnaryExpression', operator: '-',
    arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2' } ]
  });
  t.isParsed('--1', {
    type: 'UnaryExpression', operator: '-',
    arguments: [ { type: 'Literal', value: -1, raw: '-1' } ]
  });
  t.isParsed('--1', {
    type: 'UnaryExpression', operator: '-',
    arguments: [ {
      type: 'UnaryExpression', operator: '-',
      arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
    } ]
  }, { negativeNumbers: false });
  t.isInvalidExpr('--');
  t.isInvalidExpr('-');
  t.end();
});

test('parse unary operator +', t => {
  t.isParsed('+1', {
    type: 'UnaryExpression', operator: '+',
    arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
  });
  t.isParsed('+(1)', {
    type: 'UnaryExpression', operator: '+',
    arguments: [ { type: 'Literal', value: 1, raw: '1' } ]
  });
  t.isParsed('+"1"', {
    type: 'UnaryExpression', operator: '+',
    arguments: [ { type: 'Literal', value: '1', raw: '"1"' } ]
  });
  t.isParsed('+A1:B2', {
    type: 'UnaryExpression', operator: '+',
    arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2' } ]
  });
  t.isInvalidExpr('++');
  t.isInvalidExpr('+');
  t.end();
});

test('parse unary operator #', t => {
  t.isParsed('D9#', {
    type: 'UnaryExpression', operator: '#',
    arguments: [ { type: 'ReferenceIdentifier', value: 'D9' } ]
  });
  t.isParsed('A1:B2#', { // this parses but is a runtime error in Excel
    type: 'UnaryExpression', operator: '#',
    arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2' } ]
  });
  t.isParsed('(A1):(B2)#', { // this parses but is a runtime error in Excel
    type: 'UnaryExpression', operator: '#',
    arguments: [ {
      type: 'BinaryExpression', operator: ':',
      arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ReferenceIdentifier', value: 'B2' }
      ] } ]
  });
  t.isParsed('(A1,B2)#', {
    type: 'UnaryExpression', operator: '#',
    arguments: [ {
      type: 'BinaryExpression', operator: ',',
      arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ReferenceIdentifier', value: 'B2' }
      ] } ]
  });
  t.isParsed('(A1 B2)#', {
    type: 'UnaryExpression', operator: '#',
    arguments: [ {
      type: 'BinaryExpression', operator: ' ',
      arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ReferenceIdentifier', value: 'B2' }
      ] } ]
  });
  t.isParsed('#REF!#', {
    type: 'UnaryExpression', operator: '#',
    arguments: [ { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' } ]
  });
  t.isParsed('INDIRECT("d9")#', {
    type: 'UnaryExpression', operator: '#',
    arguments: [ {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'INDIRECT' },
      arguments: [ { type: 'Literal', value: 'd9', raw: '"d9"' } ]
    } ]
  });
  t.isInvalidExpr('1#');
  t.isInvalidExpr('"foo"#');
  t.isInvalidExpr('#A1');
  t.isInvalidExpr('##');
  t.isInvalidExpr('#VALUE!#');
  t.isInvalidExpr('#');
  t.isInvalidExpr('#A1');
  t.end();
});

test('parse unary operator @', t => {
  t.isParsed('@1', {
    type: 'UnaryExpression', operator: '@',
    arguments: [ { type: 'Literal', raw: '1', value: 1 } ]
  });
  t.isParsed('@"foo"', {
    type: 'UnaryExpression', operator: '@',
    arguments: [ { type: 'Literal', raw: '"foo"', value: 'foo' } ]
  });
  t.isParsed('@D9', {
    type: 'UnaryExpression', operator: '@',
    arguments: [ { type: 'ReferenceIdentifier', value: 'D9' } ]
  });
  t.isParsed('@A1:B2', {
    type: 'UnaryExpression', operator: '@',
    arguments: [ { type: 'ReferenceIdentifier', value: 'A1:B2' } ]
  });
  t.isParsed('@#REF!', {
    type: 'UnaryExpression', operator: '@',
    arguments: [ { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' } ]
  });
  t.isParsed('@FOO()', {
    type: 'UnaryExpression', operator: '@',
    arguments: [ {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'FOO' },
      arguments: []
    } ]
  });
  t.isInvalidExpr('@');
  t.isInvalidExpr('@@');
  t.end();
});

// parse binary operators
// FIXME: add precedence & associativity tests (2+3*4)
[
  '+', '-', '^', '*', '/', '&',
  '=', '<', '>', '<=', '>=', '<>'
].forEach(op => {
  test('parse binary operator ' + op, t => {
    t.isParsed(`1${op}2`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'Literal', value: 1, raw: '1' },
        { type: 'Literal', value: 2, raw: '2' }
      ]
    });
    t.isParsed(`1${op}2${op}3`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'BinaryExpression', operator: op,
          arguments: [
            { type: 'Literal', value: 1, raw: '1' },
            { type: 'Literal', value: 2, raw: '2' } ] },
        { type: 'Literal', value: 3, raw: '3' } ]
    });
    t.isParsed(`"foo"${op}"bar"`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'Literal', value: 'foo', raw: '"foo"' },
        { type: 'Literal', value: 'bar', raw: '"bar"' }
      ]
    });
    t.isParsed(`"foo"${op}"bar"`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'Literal', value: 'foo', raw: '"foo"' },
        { type: 'Literal', value: 'bar', raw: '"bar"' }
      ]
    });
    t.isParsed(`{1,2}${op}{3,4}`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ArrayExpression', elements: [ [
          { type: 'Literal', value: 1, raw: '1' },
          { type: 'Literal', value: 2, raw: '2' } ] ] },
        { type: 'ArrayExpression', elements: [ [
          { type: 'Literal', value: 3, raw: '3' },
          { type: 'Literal', value: 4, raw: '4' } ] ] }
      ]
    });
    t.isParsed(`FOO()${op}BAR()`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'CallExpression', callee: { type: 'Identifier', name: 'FOO' }, arguments: [] },
        { type: 'CallExpression', callee: { type: 'Identifier', name: 'BAR' }, arguments: [] }
      ]
    });
    t.isInvalidExpr(op);
    t.isInvalidExpr(op + op);
    t.isInvalidExpr('1' + op);
    if (op !== '+' && op !== '-') {
      t.isInvalidExpr('=' + op + '1');
    }
    t.end();
  });
});

// parse range operators
[
  [ ':', 'range-join' ],
  [ ',', 'union' ],
  [ ' ', 'intersection' ]
].forEach(([ op, opName ]) => {
  test(`parse ${opName} operator "${op}"`, t => {
    t.isParsed(`named1${op}named2`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'named1' },
        { type: 'ReferenceIdentifier', value: 'named2' } ] });
    t.isParsed(`A1${op}named2`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ReferenceIdentifier', value: 'named2' } ] });
    t.isParsed(`named1${op}B2`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'named1' },
        { type: 'ReferenceIdentifier', value: 'B2' } ] });
    t.isParsed(`(A1)${op}(B2)`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ReferenceIdentifier', value: 'B2' } ] });
    t.isInvalidExpr(`A1${op}0`);
    t.isInvalidExpr(`0${op}A1`);
    t.isInvalidExpr(`0${op}0`);
    t.isInvalidExpr(`"foo"${op}"bar"`);
    t.isInvalidExpr(`TRUE${op}FALSE`);
    // REF! errors are a valid ref expression component
    t.isParsed(`A1${op}#REF!`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'A1' },
        { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' } ] });
    t.isParsed(`#REF!${op}B2`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ErrorLiteral', value: '#REF!', raw: '#REF!' },
        { type: 'ReferenceIdentifier', value: 'B2' } ] });
    t.isInvalidExpr(`A1${op}#NAME?`);
    t.isInvalidExpr(`A1${op}#VALUE!`);
    t.isInvalidExpr(`#NULL!${op}A1`);

    // union ops
    t.isParsed(`(A1,B2)${op}C3`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'BinaryExpression', operator: ',',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1' },
            { type: 'ReferenceIdentifier', value: 'B2' } ] },
        { type: 'ReferenceIdentifier', value: 'C3' } ] });
    t.isParsed(`C3${op}(A1,B2)`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'C3' },
        { type: 'BinaryExpression', operator: ',',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1' },
            { type: 'ReferenceIdentifier', value: 'B2' } ] }
      ] });
    // intersection ops
    t.isParsed(`(A1 B2)${op}C3`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'BinaryExpression', operator: ' ',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1' },
            { type: 'ReferenceIdentifier', value: 'B2' } ] },
        { type: 'ReferenceIdentifier', value: 'C3' } ] });
    t.isParsed(`C3${op}(A1 B2)`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'C3' },
        { type: 'BinaryExpression', operator: ' ',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1' },
            { type: 'ReferenceIdentifier', value: 'B2' } ] }
      ] });
    // join ops
    t.isParsed(`(A1:(B2))${op}C3`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'BinaryExpression', operator: ':',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1' },
            { type: 'ReferenceIdentifier', value: 'B2' } ] },
        { type: 'ReferenceIdentifier', value: 'C3' } ] });
    t.isParsed(`C3${op}(A1:(B2))`, {
      type: 'BinaryExpression', operator: op,
      arguments: [
        { type: 'ReferenceIdentifier', value: 'C3' },
        { type: 'BinaryExpression', operator: ':',
          arguments: [
            { type: 'ReferenceIdentifier', value: 'A1' },
            { type: 'ReferenceIdentifier', value: 'B2' } ] }
      ] });
    // ref calls
    ([
      [ 'ANCHORARRAY', true ],
      [ 'CHOOSE', true ],
      [ 'DROP', true ],
      [ 'IF', true ],
      [ 'IFS', true ],
      [ 'INDEX', true ],
      [ 'INDIRECT', true ],
      [ 'LAMBDA', true ],
      [ 'LET', true ],
      [ 'OFFSET', true ],
      [ 'REDUCE', true ],
      [ 'SINGLE', true ],
      [ 'SWITCH', true ],
      [ 'TAKE', true ],
      [ 'XLOOKUP', true ],
      // non-ref functions
      [ 'CELL', false ],
      [ 'COUNT', false ],
      [ 'HSTACK', false ],
      [ 'N', false ],
      [ 'SUM', false ]
    ]).forEach(([ funcName, shouldWork ]) => {
      if (shouldWork) {
        t.isParsed(`${funcName}()${op}C3`, {
          type: 'BinaryExpression', operator: op,
          arguments: [
            { type: 'CallExpression', callee: { type: 'Identifier', name: funcName }, arguments: [] },
            { type: 'ReferenceIdentifier', value: 'C3' }
          ] });
        t.isParsed(`C3${op}${funcName}()`, {
          type: 'BinaryExpression', operator: op,
          arguments: [
            { type: 'ReferenceIdentifier', value: 'C3' },
            { type: 'CallExpression', callee: { type: 'Identifier', name: funcName }, arguments: [] }
          ] });
      }
      else {
        t.isInvalidExpr(`${funcName}()${op}C3`);
        t.isInvalidExpr(`C3${op}${funcName}()`);
      }
    });

    t.end();
  });
});

test('union operators are normalized', t => {
  t.isParsed('A1 B2', {
    type: 'BinaryExpression', operator: ' ',
    arguments: [
      { type: 'ReferenceIdentifier', value: 'A1' },
      { type: 'ReferenceIdentifier', value: 'B2' }
    ]
  });
  t.isParsed('A1    B2', {
    type: 'BinaryExpression', operator: ' ',
    arguments: [
      { type: 'ReferenceIdentifier', value: 'A1' },
      { type: 'ReferenceIdentifier', value: 'B2' }
    ]
  });
  t.end();
});

test('does not tolerate unterminated tokens', t => {
  t.isInvalidExpr('="foo');
  t.end();
});

test('position information is correct', t => {
  t.isParsed(
    '=123.45',
    { type: 'Literal', value: 123.45, loc: [ 1, 7 ], raw: '123.45' },
    { withLocation: true }
  );
  t.isParsed(
    '="foo"',
    { type: 'Literal', value: 'foo', loc: [ 1, 6 ], raw: '"foo"' },
    { withLocation: true }
  );
  t.isParsed(
    '=true',
    { type: 'Literal', value: true, loc: [ 1, 5 ], raw: 'true' },
    { withLocation: true }
  );
  t.isParsed(
    '=Sheet1!A1:B2',
    { type: 'ReferenceIdentifier', value: 'Sheet1!A1:B2', loc: [ 1, 13 ] },
    { withLocation: true }
  );
  t.isParsed(
    '=(#VALUE!)',
    { type: 'ErrorLiteral', value: '#VALUE!', loc: [ 2, 9 ], raw: '#VALUE!' },
    { withLocation: true }
  );
  // UnaryExpression
  t.isParsed(
    '=-A1',
    { type: 'UnaryExpression', loc: [ 1, 4 ], operator: '-', arguments: [
      { type: 'ReferenceIdentifier', value: 'A1', loc: [ 2, 4 ] } ] },
    { withLocation: true }
  );
  t.isParsed(
    '=10%',
    { type: 'UnaryExpression', loc: [ 1, 4 ], operator: '%', arguments: [
      { type: 'Literal', value: 10, loc: [ 1, 3 ], raw: '10' } ] },
    { withLocation: true }
  );
  t.isParsed(
    '=-(123)',
    { type: 'UnaryExpression', loc: [ 1, 6 ], operator: '-', arguments: [
      { type: 'Literal', value: 123, loc: [ 3, 6 ], raw: '123' } ] },
    { withLocation: true }
  );
  t.isParsed(
    '(123+(234))',
    { type: 'BinaryExpression', loc: [ 1, 9 ], operator: '+', arguments: [
      { type: 'Literal', value: 123, loc: [ 1, 4 ], raw: '123' },
      { type: 'Literal', value: 234, loc: [ 6, 9 ], raw: '234' } ] },
    { withLocation: true }
  );
  t.isParsed(
    '=(A1 B2)',
    { type: 'BinaryExpression', loc: [ 2, 7 ], operator: ' ', arguments: [
      { type: 'ReferenceIdentifier', value: 'A1', loc: [ 2, 4 ] },
      { type: 'ReferenceIdentifier', value: 'B2', loc: [ 5, 7 ] } ] },
    { withLocation: true }
  );
  t.isParsed(
    '=SUM(4,5)',
    { type: 'CallExpression', loc: [ 1, 9 ],
      callee: { type: 'Identifier', name: 'SUM', loc: [ 1, 4 ] },
      arguments: [
        { type: 'Literal', value: 4, loc: [ 5, 6 ], raw: '4' },
        { type: 'Literal', value: 5, loc: [ 7, 8 ], raw: '5' }
      ] },
    { withLocation: true }
  );
  // ArrayExpression
  t.isParsed(
    '={ 1, 2; 3, 4 }',
    { type: 'ArrayExpression', loc: [ 1, 15 ], elements: [
      [ { type: 'Literal', value: 1, loc: [ 3, 4 ], raw: '1' },
        { type: 'Literal', value: 2, loc: [ 6, 7 ], raw: '2' } ],
      [ { type: 'Literal', value: 3, loc: [ 9, 10 ], raw: '3' },
        { type: 'Literal', value: 4, loc: [ 12, 13 ], raw: '4' } ] ] },
    { withLocation: true }
  );
  t.end();
});

test('does not tolerate unterminated tokens', t => {
  // whitespace in arrays
  t.isParsed('=SORT({ A:A, B:B })',
    { type: 'CallExpression', callee: { type: 'Identifier', name: 'SORT' },
      arguments: [
        { type: 'ArrayExpression', elements: [
          [ { type: 'ReferenceIdentifier', value: 'A:A' },
            { type: 'ReferenceIdentifier', value: 'B:B' } ] ] } ] },
    { permitArrayRanges: true });
  // whitespace in arguments
  t.isParsed('=A2:A5=XLOOKUP(B1,C:C, D:D)',
    { type: 'BinaryExpression', operator: '=', arguments: [
      { type: 'ReferenceIdentifier', value: 'A2:A5' },
      { type: 'CallExpression', callee: { type: 'Identifier', name: 'XLOOKUP' },
        arguments: [
          { type: 'ReferenceIdentifier', value: 'B1' },
          { type: 'ReferenceIdentifier', value: 'C:C' },
          { type: 'ReferenceIdentifier', value: 'D:D' } ] } ] },
    { permitArrayRanges: true });
  // whitespace surrounding comma
  t.isParsed('=SUM(12 , B:B)',
    { type: 'CallExpression', callee: { type: 'Identifier', name: 'SUM' }, arguments: [
      { type: 'Literal', value: 12, raw: '12' },
      { type: 'ReferenceIdentifier', value: 'B:B' } ] },
    { permitArrayCalls: true });
  // whitespace tailing operator
  t.isParsed('=A:A= C1',
    { type: 'BinaryExpression', operator: '=', arguments: [
      { type: 'ReferenceIdentifier', value: 'A:A' },
      { type: 'ReferenceIdentifier', value: 'C1' } ] },
    { permitArrayCalls: true });
  t.end();
});
