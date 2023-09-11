#! /usr/bin/env node
/* eslint-disable no-console */

import { parse } from '../lib/parser.js';

const optionNames = {
  allowNamed: 'allowNamed',
  allowTernary: 'allowTernary',
  negativeNumbers: 'negativeNumbers',
  permitArrayRanges: 'permitArrayRanges',
  permitArrayCalls: 'permitArrayCalls',
  r1c1: 'r1c1',
  withLocation: 'withLocation',
  xlsx: 'xlsx'
};

let inputFormula = '';

// TODO: add option for json output
// TODO: add better usage/help

const options = {};

process.argv.forEach(d => {
  if (/(\/node|parse(\.mjs)?)$/.test(d)) {
    return;
  }
  const opt = /^--([a-z]+)(?:=(true|false))?/i.exec(d);
  if (opt) {
    const optName = optionNames[opt[1].toLowerCase()];
    if (!optName) {
      console.log('Unknown option ' + optName);
      process.exit(1);
    }
    let optValue = true;
    if (opt[2] && !/^(false|true)$/i.test(opt[2])) {
      console.log('Illegal value provided for ' + optName);
      process.exit(1);
    }
    else if (opt[2]) {
      optValue = opt[2].toLowerCase() === 'true';
    }
    options[optName] = optValue;
  }
  else {
    if (inputFormula) {
      console.log('Incorrect parameters, usage: parse "SUM(1,2)"');
      process.exit(1);
    }
    inputFormula = d;
  }
});

const tokens = parse(inputFormula, options);

console.log(JSON.stringify(tokens, null, 2));
