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
} from './constants.ts';
import { lexersRefs } from './lexers/sets.ts';
import { getTokens } from './tokenize.ts';
import type { Token } from './types.ts';

type RefParseData = {
  operator: string,
  r0: string,
  r1: string,
  name: string,
  struct: string,
};
export type RefParseDataXls = RefParseData & { workbookName: string, sheetName: string };
export type RefParseDataCtx = RefParseData & { context: string[] };

type RefParserPart = (
  t: Token | undefined,
  data: Partial<RefParseDataCtx & RefParseDataXls>,
  xlsx: boolean,
  r1c1: boolean,
  tokens: Token[]
) => 1 | undefined;

type ParseRefOptions = {
  withLocation?: boolean,
  mergeRefs?: boolean,
  allowTernary?: boolean,
  allowNamed?: boolean,
  r1c1?: boolean,
};

type SplitItem = {
  value: string,
  braced: boolean,
};
// Liberally split a context string up into parts.
// Permits any combination of braced and unbraced items.
export function splitPrefix (str: string, stringsOnly: true): string[];
export function splitPrefix (str: string, stringsOnly?: false): SplitItem[];
export function splitPrefix (str: string, stringsOnly: boolean = false): string[] | SplitItem[] {
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

export function splitContext (contextString: string, data: Partial<RefParseDataCtx & RefParseDataXls>, xlsx: boolean) {
  if (xlsx) {
    const ctx = splitPrefix(contextString, false);
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
    data.context = splitPrefix(contextString, true);
  }
}

export const unquotePrefix = (d: string) => d.slice(1, -1).replace(/''/g, "'");

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
const pColon: RefParserPart = t => {
  if (t?.type === OPERATOR && t.value === ':') {
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
const pContext: RefParserPart = (t, data, xlsx, r1c1 = false) => {
  const type = t?.type;
  let isCtx = type === CONTEXT;
  let usable = isCtx || type === CONTEXT_QUOTE;
  // r1c1 exception
  if (r1c1 && type === REF_BEAM && !t.value.includes('[')) {
    usable = true;
    isCtx = true;
  }
  if (usable) {
    splitContext(isCtx ? t.value : unquotePrefix(t.value), data, xlsx);
    return 1;
  }
};
const pContextNames: RefParserPart = (t, data, xlsx) => {
  const type = t?.type;
  if (type === CONTEXT) {
    // this won't not have ":" as lexer doesn't allow it
    splitContext(t.value, data, xlsx);
    return 1;
  }
  else if (type === CONTEXT_QUOTE && !xlsx) {
    const ctx = splitPrefix(unquotePrefix(t.value), true);
    if (!(ctx.length > 1 && ctx.at(-1).includes(':'))) {
      data.context = ctx;
      return 1;
    }
  }
  else if (type === CONTEXT_QUOTE) {
    const ctx = splitPrefix(unquotePrefix(t.value), false);
    if (ctx.length === 1) {
      const item = ctx[0];
      if (item.braced) {
        data.workbookName = item.value;
        return 1;
      }
      else if (!item.value.includes(':')) {
        data.sheetName = item.value;
        return 1;
      }
    }
    else if (ctx.length > 1) {
      data.workbookName = ctx[ctx.length - 2].value;
      const sn = ctx[ctx.length - 1].value;
      if (!sn.includes(':')) {
        data.sheetName = sn;
        return 1;
      }
    }
  }
};
const pExtendedContext: RefParserPart = (t, data, xlsx) => {
  // The second name must be unquoted. A quote on it makes the colon a range operator rather than
  // a sheet-range marker, whatever stands to its left:
  //   ✅ a:b   ✅ 'a':b   ⛔️ a:'b'   ⛔️ 'a':'b'
  if (t?.type === CONTEXT) {
    const d: Partial<RefParseDataCtx & RefParseDataXls> = {};
    splitContext(t.value, d, xlsx);
    if (xlsx && d.sheetName && !d.workbookName) {
      data.sheetName += ':' + d.sheetName;
      return 1;
    }
    else if (!xlsx && d.context?.length === 1) {
      const scope = data.context.pop();
      data.context.push(scope + ':' + d.context[0]);
      return 1;
    }
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
  [ pContext, pBang, pBeam ],
  // 3D ranges:
  [ pContext, pColon, pExtendedContext, pBang, pPartial ],
  [ pContext, pColon, pExtendedContext, pBang, pRange, pRangeOp, pRange2 ],
  [ pContext, pColon, pExtendedContext, pBang, pRange ],
  [ pContext, pColon, pExtendedContext, pBang, pBeam ]
];

const validRunsNamed = validRuns.concat([
  [ pNamed ],
  [ pContextNames, pBang, pNamed ],
  [ pStrucured ],
  [ pNamed, pStrucured ],
  [ pContextNames, pBang, pNamed, pStrucured ]
]);

export function parseRefCtx (ref: string, opts: ParseRefOptions = {}): RefParseDataCtx | null {
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
      const valid = run.every((parse, i) => parse(tokens[i], data, false, options.r1c1, tokens));
      if (valid) {
        return data;
      }
    }
  }
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
      const valid = run.every((parse, i) => parse(tokens[i], data, true, options.r1c1, tokens));
      if (valid) {
        return data;
      }
    }
  }
}
