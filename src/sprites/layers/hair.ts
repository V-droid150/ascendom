/**
 * Hair layers: seven styles per gender, drawn in swap characters (`r` base,
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

// --- Added later: four bolder styles per gender ---------------------------

/** A tall crest down the middle, the sides buzzed to stubble. */
const MALE_MOHAWK: SpriteLayer = layer({
  0: row([14, 'rL']),
  1: row([14, 'rLrR']),
  2: row([14, 'rLrR']),
  3: row([13, 'rrLrRR']),
  4: row([11, 'R'], [13, 'rrLrRR'], [20, 'R']),
  5: row([10, 'RR'], [14, 'rLrR'], [20, 'RR']),
  6: row([10, 'R'], [14, 'rrRR'], [21, 'R']),
  7: row([10, 'R'], [21, 'R']),
});

/** A big round cloud of curls that frames the whole face. */
const MALE_AFRO: SpriteLayer = layer({
  0: row([12, 'rrLrrrrr']),
  1: row([10, 'rrLLrrrrrrRr']),
  2: row([9, 'rrLLLrrrLrrrRR']),
  3: row([8, 'rrLLrrrrrrrrrrRR']),
  4: row([7, 'rrrrrrLrrrrrrrrRRR']),
  5: row([7, 'rLrrrrrrrrrrrrrRRR']),
  6: row([7, 'rrrrrrrrrrrrrrrrRR']),
  7: row([7, 'rrrrr'], [13, 'r'], [15, 'rr'], [18, 'r'], [20, 'rrRRR']),
  8: row([7, 'rLr'], [22, 'rRR']),
  9: row([7, 'rrr'], [22, 'RrR']),
  10: row([7, 'rRr'], [22, 'RRR']),
  11: row([8, 'RR'], [22, 'RR']),
});

/** A rockabilly quiff swept up and forward over the brow. */
const MALE_POMPADOUR: SpriteLayer = layer({
  0: row([10, 'rrrrr']),
  1: row([9, 'rLLLLrrr']),
  2: row([9, 'rLLrrrrrrrrR']),
  3: row([10, 'rrrrrrrrrrRR']),
  4: row([9, 'rrrrrrrrrrrrR']),
  5: row([10, 'RRrrrrrrrrRR']),
  6: row([10, 'RR'], [20, 'RR']),
  7: row([10, 'R'], [21, 'R']),
});

/** A shaved crown with a tied knot on top and long sideburns. */
const MALE_TOPKNOT: SpriteLayer = layer({
  0: row([14, 'rLrr']),
  1: row([13, 'rLLrrR']),
  2: row([14, '2222']),
  3: row([12, 'rrrLrrrr']),
  4: row([11, 'rrLLrrrrrR']),
  5: row([10, 'rrrrrrrrrrrR']),
  6: row([10, 'rrr'], [19, 'rRR']),
  ...rows(7, 11, row([10, 'r'], [21, 'R'])),
});

/** Two long tails tied high on each side, NES-princess style. */
const FEMALE_TWIN_TAILS: SpriteLayer = layer({
  ...CAP,
  5: row([7, '22'], [10, 'rrrrrrrrrrrR'], [23, '22']),
  6: row([6, 'rrr'], [10, 'rrrrrrrrrrRR'], [23, 'rRR']),
  7: row([6, 'rrR'], [10, 'rrr'], [14, 'r'], [16, 'rr'], [19, 'rRR'], [23, 'rRR']),
  ...rows(8, 9, row([6, 'rrR'], [10, 'r'], [21, 'R'], [23, 'rRR'])),
  10: row([6, 'rrR'], [23, 'rRR']),
  11: row([6, 'rR'], [24, 'RR']),
  12: row([5, 'rrR'], [24, 'rRR']),
  13: row([5, 'rR'], [25, 'RR']),
  14: row([5, 'rR'], [25, 'rR']),
  15: row([6, 'R'], [25, 'R']),
});

/** A chin-length bob with blunt, straight-cut bangs. */
const FEMALE_BOB: SpriteLayer = layer({
  2: row([12, 'rrrrrrrr']),
  3: row([10, 'rrrLLrrrrrrr']),
  4: row([9, 'rrLLrrrrrrrrRR']),
  5: row([9, 'rLrrrrrrrrrrRR']),
  6: row([9, 'rrrrrrrrrrrrRR']),
  7: row([9, 'rrrrrrrrrrrrRR']),
  8: row([9, 'rr'], [21, 'RR']),
  ...rows(9, 12, row([8, 'rrr'], [21, 'RRR'])),
  13: row([8, 'RRRR'], [20, 'RRRR']),
});

/** Two round buns on top, like a pair of ears. */
const FEMALE_SPACE_BUNS: SpriteLayer = layer({
  0: row([9, 'rrr'], [20, 'rrr']),
  1: row([8, 'rLLrr'], [19, 'rrLRR']),
  2: row([8, 'rLrrr'], [12, 'rrrrrrrr'], [19, 'rrrRR']),
  3: row([9, 'rr222'], [14, 'rrrr'], [18, '222RR']),
  4: CAP[4],
  5: CAP[5],
  6: CAP[6],
  7: FRINGE,
  8: row([10, 'r'], [21, 'R']),
  9: row([10, 'r'], [21, 'R']),
});

/** Long waves rippling down past the shoulders. */
const FEMALE_WAVY: SpriteLayer = layer({
  ...CAP,
  7: row([9, 'rrr'], [13, 'r'], [16, 'r'], [19, 'rrrR']),
  8: row([9, 'rr'], [21, 'RR']),
  9: row([8, 'rrr'], [21, 'RRR']),
  10: row([8, 'rL'], [22, 'RR']),
  11: row([9, 'rr'], [21, 'RR']),
  12: row([8, 'rrr'], [21, 'RRR']),
  13: row([8, 'rL'], [22, 'RR']),
  14: row([9, 'rr'], [21, 'RR']),
  15: row([8, 'rrr'], [21, 'RRR']),
  16: row([8, 'rL'], [22, 'RR']),
  17: row([9, 'rr'], [21, 'RR']),
  18: row([8, 'RR'], [22, 'RR']),
});

/** Persisted by index: new styles are only ever appended. */
export const HAIR_STYLES = {
  male: [
    MALE_SHORT,
    MALE_SPIKY,
    MALE_LONG_TIED,
    MALE_MOHAWK,
    MALE_AFRO,
    MALE_POMPADOUR,
    MALE_TOPKNOT,
  ],
  female: [
    FEMALE_LONG,
    FEMALE_BRAID,
    FEMALE_BUN,
    FEMALE_TWIN_TAILS,
    FEMALE_BOB,
    FEMALE_SPACE_BUNS,
    FEMALE_WAVY,
  ],
} as const;

/** Persisted by index, so the ids may change but the order must not. */
export const HAIR_STYLE_IDS = {
  male: ['short', 'spiky', 'long-tied', 'mohawk', 'afro', 'pompadour', 'topknot'],
  female: ['long', 'braid', 'bun', 'twin-tails', 'bob', 'space-buns', 'wavy'],
} as const;

export const HAIR_STYLE_COUNT = 7;

export function hairLayer(gender: Gender, style: number): SpriteLayer {
  const styles = HAIR_STYLES[gender];
  const index = ((style % styles.length) + styles.length) % styles.length;
  return styles[index] ?? (styles[0] as SpriteLayer);
}
