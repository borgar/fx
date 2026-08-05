/**
 * A property-based sweep over sheet ranges (the `Jan:Dec!A1` prefix of a 3-D reference).
 *
 * Curated tests only cover the cases someone thought of. This generates them instead, from a
 * grammar of sheet names, prefix forms and cell parts, and asserts invariants that no single
 * case can establish on its own:
 *
 * - the formula lexers and the reference lexers agree on any input;
 * - parse/stringify reaches a fixpoint and keeps both sheet names, everywhere a reference is
 *   written back out;
 * - a token list rejoins to exactly the string it came from.
 *
 * The generator is seeded, so a run is reproducible from its seed alone, and every failure is
 * shrunk to a minimal input before it is reported.
 *
 * Two qualifications are written into the properties, both for deliberate behaviour rather than a
 * defect the sweep should keep re-reporting: the number and boolean literals of
 * {@link LITERAL_TYPES}, and the round-trip properties applying only to input a writer could have
 * produced, which is what {@link isWholeReference} settles.
 *
 * This module is not part of the package's public surface. It backs `sheetRangeProperties.spec.ts`
 * (a small, fast sweep that runs with the suite) and `scripts/propertySweep.ts` (a large one).
 *
 * @module
 */
import { BOOLEAN, CONTEXT, CONTEXT_QUOTE, NUMBER } from './constants.ts';
import { fixFormulaRanges, fixFormulaRangesXlsx } from './fixRanges.ts';
import { lexers, lexersRefs } from './lexers/sets.ts';
import { parseA1Ref, parseA1RefXlsx } from './parseA1Ref.ts';
import { parseR1C1Ref, parseR1C1RefXlsx } from './parseR1C1Ref.ts';
import { unquoteParts } from './parseRef.ts';
import { stringifyA1Ref, stringifyA1RefXlsx } from './stringifyA1Ref.ts';
import { stringifyR1C1Ref, stringifyR1C1RefXlsx } from './stringifyR1C1Ref.ts';
import { getTokens } from './tokenize.ts';
import { translateFormulaToA1 } from './translateToA1.ts';
import { translateFormulaToR1C1 } from './translateToR1C1.ts';
import type { Token } from './types.ts';

/** A pseudo-random source. Seeded, so that a run is reproducible from its seed. */
export type Prng = () => number;

