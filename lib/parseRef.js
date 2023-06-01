import {
  FX_PREFIX,
  CONTEXT,
  CONTEXT_QUOTE,
  REF_RANGE,
  REF_TERNARY,
  REF_NAMED,
  REF_BEAM,
  REF_STRUCT,
  OPERATOR
} from './constants.js';
import { lexersRefs } from './lexerParts.js';
import { getTokens } from './lexer.js';

// Liberally split a context string up into parts. Permits any combination of
// braced and unbraced:
//   [foo][bar][baz]
//   foo[bar][baz]
//   [foo]bar[baz]
//   [foo][bar]baz
//   foo[bar]baz
//   [foo]bar[baz]
//   [foo]bar
//   foo[bar]
//   [foo][bar]
//   [foo]
//   foo
function splitContext (contextString) {
  const context = contextString
    .split(/(?:([^[]+)|\[([^[]+)\])/).filter(Boolean);
  return { context };
}

function splitContextXlsx (contextString) {
  const context = {};
  const ctx = splitContext(contextString).context;
  if (ctx.length > 1) {
    context.workbookName = ctx[ctx.length - 2];
    context.sheetName = ctx[ctx.length - 1];
  }
  else if (ctx.length === 1) {
    if (contextString.endsWith(']')) {
      context.workbookName = ctx[0];
    }
    else {
      context.sheetName = ctx[0];
    }
  }
  return context;
}

const unquote = d => d.slice(1, -1).replace(/''/g, "'");

const pRangeOp = t => t && t.value === ':' && {};
const pRange = t => t && t.type === REF_RANGE && { r0: t.value };
const pPartial = t => t && t.type === REF_TERNARY && { r0: t.value };
const pRange2 = t => t && t.type === REF_RANGE && { r1: t.value };
const pBang = t => t && t.type === OPERATOR && t.value === '!' && {};
const pBeam = t => t && t.type === REF_BEAM && { r0: t.value };
const pStrucured = t => t && t.type === REF_STRUCT && { struct: t.value };
const pContext = (t, opts) => {
  const splitter = opts.xlsx ? splitContextXlsx : splitContext;
  if (t && t.type === CONTEXT) {
    return splitter(t.value);
  }
  if (t && t.type === CONTEXT_QUOTE) {
    return splitter(unquote(t.value));
  }
};
const pNamed = t => t && t.type === REF_NAMED && { name: t.value };

const validRuns = [
  [ pPartial ],
  [ pRange, pRangeOp, pRange2 ],
  [ pRange ],
  [ pBeam ],
  [ pContext, pBang, pPartial ],
  [ pContext, pBang, pRange, pRangeOp, pRange2 ],
  [ pContext, pBang, pRange ],
  [ pContext, pBang, pBeam ]
];

const validRunsNamed = validRuns.concat([
  [ pNamed ],
  [ pContext, pBang, pNamed ],
  [ pStrucured ],
  [ pNamed, pStrucured ],
  [ pContext, pBang, pNamed, pStrucured ]
]);

export function parseRef (ref, opts) {
  const options = {
    withLocation: false,
    mergeRefs: false,
    allowTernary: false,
    allowNamed: true,
    r1c1: false,
    xlsx: false,
    ...opts
  };
  const tokens = getTokens(ref, lexersRefs, options);
  const refData = options.xlsx
    ? {
      workbookName: '',
      sheetName: '',
      r0: '',
      r1: '',
      name: ''
    }
    : {
      context: [],
      r0: '',
      r1: '',
      name: ''
    };
  // discard the "="-prefix if it is there
  if (tokens.length && tokens[0].type === FX_PREFIX) {
    tokens.shift();
  }
  const runs = options.allowNamed ? validRunsNamed : validRuns;
  for (let i = 0; i < runs.length; i++) {
    const data = { ...refData };
    if (runs[i].length === tokens.length) {
      const valid = runs[i].every((parse, j) => {
        const d = parse(tokens[j], options);
        Object.assign(data, d);
        return d;
      });
      if (valid) {
        return data;
      }
    }
  }
  return null;
}
