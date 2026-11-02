/**
 * The pixel icon set for quests.
 *
 * 12x12 glyphs rather than emoji: emoji render differently on every platform
 * and would be the only non-pixel element in the UI. Each icon is a flat shape
 * with one shade, which is all that reads at this size.
 */

import { PALETTE } from '@/theme/colors';
import { wideRow } from './layers/builder';

const N = 12;

export type QuestIconId =
  | 'water'
  | 'exercise'
  | 'book'
  | 'sleep'
  | 'walk'
  | 'journal'
  | 'meditate'
  | 'food'
  | 'coin'
  | 'music'
  | 'code'
  | 'broom';

/** Icon art. `a` is the main shape, `b` its shade, `c` an accent. */
const ICONS: Record<QuestIconId, readonly string[]> = {
  water: [
    wideRow(N, [5, 'a']),
    wideRow(N, [5, 'aa']),
    wideRow(N, [4, 'aaaa']),
    wideRow(N, [4, 'aaaa']),
    wideRow(N, [3, 'aaaaaa']),
    wideRow(N, [3, 'aaaaaa']),
    wideRow(N, [3, 'abaaab']),
    wideRow(N, [3, 'abbbbb']),
    wideRow(N, [4, 'bbbb']),
    wideRow(N, [5, 'bb']),
    wideRow(N),
    wideRow(N),
  ],
  exercise: [
    wideRow(N),
    wideRow(N),
    wideRow(N, [1, 'aa'], [9, 'aa']),
    wideRow(N, [0, 'aaaa'], [8, 'aaaa']),
    wideRow(N, [0, 'aaaa'], [8, 'aaaa']),
    wideRow(N, [0, 'abbbaaaabbba']),
    wideRow(N, [0, 'abbbaaaabbba']),
    wideRow(N, [0, 'aaaa'], [8, 'aaaa']),
    wideRow(N, [0, 'aaaa'], [8, 'aaaa']),
    wideRow(N, [1, 'bb'], [9, 'bb']),
    wideRow(N),
    wideRow(N),
  ],
  book: [
    wideRow(N),
    wideRow(N, [1, 'aaaa'], [7, 'aaaa']),
    wideRow(N, [1, 'acca'], [7, 'acca']),
    wideRow(N, [1, 'acca'], [7, 'acca']),
    wideRow(N, [1, 'acca'], [7, 'acca']),
    wideRow(N, [1, 'acca'], [7, 'acca']),
    wideRow(N, [1, 'acca'], [7, 'acca']),
    wideRow(N, [1, 'aaaabbaaaa']),
    wideRow(N, [1, 'bbbbbbbbbb']),
    wideRow(N),
    wideRow(N),
    wideRow(N),
  ],
  sleep: [
    wideRow(N, [6, 'aaaa']),
    wideRow(N, [8, 'aa']),
    wideRow(N, [7, 'aa']),
    wideRow(N, [6, 'aaaa']),
    wideRow(N),
    wideRow(N, [2, 'aaa']),
    wideRow(N, [4, 'aa']),
    wideRow(N, [2, 'aaa']),
    wideRow(N),
    wideRow(N, [0, 'bbbbbbbbbbbb']),
    wideRow(N),
    wideRow(N),
  ],
  walk: [
    wideRow(N, [5, 'aa']),
    wideRow(N, [5, 'aa']),
    wideRow(N),
    wideRow(N, [4, 'aaaa']),
    wideRow(N, [3, 'aaaaaa']),
    wideRow(N, [4, 'aaaa']),
    wideRow(N, [4, 'aa'], [7, 'a']),
    wideRow(N, [3, 'aa'], [7, 'aa']),
    wideRow(N, [3, 'a'], [8, 'aa']),
    wideRow(N, [2, 'bb'], [8, 'bb']),
    wideRow(N),
    wideRow(N),
  ],
  journal: [
    wideRow(N),
    wideRow(N, [2, 'aaaaaaa']),
    wideRow(N, [2, 'acccccb']),
    wideRow(N, [2, 'acccccb'], [9, 'c']),
    wideRow(N, [2, 'acccccb'], [8, 'cc']),
    wideRow(N, [2, 'acccccb'], [7, 'cc']),
    wideRow(N, [2, 'acccccb'], [6, 'cc']),
    wideRow(N, [2, 'acccccb']),
    wideRow(N, [2, 'abbbbbb']),
    wideRow(N),
    wideRow(N),
    wideRow(N),
  ],
  meditate: [
    wideRow(N),
    wideRow(N, [5, 'aa']),
    wideRow(N, [4, 'aaaa']),
    wideRow(N, [5, 'aa']),
    wideRow(N),
    wideRow(N, [3, 'aaaaaa']),
    wideRow(N, [2, 'aaaaaaaa']),
    wideRow(N, [1, 'aabbbbaa']),
    wideRow(N, [1, 'bb'], [9, 'bb']),
    wideRow(N, [2, 'bbbbbbbb']),
    wideRow(N),
    wideRow(N),
  ],
  food: [
    wideRow(N),
    wideRow(N, [3, 'aaaaaa']),
    wideRow(N, [2, 'aaaaaaaa']),
    wideRow(N, [2, 'acccccca']),
    wideRow(N, [2, 'acccccca']),
    wideRow(N, [2, 'abbbbbba']),
    wideRow(N, [3, 'bbbbbb']),
    wideRow(N, [5, 'bb']),
    wideRow(N, [3, 'bbbbbb']),
    wideRow(N),
    wideRow(N),
    wideRow(N),
  ],
  coin: [
    wideRow(N),
    wideRow(N, [4, 'aaaa']),
    wideRow(N, [3, 'aaaaaa']),
    wideRow(N, [2, 'aaccccaa']),
    wideRow(N, [2, 'accaacca']),
    wideRow(N, [2, 'accaacca']),
    wideRow(N, [2, 'aaccccaa']),
    wideRow(N, [3, 'bbbbbb']),
    wideRow(N, [4, 'bbbb']),
    wideRow(N),
    wideRow(N),
    wideRow(N),
  ],
  music: [
    wideRow(N),
    wideRow(N, [6, 'aaaa']),
    wideRow(N, [6, 'a'], [9, 'a']),
    wideRow(N, [6, 'a'], [9, 'a']),
    wideRow(N, [6, 'a'], [9, 'a']),
    wideRow(N, [6, 'a'], [9, 'a']),
    wideRow(N, [3, 'aaaa'], [8, 'aa']),
    wideRow(N, [2, 'bbbbbb'], [8, 'bb']),
    wideRow(N, [2, 'bbbb']),
    wideRow(N),
    wideRow(N),
    wideRow(N),
  ],
  code: [
    wideRow(N),
    wideRow(N),
    wideRow(N, [3, 'a'], [8, 'a']),
    wideRow(N, [2, 'a'], [7, 'a']),
    wideRow(N, [1, 'a'], [6, 'a'], [9, 'c']),
    wideRow(N, [0, 'a'], [5, 'a'], [9, 'c']),
    wideRow(N, [1, 'a'], [6, 'a'], [9, 'c']),
    wideRow(N, [2, 'a'], [7, 'a']),
    wideRow(N, [3, 'b'], [8, 'b']),
    wideRow(N),
    wideRow(N),
    wideRow(N),
  ],
  broom: [
    wideRow(N),
    wideRow(N, [8, 'aa']),
    wideRow(N, [7, 'aa']),
    wideRow(N, [6, 'aa']),
    wideRow(N, [5, 'aa']),
    wideRow(N, [4, 'cc']),
    wideRow(N, [3, 'cccc']),
    wideRow(N, [2, 'cccccc']),
    wideRow(N, [1, 'bbbbbbbb']),
    wideRow(N, [1, 'b.b.b.bb']),
    wideRow(N),
    wideRow(N),
  ],
};