/** mulberry32: small, fast, and good enough to spread cases over the grammar. */
export function makeRandom (seed: number): Prng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rnd: Prng, list: readonly T[]): T => list[Math.floor(rnd() * list.length)];
const chance = (rnd: Prng, p: number): boolean => rnd() < p;
const quote = (name: string): string => "'" + name.replace(/'/g, "''") + "'";

// Characters a sheet name may contain, drawn wide rather than sampled from ASCII: "." is the one a
// range lexer may also end on, "$" is the one Excel refuses unquoted, "'" is the one that has to
// be doubled, and the last group is above U+00B4, where the context mask changes behaviour.
const NAME_CHARS = (
  'abcABCxyzRCrc' +
  '0123456789' +
  '._ $\'!' +
  '(),=&%+-<>"#@{}~;' +
  '¡¤§¨ª\u00ad¯' +
  '\u00a0\u00a1\u00b3\u00b4\u00b5' + // either side of both boundaries of the context lexer's character table
  'ÆÄðøå中Ω'
).split('');

const CELL_SHAPED = [ 'A1', 'B2', 'Q1', 'AB12', 'XFD1048576', 'a1', 'C3', 'R1' ];
const COLUMN_SHAPED = [ 'A', 'AB', 'C', 'R', 'XFD', 'ZZ', 'S' ];
const RC_SHAPED = [ 'R1C1', 'RC', 'R1C', 'RC1', 'R[1]C[1]', 'R2C3', 'rc' ];
const DIGIT_SHAPED = [ '1', '12', '2024', '1048576' ];
const BOOLEAN_SHAPED = [ 'TRUE', 'FALSE', 'true', 'False' ];
const PLAIN = [ 'Jan', 'Dec', 'Mar', 'Sheet1', 'Sales', 'Rep', 'data' ];
const DOTTED = [ 'a1.b', 'x.y', '1.2', 'A1.', '.b', 'R1C1.z', '.', '..', 'v1.0' ];
// "!" and the operator characters are legal in an Excel sheet name; only ": \\ / ? * [ ]" are not
const NEEDS_QUOTES = [ 'has space', 'my name', ' lead', 'trail ', 'a-b', 'a+b', 'a!b', 'a(b)', 'a,b', 'a=b', 'a#b', 'a"b' ];
const DOLLARED = [ 'My$Name', '$Jan', 'Ja$', '$1' ];
const QUOTEY = [ "it's", "'a", "b'", "''" ];
const HIGH = [ 'Ærið', 'Ärger', 'ø', '¡x', '¯abc', '中文', 'Ωmega' ];

function randomName (rnd: Prng): string {
  const len = 1 + Math.floor(rnd() * (chance(rnd, 0.1) ? 31 : 6));
  let out = '';
  for (let i = 0; i < len; i++) {
    out += pick(rnd, NAME_CHARS);
  }
  return out;
}

/** One sheet name of a sheet range, or a lone one. Every awkward form gets a turn. */
export function genSheetName (rnd: Prng): string {
  const kind = Math.floor(rnd() * 12);
  if (kind === 0) { return pick(rnd, CELL_SHAPED); }
  if (kind === 1) { return pick(rnd, COLUMN_SHAPED); }
  if (kind === 2) { return pick(rnd, RC_SHAPED); }
  if (kind === 3) { return pick(rnd, DIGIT_SHAPED); }
  if (kind === 4) { return pick(rnd, BOOLEAN_SHAPED); }
  if (kind === 5) { return pick(rnd, DOTTED); }
  if (kind === 6) { return pick(rnd, NEEDS_QUOTES); }
  if (kind === 7) { return pick(rnd, DOLLARED); }
  if (kind === 8) { return pick(rnd, QUOTEY); }
  if (kind === 9) { return pick(rnd, HIGH); }
  if (kind === 10) { return randomName(rnd); }
  return pick(rnd, PLAIN);
}

/** The sheet slot of a prefix: one name, a range of two, or something that is neither. */
function genSheetSlot (rnd: Prng): string {
  const first = genSheetName(rnd);
  const second = genSheetName(rnd);
  const kind = Math.floor(rnd() * 14);
  if (kind === 0) { return first; }
  if (kind === 1) { return quote(first); }
  if (kind === 2) { return first + ':' + second; }
  if (kind === 3) { return quote(first + ':' + second); }
  if (kind === 4) { return quote(first) + ':' + quote(second); }
  if (kind === 5) { return first + ':' + quote(second); }
  if (kind === 6) { return quote(first) + ':' + second; }
  if (kind === 7) { return first + ':'; }
  if (kind === 8) { return ':' + second; }
  if (kind === 9) { return first + ':' + second + ':' + genSheetName(rnd); }
  if (kind === 10) { return first + ' : ' + second; }
  if (kind === 11) { return first + ': ' + second; }
  if (kind === 12) { return first + ' :' + second; }
  return first + ':' + second;
}

/** A whole prefix: the sheet slot, optionally qualified by a workbook or a path. */
function genPrefix (rnd: Prng): string {
  const slot = genSheetSlot(rnd);
  const kind = Math.floor(rnd() * 8);
  if (kind === 0 || kind === 1 || kind === 2) { return slot; }
  if (kind === 3) { return '[Book1.xlsx]' + slot; }
  if (kind === 4) { return quote('[Book1.xlsx]' + slot); }
  if (kind === 5) { return '[1]' + slot; }
  if (kind === 6) { return quote('[1]' + slot); }
  return quote('C:\\dir\\[Book1.xlsx]' + slot);
}

const CELLS_A1 = [
  'A1',
  '$A$1',
  'A1:B2',
  '$A1:B$2',
  'A:A',
  '1:1',
  'XFD1048576',
  'B2:A1',
  'A1:A',
  'A1:1',
  'A:A1',
  '1:A1',
  'A1.:B2',
  'A1:.B2',
  'A1.:.B2',
  'C3'
];
const CELLS_R1C1 = [
  'R1C1',
  'RC',
  'R[1]C[1]',
  'R1C1:R2C2',
  'R1',
  'C1',
  'R[-1]C[2]',
  'R1C1:RC',
  'R',
  'C',
  'R[1]',
  'C[-1]',
  'R1C1.:R2C2'
];
const NAMES = [ 'myName', 'total', '_x', 'a.b' ];

/** The part after the "!": a cell, a range, a beam, a ternary range, or a defined name. */
function genCellPart (rnd: Prng, r1c1: boolean): string {
  if (chance(rnd, 0.12)) { return pick(rnd, NAMES); }
  return pick(rnd, r1c1 ? CELLS_R1C1 : CELLS_A1);
}

const WRAPPINGS: readonly ((ref: string) => string)[] = [
  ref => '=' + ref,
  ref => '=SUM(' + ref + ')',
  ref => '=' + ref + '+1',
  ref => '=SUM(' + ref + ',B2)',
  ref => '=LET(r,' + ref + ',r)',
  ref => '=' + ref + ':B2',
  ref => '="x"&' + ref,
  ref => ref
];

/** One generated case. Reproducible from `ref` and `wrapping` alone, which is what shrinking uses. */
export type PropertyCase = {
  /** The bare reference (or other fragment) under test. */
  ref: string,
  /** Index into {@link WRAPPINGS}: how the fragment is embedded in a formula. */
  wrapping: number,
  r1c1: boolean,
  xlsx: boolean,
  mergeRefs: boolean,
  allowTernary: boolean,
  allowNamed: boolean
};

/** The formula a case's fragment is embedded in. */
export function caseText (c: PropertyCase): string {
  return WRAPPINGS[c.wrapping](c.ref);
}

/** A short, re-pasteable rendering of a case, for a failure report. */
export function describeCase (c: PropertyCase): string {
  const opts = [
    c.r1c1 ? 'r1c1' : '',
    c.xlsx ? 'xlsx' : '',
    c.mergeRefs ? 'mergeRefs' : '',
    c.allowTernary ? 'allowTernary' : '',
    c.allowNamed ? 'allowNamed' : ''
  ].filter(Boolean).join(', ');
  return JSON.stringify(caseText(c)) + '  {' + opts + '}';
}

export function generateCase (rnd: Prng): PropertyCase {
  const r1c1 = chance(rnd, 0.4);
  let ref: string;
  if (chance(rnd, 0.08)) {
    // pure fuzz, to catch a lexer that drops or duplicates characters
    ref = randomName(rnd) + pick(rnd, [ '!', ':', '!:', ':!', '', "'" ]) + randomName(rnd);
  }
  else if (chance(rnd, 0.1)) {
    ref = genCellPart(rnd, r1c1);
  }
  else {
    ref = genPrefix(rnd) + '!' + genCellPart(rnd, r1c1);
  }
  return {
    ref,
    wrapping: Math.floor(rnd() * WRAPPINGS.length),
    r1c1,
    xlsx: chance(rnd, 0.35),
    mergeRefs: chance(rnd, 0.5),
    allowTernary: chance(rnd, 0.5),
    allowNamed: chance(rnd, 0.75)
  };
}

// -- the properties ------------------------------------------------------------------------------

const tokenOpts = (c: PropertyCase, mergeRefs = c.mergeRefs) => ({
  withLocation: false,
  mergeRefs,
  allowTernary: c.allowTernary,
  r1c1: c.r1c1,
  xlsx: c.xlsx
});

const joinValues = (tokens: Token[]): string => tokens.map(d => d.value).join('');

function leadPrefix (tokens: Token[]): string | null {
  const t = tokens[0];
  return t && (t.type === CONTEXT || t.type === CONTEXT_QUOTE) ? t.value : null;
}

/**
 * The sheet slot of every prefix in a formula, unquoted. What a round trip has to preserve: a
 * writer whose output the reader takes as a *different* sheet range is the failure being hunted.
 *
 * Only the sheet is compared, not the whole prefix. The workbook and path scopes ahead of it are
 * lossy by design in the xlsx variant, which keeps two scopes where the context variant keeps any
 * number, and dropping a path is not the failure this is looking for.
 */
function sheetSlots (text: string, c: PropertyCase): string[] {
  const tokens = getTokens(text, lexers, tokenOpts(c, false));
  return tokens
    .filter(t => t.type === CONTEXT || t.type === CONTEXT_QUOTE)
    .map(t => unquoteParts(t.value))
    .map(v => v.slice(v.lastIndexOf(']') + 1));
}

/**
 * Does the case's fragment read as one whole reference on both paths? The preservation properties
 * below only apply to one that does: a fragment the parsers reject has no reference to preserve,
 * and putting a malformed one through a writer says nothing about the writer. The second half is
 * {@link LITERAL_TYPES} — where the formula path never saw a prefix to begin with, it cannot be
 * blamed for not keeping one.
 */
function isWholeReference (c: PropertyCase): boolean {
  const opts = { allowNamed: c.allowNamed, allowTernary: c.allowTernary };
  const parse = c.r1c1
    ? (c.xlsx ? parseR1C1RefXlsx : parseR1C1Ref)
    : (c.xlsx ? parseA1RefXlsx : parseA1Ref);
  const ref = parse(c.ref, opts) as AnyRef | undefined;
  if (!ref) {
    return false;
  }
  // A sheet name containing "!" has no unquoted spelling, every writer quoting it instead, so a
  // prefix showing one bare is text a round trip was never going to preserve.
  const slot = ref.sheetName ?? (ref.context ?? []).slice(-1)[0];
  if (slot?.includes('!')) {
    return false;
  }
  return !LITERAL_TYPES.has(getTokens(c.ref, lexers, tokenOpts(c, false))[0]?.type);
}

const ANCHORS = [ 'A1', 'D10', 'B2', 'XFD1048576' ];

/**
 * A check against one case. It returns nothing when the case satisfies the property, or a message
 * describing the failure it found.
 */
export type Property = {
  name: string,
  check: (c: PropertyCase) => string | undefined
};

/**
 * The two token types that can claim the start of a sheet name on the formula path and have no
 * counterpart on the reference path: `12!A1` is a number on one and a prefix on the other, and
 * `TRUE!A1` a boolean on one and a prefix on the other. That mismatch predates sheet ranges and
 * applies to a lone sheet name as much as to one of a pair, so it is a gap between the two lexer
 * sets rather than a disagreement about what a sheet range is. Excel quotes both spellings, so
 * neither occurs in a file Excel wrote.
 */
const LITERAL_TYPES = new Set([ BOOLEAN, NUMBER ]);

export const properties: readonly Property[] = [
  {
    // "Is this a sheet range?" is answered in two places with opposite lexer precedence: lexRange
    // runs ahead of the context lexers on the formula path, and lexContextUnquoted ahead of
    // lexRange on the reference path. Any input the two read differently is a bug in one of them.
    name: 'the formula lexers and the reference lexers agree on the prefix',
    check: c => {
      const fromFormula = getTokens(c.ref, lexers, tokenOpts(c, false));
      const fromRefs = getTokens(c.ref, lexersRefs, tokenOpts(c, false));
      if (LITERAL_TYPES.has(fromFormula[0]?.type)) {
        return;
      }
      const a = leadPrefix(fromFormula);
      const b = leadPrefix(fromRefs);
      if (a !== b) {
        return 'formula path reads ' + JSON.stringify(a) + ', reference path reads ' + JSON.stringify(b);
      }
    }
  },
  {
    name: 'parseA1Ref/stringifyA1Ref round-trips to a fixpoint',
    check: c => roundTrip(c, parseA1Ref, stringifyA1Ref, false)
  },
  {
    name: 'parseA1RefXlsx/stringifyA1RefXlsx round-trips to a fixpoint',
    check: c => roundTrip(c, parseA1RefXlsx, stringifyA1RefXlsx, false)
  },
  {
    name: 'parseR1C1Ref/stringifyR1C1Ref round-trips to a fixpoint',
    check: c => roundTrip(c, parseR1C1Ref, stringifyR1C1Ref, true)
  },
  {
    name: 'parseR1C1RefXlsx/stringifyR1C1RefXlsx round-trips to a fixpoint',
    check: c => roundTrip(c, parseR1C1RefXlsx, stringifyR1C1RefXlsx, true)
  },
  {
    name: 'fixFormulaRanges is idempotent and keeps both sheet names',
    check: c => {
      if (c.r1c1 || !isWholeReference(c)) {
        return; // fixRanges has no R1C1 counterpart
      }
      const fix = c.xlsx ? fixFormulaRangesXlsx : fixFormulaRanges;
      const opts = { allowTernary: c.allowTernary, mergeRefs: c.mergeRefs, r1c1: false };
      const text = caseText(c);
      let once: string;
      let twice: string;
      try {
        once = fix(text, opts);
        twice = fix(once, opts);
      }
      catch (err) {
        return 'threw: ' + (err as Error).message;
      }
      if (once !== twice) {
        return 'not a fixpoint: ' + JSON.stringify(text) + ' -> ' + JSON.stringify(once) +
          ' -> ' + JSON.stringify(twice);
      }
      const before = sheetSlots(text, c);
      const after = sheetSlots(once, c);
      if (before.join('\u0000') !== after.join('\u0000')) {
        return 'sheet names changed: ' + JSON.stringify(before) + ' -> ' + JSON.stringify(after) +
          ' (' + JSON.stringify(text) + ' -> ' + JSON.stringify(once) + ')';
      }
    }
  },
  {
    name: 'a translation to R1C1 and back keeps both sheet names',
    check: c => {
      if (c.r1c1 || !isWholeReference(c)) {
        return;
      }
      const text = caseText(c);
      for (const anchor of ANCHORS) {
        let toRC: string;
        let back: string;
        try {
          toRC = translateFormulaToR1C1(text, anchor, { allowTernary: c.allowTernary });
          back = translateFormulaToA1(toRC, anchor, { allowTernary: c.allowTernary, mergeRefs: c.mergeRefs });
        }
        catch (err) {
          return 'threw at anchor ' + anchor + ': ' + (err as Error).message;
        }
        const before = sheetSlots(text, c);
        const after = sheetSlots(back, c);
        if (before.join('\u0000') !== after.join('\u0000')) {
          return 'sheet names changed at anchor ' + anchor + ': ' + JSON.stringify(before) +
            ' -> ' + JSON.stringify(after) + ' (' + JSON.stringify(text) + ' -> ' +
            JSON.stringify(toRC) + ' -> ' + JSON.stringify(back) + ')';
        }
      }
    }
  },
  {
    name: 'the tokens of an input rejoin to exactly that input',
    check: c => {
      const text = caseText(c);
      const fromFormula = joinValues(getTokens(text, lexers, tokenOpts(c)));
      if (fromFormula !== text) {
        return 'formula lexers rejoin to ' + JSON.stringify(fromFormula);
      }
      const fromRefs = joinValues(getTokens(c.ref, lexersRefs, tokenOpts(c)));
      if (fromRefs !== c.ref) {
        return 'reference lexers rejoin to ' + JSON.stringify(fromRefs);
      }
    }
  }
];

type AnyRef = { context?: string[], sheetName?: string, workbookName?: string };
type RefOptions = { allowNamed: boolean, allowTernary: boolean };

/**
 * parse -> stringify -> parse has to reach a fixpoint with the same reference it started from. A
 * reference that survives the first parse but not the second, or that comes back naming other
 * sheets, means the writer emitted text the reader takes as something else.
 *
 * The reference type is the parser's own, so each pairing of a parser with its serializer is
 * checked as the pair it is.
 */
function roundTrip<Ref> (
  c: PropertyCase,
  parse: (ref: string, options: RefOptions) => Ref | undefined,
  stringify: (ref: Ref) => string,
  r1c1: boolean
): string | undefined {
  if (c.r1c1 !== r1c1) {
    return;
  }
  const opts = { allowNamed: c.allowNamed, allowTernary: c.allowTernary };
  const first = parse(c.ref, opts);
  if (!first) {
    return;
  }
  const written = stringify(first);
  const second = parse(written, opts);
  if (!second) {
    return JSON.stringify(c.ref) + ' wrote ' + JSON.stringify(written) + ', which no longer parses';
  }
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    return JSON.stringify(c.ref) + ' wrote ' + JSON.stringify(written) + ', which reads back as a ' +
      'different reference: ' + JSON.stringify(first) + ' vs ' + JSON.stringify(second);
  }
  const again = stringify(second);
  if (again !== written) {
    return JSON.stringify(c.ref) + ' is not a fixpoint: ' + JSON.stringify(written) + ' -> ' + JSON.stringify(again);
  }
}

