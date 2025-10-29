import type { RangeA1 } from './types.ts';

export function toRelative (range: RangeA1): RangeA1 {
  return Object.assign({}, range, { $left: false, $right: false, $top: false, $bottom: false });
}

export function toAbsolute (range: RangeA1): RangeA1 {
  return Object.assign({}, range, { $left: true, $right: true, $top: true, $bottom: true });
}

export function toRow (top: number): string {
  return String(top + 1);
}

export function rangeOperator (trim: 'head' | 'tail' | 'both' | null | undefined): string {
  if (trim === 'both') {
    return '.:.';
  }
  else if (trim === 'head') {
    return '.:';
  }
  else if (trim === 'tail') {
    return ':.';
  }
  return ':';
}