/** Per-icon palette, so each glyph gets a colour that suits its subject. */
const ICON_COLORS: Record<QuestIconId, Readonly<Record<string, string>>> = {
  water: { a: PALETTE[10], b: PALETTE[9], c: PALETTE[11] },
  exercise: { a: PALETTE[13], b: PALETTE[14], c: PALETTE[12] },
  book: { a: PALETTE[2], b: PALETTE[1], c: PALETTE[12] },
  sleep: { a: PALETTE[11], b: PALETTE[8], c: PALETTE[12] },
  walk: { a: PALETTE[5], b: PALETTE[6], c: PALETTE[12] },
  journal: { a: PALETTE[4], b: PALETTE[3], c: PALETTE[12] },
  meditate: { a: PALETTE[1], b: PALETTE[8], c: PALETTE[11] },
  food: { a: PALETTE[3], b: PALETTE[2], c: PALETTE[4] },
  coin: { a: PALETTE[4], b: PALETTE[3], c: PALETTE[12] },
  music: { a: PALETTE[11], b: PALETTE[7], c: PALETTE[12] },
  code: { a: PALETTE[5], b: PALETTE[6], c: PALETTE[4] },
  broom: { a: PALETTE[14], b: PALETTE[3], c: PALETTE[4] },
};

export const QUEST_ICON_IDS = Object.keys(ICONS) as QuestIconId[];

export const DEFAULT_QUEST_ICON: QuestIconId = 'water';

function isQuestIcon(id: string): id is QuestIconId {
  return id in ICONS;
}

/** Falls back to the default rather than rendering nothing for an unknown id. */
export function questIcon(id: string): {
  art: readonly string[];
  colors: Readonly<Record<string, string>>;
} {
  const key = isQuestIcon(id) ? id : DEFAULT_QUEST_ICON;
  return { art: ICONS[key], colors: ICON_COLORS[key] };
}

export const ICON_SIZE = N;
