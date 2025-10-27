/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import benchmark from 'benchmark';
import { tokenize as tokenizeCurr } from '../lib/lexer.js';
import { parse as parseCurr } from '../lib/parser.js';
import { parseA1Ref as parseA1RefCurr } from '../lib/a1.js';
import {
  tokenize as tokenizePrev,
  parse as parsePrev,
  parseA1Ref as parseA1RefPrev
} from '../dist/fx.js';

const formulas = JSON.parse(readFileSync('benchmark/formulas.json', 'utf8'));
const refs = JSON.parse(readFileSync('benchmark/refs.json', 'utf8'));

const opts = { allowTernary: true };
const filter = (process.argv[2] ?? '').toLowerCase();

function runSuite (title, current, previous, testSet) {
  if (filter && !title.toLowerCase().includes(filter)) {
    return;
  }
  return new Promise(resolve => {
    console.log('Running benchmark for ' + title);
    // @ts-ignore
    (new benchmark.Benchmark.Suite())
      .add('lib/' + title, () => {
        for (const expr of testSet) {
          try {
            current(expr, opts);
          }
          catch (err) {
            // gulp
          }
        }
      })
      .add('dist/' + title, () => {
        for (const expr of testSet) {
          try {
            previous(expr, opts);
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

await runSuite('tokenizer', tokenizeCurr, tokenizePrev, formulas);
await runSuite('parser', parseCurr, parsePrev, formulas);
await runSuite('parseA1Ref', parseA1RefCurr, parseA1RefPrev, refs);
