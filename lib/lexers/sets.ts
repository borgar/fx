import { lexError } from './lexError.ts';
import { lexRangeTrim } from './lexRangeTrim.ts';
import { lexOperator } from './lexOperator.ts';
import { lexBoolean } from './lexBoolean.ts';
import { lexNewLine } from './lexNewLine.ts';
import { lexWhitespace } from './lexWhitespace.ts';
import { lexString } from './lexString.ts';
import { lexContextQuoted, lexContextUnquoted } from './lexContext.ts';
import { lexRange } from './lexRange.ts';
import { lexStructured } from './lexStructured.ts';
import { lexNumber } from './lexNumber.ts';
import { lexNamed } from './lexNamed.ts';
import { lexRefOp } from './lexRefOp.ts';
import { lexNameFuncCntx } from './lexNameFuncCntx.ts';
import type { Token } from '../types.ts';

export type PartLexer = (
  str: string,
  pos: number,
  options?: Partial<{
    xlsx: boolean,
    allowTerniary: boolean,
    allowTernary: boolean,
    mergeRefs: boolean,
    r1c1: boolean
  }>
) => Token | undefined;

export const lexers: PartLexer[] = [
  lexError,
  lexRangeTrim,
  lexOperator,
  lexNewLine,
  lexWhitespace,
  lexString,
  lexRange,
  lexNumber,
  lexBoolean,
  lexContextQuoted,
  lexNameFuncCntx,
  lexStructured
];

export const lexersRefs = [
  lexRefOp,
  lexContextQuoted,
  lexContextUnquoted,
  lexRange,
  lexStructured,
  lexNamed
];
