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
import type { Token } from './extraTypes.ts';

// Liberally split a context string up into parts.
// Permits any combination of braced and unbraced items.
export function splitPrefix (str: string, stringsOnly = false) {
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
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
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

type RefParseData = {
  operator: string,
  r0: string,
  r1: string,
  name: string,
  struct: string,
};
type RefParserPart = (t: Token | undefined, data: Partial<RefParseData>, xlsx?: boolean) => 1 | undefined;

const unquote = d => d.slice(1, -1).replace(/''/g, "'");

const pRangeOp: RefParserPart = (t, data) => {
  const value = t?.value;
  if (value === ':' || value === '.:' || value === ':.' || value === '.:.') {
    data.operator = value;
    return 1;
  }
};
const pRange: RefParserPart = (t, data) => {
  if (t?.type === REF_RANGE) {
    data.r0 = t.value;
    return 1;
  }
};
const pPartial: RefParserPart = (t, data) => {
  if (t?.type === REF_TERNARY) {
    data.r0 = t.value;
    return 1;
  }
};
const pRange2: RefParserPart = (t, data) => {
  if (t?.type === REF_RANGE) {
    data.r1 = t.value;
    return 1;
  }
};
const pBang: RefParserPart = t => {
  if (t?.type === OPERATOR && t.value === '!') {
    return 1;
  }
};
const pBeam: RefParserPart = (t, data) => {
  if (t?.type === REF_BEAM) {
    data.r0 = t.value;
    return 1;
  }
};
const pStrucured: RefParserPart = (t, data) => {
  if (t.type === REF_STRUCT) {
    data.struct = t.value;
    return 1;
  }
};
const pContext: RefParserPart = (t, data, xlsx) => {
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
const pNamed: RefParserPart = (t, data) => {
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

type ParseRefOptions = {
  withLocation?: boolean,
  mergeRefs?: boolean,
  allowTernary?: boolean,
  allowNamed?: boolean,
  r1c1?: boolean,
};
export type RefParseDataXls = RefParseData & { workbookName: string, sheetName: string };
export type RefParseDataCtx = RefParseData & { context: string[] };

export function parseRefCtx (ref: string, opts: ParseRefOptions= {}): RefParseDataCtx | null {
  const options = {
    withLocation: opts.withLocation ?? false,
    mergeRefs: opts.mergeRefs ?? false,
    allowTernary: opts.allowTernary ?? false,
    allowNamed: opts.allowNamed ?? true,
    r1c1: opts.r1c1 ?? false
  };
  const tokens = getTokens(ref, lexersRefs, options);

  // discard the "="-prefix if it is there
  if (tokens.length && tokens[0].type === FX_PREFIX) {
    tokens.shift();
  }
  const runs = options.allowNamed ? validRunsNamed : validRuns;
  for (const run of runs) {
    // const len = run.length;
    if (run.length === tokens.length) {
      const data: RefParseDataCtx = {
        context: [],
        r0: '',
        r1: '',
        name: '',
        struct: '',
        operator: ''
      };
      const valid = run.every((parse, i) => parse(tokens[i], data, false));
      if (valid) {
        return data;
      }
    }
  }
  return null;
}

export function parseRefXlsx (ref: string, opts: ParseRefOptions = {}): RefParseDataXls | null {
  const options = {
    withLocation: opts.withLocation ?? false,
    mergeRefs: opts.mergeRefs ?? false,
    allowTernary: opts.allowTernary ?? false,
    allowNamed: opts.allowNamed ?? true,
    r1c1: opts.r1c1 ?? false,
    xlsx: true
  };
  const tokens = getTokens(ref, lexersRefs, options);

  // discard the "="-prefix if it is there
  if (tokens.length && tokens[0].type === FX_PREFIX) {
    tokens.shift();
  }
  const runs = options.allowNamed ? validRunsNamed : validRuns;
  for (const run of runs) {
    if (run.length === tokens.length) {
      const data: RefParseDataXls = {
        workbookName: '',
        sheetName: '',
        r0: '',
        r1: '',
        name: '',
        struct: '',
        operator: ''
      };
      const valid = run.every((parse, i) => parse(tokens[i], data, true));
      if (valid) {
        return data as any;
      }
    }
  }
  return null;
}
