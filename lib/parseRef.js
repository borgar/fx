import { FX_PREFIX, PATH_BRACE, PATH_PREFIX, PATH_QUOTE, RANGE, RANGE_NAMED, RANGE_BEAM } from './constants.js';
import { getTokens } from './lexer.js';

const unquote = d => d.slice(1, -1).replace(/''/g, "'");

const pRangeOp = t => t && t.value === ':' && {};
const pRange = t => t && t.type === RANGE && { r0: t.value };
const pRange2 = t => t && t.type === RANGE && { r1: t.value };
const pBang = t => t && t.value === '!' && {};
const pBeam = t => t && t.type === RANGE_BEAM && { r0: t.value };
const pSheet = t => t && t.type === PATH_PREFIX && /^[^:\\/?*[\]]{0,31}$/.test(t.value) && { sheetName: t.value };
const pFile = t => t && t.type === PATH_BRACE && { workbookName: t.value.slice(1, -1) };
const pFile2 = t => t && t.type === PATH_PREFIX && { workbookName: t.value };
const pNamed = t => t && t.type === RANGE_NAMED && { name: t.value };

const pQuoted = t => {
  if (t && t.type === PATH_QUOTE) {
    const m = /(?:\[(.+?)\])?([^[\]]+?)$/.exec(unquote(t.value));
    if (m) {
      const [ , file, sheet ] = m;
      if (!sheet || /^[^:\\/?*[\]]{0,31}$/.test(sheet)) {
        return {
          workbookName: file || '',
          sheetName: sheet || ''
        };
      }
    }
  }
};
const pQuoted2 = t => t && t.type === PATH_QUOTE && { workbookName: unquote(t.value) };

const validRuns = [
  [ pRange ],
  [ pRange, pRangeOp, pRange2 ],
  [ pBeam ],
  [ pQuoted, pBang, pRange ],
  [ pQuoted, pBang, pRange, pRangeOp, pRange2 ],
  [ pQuoted, pBang, pBeam ],
  [ pSheet, pBang, pRange ],
  [ pSheet, pBang, pRange, pRangeOp, pRange2 ],
  [ pSheet, pBang, pBeam ],
  [ pFile, pSheet, pBang, pRange ],
  [ pFile, pSheet, pBang, pRange, pRangeOp, pRange2 ],
  [ pFile, pSheet, pBang, pBeam ]
];

const validRunsNamed = validRuns.concat([
  [ pNamed ],
  [ pFile2, pBang, pNamed ],
  [ pQuoted2, pBang, pNamed ]
]);

export function parseRef (ref, allow_named = true, tokenHandlers = []) {
  const tokens = getTokens(ref, tokenHandlers, false, false);
  const refData = {
    sheetName: '',
    workbookName: '',
    r0: '',
    r1: '',
    name: ''
  };
  // discard the "="-prefix if it is there
  if (tokens.length && tokens[0].type === FX_PREFIX) {
    tokens.shift();
  }
  const runs = allow_named ? validRunsNamed : validRuns;
  for (let i = 0; i < runs.length; i++) {
    const data = { ...refData };
    if (runs[i].length === tokens.length) {
      const valid = runs[i].every((parse, j) => {
        const d = parse(tokens[j]);
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
