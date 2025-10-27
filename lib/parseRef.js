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
import { lexersRefs } from './lexers/sets.js';
import { getTokens } from './lexer.js';

// Liberally split a context string up into parts.
// Permits any combination of braced and unbraced items.
export function splitPrefix (str, stringsOnly = false) {
  let inBrace = false;
  let currStr = '';
  const parts = [];
  const flush = () => {
    if (currStr) {
      parts.push(
        stringsOnly
          ? currStr
          : { value: currStr, braced: inBrace }
      );
    }
    currStr = '';
  };
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '[') {
      flush();
      inBrace = true;
    }
    else if (char === ']') {
      flush();
      inBrace = false;
    }
    else {
      currStr += char;
    }
  }
  flush();
  return parts;
}

function splitContext (contextString, data, xlsx) {
  const ctx = splitPrefix(contextString, !xlsx);
  if (xlsx) {
    if (ctx.length > 1) {
      data.workbookName = ctx[ctx.length - 2].value;
      data.sheetName = ctx[ctx.length - 1].value;
    }
    else if (ctx.length === 1) {
      const item = ctx[0];
      if (item.braced) {
        data.workbookName = item.value;
      }
      else {
        data.sheetName = item.value;
      }
    }
  }
  else {
    data.context = ctx;
  }
}

const unquote = d => d.slice(1, -1).replace(/''/g, "'");

const pRangeOp = (t, data) => {
  const value = t?.value;
  if (value === ':' || value === '.:' || value === ':.' || value === '.:.') {
    data.operator = value;
    return 1;
  }
};
const pRange = (t, data) => {
  if (t?.type === REF_RANGE) {
    data.r0 = t.value;
    return 1;
  }
};
const pPartial = (t, data) => {
  if (t?.type === REF_TERNARY) {
    data.r0 = t.value;
    return 1;
  }
};
const pRange2 = (t, data) => {
  if (t?.type === REF_RANGE) {
    data.r1 = t.value;
    return 1;
  }
};
const pBang = t => {
  if (t?.type === OPERATOR && t.value === '!') {
    return 1;
  }
};
const pBeam = (t, data) => {
  if (t?.type === REF_BEAM) {
    data.r0 = t.value;
    return 1;
  }
};
const pStrucured = (t, data) => {
  if (t.type === REF_STRUCT) {
    data.struct = t.value;
    return 1;
  }
};
const pContext = (t, data, xlsx) => {
  const type = t?.type;
  if (type === CONTEXT) {
    splitContext(t.value, data, xlsx);
    return 1;
  }
  if (type === CONTEXT_QUOTE) {
    splitContext(unquote(t.value), data, xlsx);
    return 1;
  }
};
const pNamed = (t, data) => {
  if (t?.type === REF_NAMED) {
    data.name = t.value;
    return 1;
  }
};

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
    withLocation: opts.withLocation ?? false,
    mergeRefs: opts.mergeRefs ?? false,
    allowTernary: opts.allowTernary ?? false,
    allowNamed: opts.allowNamed ?? true,
    r1c1: opts.r1c1 ?? false,
    xlsx: opts.xlsx ?? false
  };
  const tokens = getTokens(ref, lexersRefs, options);
  const xlsx = options.xlsx;

  // discard the "="-prefix if it is there
  if (tokens.length && tokens[0].type === FX_PREFIX) {
    tokens.shift();
  }
  const runs = options.allowNamed ? validRunsNamed : validRuns;
  for (const run of runs) {
    // const len = run.length;
    if (run.length === tokens.length) {
      const data = xlsx
        ? {
          workbookName: '',
          sheetName: '',
          r0: '',
          r1: '',
          name: '',
          operator: ''
        }
        : {
          context: [],
          r0: '',
          r1: '',
          name: '',
          operator: ''
        };
      const valid = run.every((parse, i) => parse(tokens[i], data, xlsx));
      if (valid) {
        return data;
      }
    }
  }
  return null;
}
