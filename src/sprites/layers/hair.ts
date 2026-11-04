/**
 * Hair layers: three styles per gender, drawn in swap characters (`r` base,
 * `R` shade, `L` light) so every hair colour reuses the same art.
 *
 * Chibi hair is big: it sits a row or two above the skull and frames the face
 * down past the ears, which is most of what gives an 8-bit hero a personality.
 * Hair is composed above the body but below headgear, so a helm or crown covers
 * the crown of the head while the side locks still show.
 */

import type { Gender } from '@/types';
import type { SpriteLayer } from '../types';
import { layer, row, rows } from './builder';

/** Shared cap of hair over the skull, rows 2-6. */
const CAP = {
  2: row([12, 'rrrrrrrr']),
  3: row([11, 'rrLLrrrrrr']),
  4: row([10, 'rLLrrrrrrrrR']),
  5: row([10, 'rrrrrrrrrrrR']),
  6: row([10, 'rrrrrrrrrrRR']),
} as const;

/** Jagged fringe on row 7, leaving gaps so the forehead shows through. */
const FRINGE = row([10, 'rrr'], [14, 'r'], [16, 'rr'], [19, 'rRR']);

const MALE_SHORT: SpriteLayer = layer({
  ...CAP,
  7: FRINGE,
  8: row([10, 'r'], [21, 'R']),
});

const MALE_SPIKY: SpriteLayer = layer({
  0: row([12, 'r'], [16, 'r'], [20, 'r']),
  1: row([11, 'rr'], [15, 'rL'], [19, 'rR']),
  2: row([10, 'rrrLrrrrrrrR']),
  3: row([9, 'rrrLLrrrrrrrRR']),
  4: row([9, 'rrLLrrrrrrrrRR']),
  5: row([9, 'rrrrrrrrrrrrRR']),
  6: row([9, 'rrrrrrrrrrrrRR']),
  7: row([9, 'rr'], [12, 'r'], [14, 'rr'], [18, 'r'], [20, 'RRR']),
  8: row([9, 'rr'], [21, 'RR']),
  9: row([9, 'r'], [22, 'R']),
});

const MALE_LONG_TIED: SpriteLayer = layer({
  ...CAP,
  7: row([10, 'rrr'], [14, 'r'], [16, 'rr'], [19, 'rRRR']),
  8: row([10, 'r'], [21, 'RR']),
  9: row([10, 'r'], [22, 'R']),
  // A ponytail swinging out behind the right shoulder.
  ...rows(10, 13, row([22, 'rR'])),
  14: row([22, 'RR']),
  15: row([23, 'R']),
});

const FEMALE_LONG: SpriteLayer = layer({
  ...CAP,
  7: row([9, 'rrr'], [13, 'r'], [16, 'r'], [19, 'rrrR']),
  // Side locks frame the face; the eyes on columns 13 and 18 stay clear.
  ...rows(8, 16, row([9, 'rr'], [21, 'RR'])),
  17: row([9, 'RR'], [21, 'RR']),
});

const FEMALE_BRAID: SpriteLayer = layer({
  ...CAP,
  7: row([9, 'rrr'], [13, 'r'], [16, 'r'], [19, 'rrrR']),
  8: row([9, 'rr'], [21, 'R']),
  9: row([9, 'rr'], [21, 'R']),
  // One braid over the left shoulder, woven by alternating base and shade.
  10: row([8, 'rR']),
  11: row([8, 'Rr']),
  12: row([8, 'rR']),
  13: row([8, 'Rr']),
  14: row([8, 'rR']),
  15: row([8, 'Rr']),
  16: row([8, 'rR']),
  17: row([8, '22']),
  18: row([8, 'rR']),
});

const FEMALE_BUN: SpriteLayer = layer({
  0: row([14, 'rrrr']),
  1: row([13, 'rLLrrR']),
  ...CAP,
  7: FRINGE,
  8: row([10, 'r'], [21, 'R']),
  9: row([10, 'r'], [21, 'R']),
});

export const HAIR_STYLES = {
  male: [MALE_SHORT, MALE_SPIKY, MALE_LONG_TIED],
  female: [FEMALE_LONG, FEMALE_BRAID, FEMALE_BUN],
} as const;

/** Persisted by index, so the ids may change but the order must not. */
export const HAIR_STYLE_IDS = {
  male: ['short', 'spiky', 'long-tied'],
  female: ['long', 'braid', 'bun'],
} as const;

export const HAIR_STYLE_COUNT = 3;

export function hairLayer(gender: Gender, style: number): SpriteLayer {
  const styles = HAIR_STYLES[gender];
  const index = ((style % styles.length) + styles.length) % styles.length;
  return styles[index] ?? (styles[0] as SpriteLayer);
}
