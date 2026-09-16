import { describe, test, expect } from 'vitest';
import { reRefusedAbove00AF } from './quoteRequiringCharacters.ts';

/** The class members as [first, last] code points, in written order. */
function writtenRanges (source: string): [number, number][] {
  const members: [number, number][] = [];
  let rebuilt = '[';
  for (const [ text, start, end ] of source.matchAll(/\\u([0-9a-f]{4})(?:-\\u([0-9a-f]{4}))?/g)) {
    members.push([ parseInt(start, 16), parseInt(end ?? start, 16) ]);
    rebuilt += text;
  }
  expect(rebuilt + ']').toBe(source);
  return members;
}

describe('reRefusedAbove00AF', () => {
  const matchedRuns: [number, number][] = [];
  let matchedCount = 0;
  for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
    if (!reRefusedAbove00AF.test(String.fromCodePoint(codePoint))) {
      continue;
    }
    matchedCount++;
    const lastRun = matchedRuns.at(-1);
    if (lastRun && lastRun[1] === codePoint - 1) {
      lastRun[1] = codePoint;
    }
    else {
      matchedRuns.push([ codePoint, codePoint ]);
    }
  }

  test('matches the 4,295 code points that Excel refuses', () => {
    expect(matchedCount).toBe(4295);
    expect(matchedRuns[0]).toEqual([ 0xbb, 0xbb ]);
    expect(matchedRuns.at(-1)).toEqual([ 0xffef, 0xfff8 ]);
  });

  test('matches no surrogate or noncharacter', () => {
    const refuses = (from: number, to: number) => matchedRuns.some(([ start, end ]) => start <= to && end >= from);
    expect(refuses(0xd800, 0xdfff), 'surrogates').toBe(false);
    expect(refuses(0xfdd0, 0xfdef), 'noncharacters U+FDD0-U+FDEF').toBe(false);
    expect(refuses(0xfffe, 0xffff), 'noncharacters U+FFFE and U+FFFF').toBe(false);
  });

  test('is written as 471 sorted, disjoint, non-adjacent ranges', () => {
    const written = writtenRanges(reRefusedAbove00AF.source);
    expect(written.length).toBe(471);
    expect(written).toEqual(matchedRuns);
  });
});
