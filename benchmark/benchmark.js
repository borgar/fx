/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import benchmark from 'benchmark';
import { tokenize as tokenizeCurr } from '../lib/lexer.js';
import { parse as parseCurr } from '../lib/parser.js';
import { tokenize as tokenizePrev, parse as parsePrev } from '../dist/fx.js';

const formulas = JSON.parse(readFileSync('benchmark/formulas.json', 'utf8'));

function runSuite (title, current, previous) {
  return new Promise(resolve => {
    console.log('Running benchmark for ' + title);
    // @ts-ignore
    (new benchmark.Benchmark.Suite())
      .add('lib/' + title, () => {
        for (const expr of formulas) {
          try {
            current(expr);
          }
          catch (err) {
            // gulp
          }
        }
      })
      .add('dist/' + title, () => {
        for (const expr of formulas) {
          try {
            previous(expr);
          }
          catch (err) {
            // gulp
          }
        }
      })
      .on('cycle', event => {
        console.log(' ', String(event.target));
      })
      .on('complete', function () {
        // console.log('  🥇', this.filter('fastest').map('name')[0]);
        console.log('');
        resolve(true);
      })
      .run({ async: true });
  });
}

await runSuite('tokenizer', tokenizeCurr, tokenizePrev);
await runSuite('parser', parseCurr, parsePrev);
