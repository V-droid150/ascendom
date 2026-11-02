/**
 * Hair layers: three styles per gender, drawn in swap characters (`r` base,
 * `R` shade, `L` light) so every hair colour reuses the same art.
 *
 * Hair is composed above the body but below headgear, so a helm or crown
 * correctly covers the crown of the head while the side locks still show.
 */

import type { Gender } from '@/types';
import type { SpriteLayer } from '../types';
import { layer, row, rows } from './builder';

/** Shared crown of the head, used by every style that isn't spiky. */
const CROWN = {
  4: row([12, 'rrrrrrrr']),
  5: row([11, 'Lrrrrrrrrr']),
  6: row([11, 'Lrrrrrrrrr']),
} as const;

const MALE_SHORT: SpriteLayer = layer({
  ...CROWN,
  7: row([11, 'r'], [20, 'R']),
});

const MALE_MESSY: SpriteLayer = layer({
  3: row([12, 'rr.rr.rr']),
  4: row([11, 'Lrrrrrrrrr']),
  5: row([11, 'Lrrrrrrrrr']),
  6: row([11, 'Lrrrrrrrrr']),
  7: row([11, 'r'], [20, 'R']),
  8: row([11, 'R'], [20, 'R']),
});

const MALE_LONG_TIED: SpriteLayer = layer({
  ...CROWN,
  7: row([11, 'r'], [20, 'R']),
  8: row([11, 'r'], [20, 'R']),
  9: row([11, 'R'], [20, 'R']),
  // Ponytail hanging behind the shoulder.
  ...rows(10, 14, row([21, 'rR'])),
  15: row([21, 'RR']),
});

const FEMALE_LONG: SpriteLayer = layer({
  4: row([12, 'rrrrrrrr']),
  5: row([11, 'Lrrrrrrrrr']),
  6: row([10, 'Lrrrrrrrrrrr']),
  // Side locks frame the face: the eyes at columns 13 and 18 stay clear.
  ...rows(7, 15, row([10, 'rr'], [20, 'RR'])),
  16: row([10, 'RR'], [20, 'RR']),
  17: row([11, 'R'], [20, 'R']),
});

const FEMALE_BRAID: SpriteLayer = layer({
  4: row([12, 'rrrrrrrr']),
  5: row([11, 'Lrrrrrrrrr']),
  6: row([10, 'Lrrrrrrrrrrr']),
  ...rows(7, 9, row([10, 'rr'], [20, 'RR'])),
  // A braid woven down the left side, alternating highlight and shade.
  10: row([9, 'rR'], [20, 'RR']),
  11: row([9, 'Rr'], [20, 'R']),
  12: row([9, 'rR']),
  13: row([9, 'Rr']),
  14: row([9, 'rR']),
  15: row([9, 'Rr']),
  16: row([9, 'rR']),
  17: row([9, 'RR']),
});

const FEMALE_BUN: SpriteLayer = layer({
  2: row([14, 'rrrr']),
  3: row([13, 'LrrrrR']),
  4: row([12, 'rrrrrrrr']),
  5: row([11, 'Lrrrrrrrrr']),
  6: row([10, 'Lrrrrrrrrrrr']),
  7: row([10, 'rr'], [20, 'RR']),
  8: row([11, 'r'], [20, 'R']),
});

export const HAIR_STYLES = {
  male: [MALE_SHORT, MALE_MESSY, MALE_LONG_TIED],
  female: [FEMALE_LONG, FEMALE_BRAID, FEMALE_BUN],
} as const;

export const HAIR_STYLE_IDS = {
  male: ['short', 'messy', 'long-tied'],
  female: ['long', 'braid', 'bun'],
} as const;

export const HAIR_STYLE_COUNT = 3;

export function hairLayer(gender: Gender, style: number): SpriteLayer {
  const styles = HAIR_STYLES[gender];
  const index = ((style % styles.length) + styles.length) % styles.length;
  return styles[index] ?? (styles[0] as SpriteLayer);
}