// -- running and shrinking -----------------------------------------------------------------------

export type Failure = {
  property: string,
  case: PropertyCase,
  message: string
};

/** The candidate simplifications of a string, cheapest and most aggressive first. */
function* simplifications (str: string): Generator<string> {
  if (str.length > 2) {
    yield str.slice(0, Math.floor(str.length / 2));
    yield str.slice(Math.floor(str.length / 2));
  }
  for (let i = 0; i < str.length; i++) {
    yield str.slice(0, i) + str.slice(i + 1);
  }
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== 'a' && /[^:!'[\]$.]/.test(str[i])) {
      yield str.slice(0, i) + 'a' + str.slice(i + 1);
    }
  }
}

/**
 * Reduce a failing case to a minimal one that still fails. The predicate is passed in rather than
 * taken from the property so that a differential run can shrink against "fails here but not on the
 * base branch" instead.
 */
export function shrink (
  name: string,
  check: (c: PropertyCase) => string | undefined,
  failing: PropertyCase
): Failure {
  let best = failing;
  let message = check(best);
  let progress = true;
  while (progress) {
    progress = false;
    if (best.wrapping !== 0) {
      const candidate = { ...best, wrapping: 0 };
      const found = check(candidate);
      if (found) {
        best = candidate;
        message = found;
        progress = true;
      }
    }
    for (const ref of simplifications(best.ref)) {
      const candidate = { ...best, ref };
      const found = check(candidate);
      if (found) {
        best = candidate;
        message = found;
        progress = true;
        break;
      }
    }
  }
  return { property: name, case: best, message };
}

export type SweepOptions = {
  /** How many cases to generate. */
  count: number,
  /** The seed the run starts from. */
  seed?: number,
  /** Stop after this many distinct failures. */
  maxFailures?: number,
  /** Which properties to check. All of them by default. */
  only?: readonly Property[]
};

/**
 * Generate `count` cases and check every property against each. Returns one shrunk failure per
 * distinct (property, minimal case) pair.
 */
export function sweep (options: SweepOptions): Failure[] {
  const { count, seed = 1, maxFailures = 20, only = properties } = options;
  const rnd = makeRandom(seed);
  const failures: Failure[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const c = generateCase(rnd);
    for (const property of only) {
      let found: string | undefined;
      try {
        found = property.check(c);
      }
      catch (err) {
        found = 'threw: ' + (err as Error).stack;
      }
      if (!found) {
        continue;
      }
      const shrunk = shrink(property.name, property.check, c);
      const key = shrunk.property + '\u0000' + describeCase(shrunk.case);
      if (!seen.has(key)) {
        seen.add(key);
        failures.push(shrunk);
      }
    }
    if (failures.length >= maxFailures) {
      break;
    }
  }
  return failures;
}
