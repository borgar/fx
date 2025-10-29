import { lexError } from './lexError.js';
import { lexRangeTrim } from './lexRangeTrim.js';
import { lexOperator } from './lexOperator.js';
import { lexFunction } from './lexFunction.js';
import { lexBoolean } from './lexBoolean.js';
import { lexNewLine } from './lexNewLine.js';
import { lexWhitespace } from './lexWhitespace.js';
import { lexString } from './lexString.js';
import { lexContext } from './lexContext.js';
import { lexRange } from './lexRange.js';
import { lexStructured } from './lexStructured.js';
import { lexNumber } from './lexNumber.js';
import { lexNamed } from './lexNamed.js';
import { lexRefOp } from './lexRefOp.js';
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
  lexFunction,
  lexBoolean,
  lexNewLine,
  lexWhitespace,
  lexString,
  lexContext,
  lexRange,
  lexStructured,
  lexNumber,
  lexNamed
];

export const lexersRefs = [
  lexRefOp,
  lexContext,
  lexRange,
  lexStructured,
  lexNamed
];
