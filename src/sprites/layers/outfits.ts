/**
 * Rank outfits — the visible reward for climbing, and the visible cost of
 * falling. Six per gender, drawn with Sweetie 16 hex digits so they read as
 * fabric and metal rather than tinted skin.
 *
 * The colour story is a deliberate progression: drab slate rags, then warm
 * leather, then dull iron, then bright steel with gold, then noble purple,
 * then royal blue and gold. Each step should be recognisable at a glance in a
 * 32px sprite, which is why the hue changes rather than just the detail.
 *
 * Male outfits use trousers, female outfits use a skirt over leggings, so the
 * two silhouettes stay distinguishable at this size.
 */

import type { Gender } from '@/types';
import type { SpriteLayer } from '../types';
import { layer, row, rows } from './builder';

const MALE_BOOTS = {
  28: row([11, 'FFFF'], [17, 'FFFF']),
  29: row([11, 'FFFF'], [17, 'FFFF']),
} as const;

const FEMALE_BOOTS = MALE_BOOTS;

// --- Rank 1: Peasant — patched slate tunic, bare feet -------------------

const PEASANT_MALE: SpriteLayer = layer({
  14: row([11, 'EEEEEEEEEE']),
  15: row([11, 'EEEEEEEEEE']),
  16: row([11, 'EEEFEEEEEE']),
  17: row([11, 'EEEFEEEEEE']),
  18: row([11, 'EEEEEEEFEE']),
  19: row([11, 'EEEEEEEFEE']),
  20: row([11, 'EEEEEEEEEE']),
  21: row([11, 'FFFFFFFFFF']),
  22: row([12, 'EEE'], [17, 'EEE']),
  23: row([12, 'EEE'], [17, 'EEE']),
  24: row([12, 'FFF'], [17, 'FFF']),
});

const PEASANT_FEMALE: SpriteLayer = layer({
  14: row([12, 'EEEEEEEE']),
  15: row([12, 'EEEEEEEE']),
  16: row([12, 'EEEEEFEE']),
  17: row([12, 'EEEEEFEE']),
  18: row([12, 'EEFEEEEE']),
  19: row([12, 'EEFEEEEE']),
  20: row([11, 'EEEEEEEEEE']),
  21: row([11, 'FFFFFFFFFF']),
  22: row([11, 'EEEEEEEEEE']),
  23: row([11, 'EEEEEEEEEE']),
  24: row([11, 'FFFFFFFFFF']),
});

// --- Rank 2: Squire — leather vest, dark trousers, boots ----------------

const SQUIRE_MALE: SpriteLayer = layer({
  14: row([11, '3333333333']),
  15: row([11, '3333333333']),
  ...rows(16, 19, row([11, '3333223333'])),
  20: row([11, '3333333333']),
  21: row([11, '2222222222']),
  ...rows(22, 25, row([12, 'EEE'], [17, 'EEE'])),
  26: row([12, 'FFF'], [17, 'FFF']),
  27: row([12, 'FFF'], [17, 'FFF']),
  ...MALE_BOOTS,
});

const SQUIRE_FEMALE: SpriteLayer = layer({
  14: row([12, '33333333']),
  15: row([12, '33333333']),
  ...rows(16, 19, row([12, '33322333'])),
  20: row([11, '2222222222']),
  21: row([11, '3333333333']),
  22: row([11, '3333333333']),
  23: row([11, '2222222222']),
  24: row([12, 'EEE'], [17, 'EEE']),
  25: row([12, 'EEE'], [17, 'EEE']),
  26: row([12, 'FFF'], [17, 'FFF']),
  27: row([12, 'FFF'], [17, 'FFF']),
  ...FEMALE_BOOTS,
});

// --- Rank 3: Knight — iron armour, first sleeved outfit ------------------

const KNIGHT_MALE: SpriteLayer = layer({
  14: row([11, 'DDDDDDDDDD']),
  15: row([9, 'DDDDDDDDDDDDDD']),
  16: row([9, 'DDDDDDDDDDDDDD']),
  17: row([10, 'DDDDEEEEDDDD']),
  18: row([10, 'DDDDEEEEDDDD']),
  19: row([10, 'DDDDDDDDDDDD']),
  20: row([10, 'EEEEEEEEEEEE']),
  21: row([11, 'DDDDDDDDDD']),
  ...rows(22, 24, row([12, 'DDD'], [17, 'DDD'])),
  25: row([12, 'EEE'], [17, 'EEE']),
  26: row([12, 'EEE'], [17, 'EEE']),
  27: row([12, 'FFF'], [17, 'FFF']),
  ...MALE_BOOTS,
});

const KNIGHT_FEMALE: SpriteLayer = layer({
  14: row([11, 'DDDDDDDDDD']),
  15: row([10, 'DDDDDDDDDDDD']),
  16: row([10, 'DDDDDDDDDDDD']),
  17: row([11, 'DDDEEEEDDD']),
  18: row([11, 'DDDEEEEDDD']),
  19: row([11, 'DDDDDDDDDD']),
  20: row([11, 'EEEEEEEEEE']),
  21: row([11, 'DDDDDDDDDD']),
  ...rows(22, 24, row([12, 'DDD'], [17, 'DDD'])),
  25: row([12, 'EEE'], [17, 'EEE']),
  26: row([12, 'EEE'], [17, 'EEE']),
  27: row([12, 'FFF'], [17, 'FFF']),
  ...FEMALE_BOOTS,
});

// --- Rank 4: Captain — bright steel with gold trim ----------------------

const CAPTAIN_MALE: SpriteLayer = layer({
  14: row([11, 'CCCCCCCCCC']),
  15: row([9, 'CCCCCCCCCCCCCC']),
  16: row([9, 'CCCCCCCCCCCCCC']),
  17: row([10, 'CCCC4444CCCC']),
  18: row([10, 'CCCC4444CCCC']),
  19: row([10, 'CCCCCCCCCCCC']),
  20: row([10, '444444444444']),
  21: row([11, 'CCCCCCCCCC']),
  ...rows(22, 24, row([12, 'CCC'], [17, 'CCC'])),
  25: row([12, 'DDD'], [17, 'DDD']),
  26: row([12, 'DDD'], [17, 'DDD']),
  27: row([12, 'FFF'], [17, 'FFF']),
  ...MALE_BOOTS,
});

const CAPTAIN_FEMALE: SpriteLayer = layer({
  14: row([11, 'CCCCCCCCCC']),
  15: row([10, 'CCCCCCCCCCCC']),
  16: row([10, 'CCCCCCCCCCCC']),
  17: row([11, 'CCC4444CCC']),
  18: row([11, 'CCC4444CCC']),
  19: row([11, 'CCCCCCCCCC']),
  20: row([11, '4444444444']),
  21: row([11, 'CCCCCCCCCC']),
  ...rows(22, 24, row([12, 'CCC'], [17, 'CCC'])),
  25: row([12, 'DDD'], [17, 'DDD']),
  26: row([12, 'DDD'], [17, 'DDD']),
  27: row([12, 'FFF'], [17, 'FFF']),
  ...FEMALE_BOOTS,
});

// --- Rank 5: Noble — purple robes with a white fur collar ---------------

const NOBLE_MALE: SpriteLayer = layer({
  14: row([11, 'CCCCCCCCCC']),
  15: row([10, 'CC11111111CC']),
  16: row([10, 'C1111111111C']),
  ...rows(17, 19, row([10, '111114411111'])),
  20: row([10, '444444444444']),
  ...rows(21, 25, row([10, '111111111111'])),
  26: row([10, '444444444444']),
  ...MALE_BOOTS,
});

const NOBLE_FEMALE: SpriteLayer = layer({
  14: row([11, 'CCCCCCCCCC']),
  15: row([11, 'C11111111C']),
  16: row([11, '1111111111']),
  ...rows(17, 19, row([11, '1111441111'])),
  20: row([11, '4444444444']),
  21: row([10, '111111111111']),
  22: row([10, '111111111111']),
  ...rows(23, 25, row([9, '11111111111111'])),
  26: row([9, '44444444444444']),
  ...FEMALE_BOOTS,
});

// --- Rank 6: Monarch — royal blue, gold, and an ermine hem --------------

const MONARCH_MALE: SpriteLayer = layer({
  14: row([11, 'CCCCCCCCCC']),
  15: row([10, 'CC99999999CC']),
  16: row([10, 'C9999999999C']),
  ...rows(17, 19, row([10, '999994499999'])),
  20: row([10, '444444444444']),
  21: row([10, '999999999999']),
  22: row([10, '999999999999']),
  ...rows(23, 25, row([9, '99999999999999'])),
  26: row([9, '44444444444444']),
  27: row([9, 'CCCCCCCCCCCCCC']),
  28: row([11, '4444'], [17, '4444']),
  29: row([11, '4444'], [17, '4444']),
});

const MONARCH_FEMALE: SpriteLayer = layer({
  14: row([11, 'CCCCCCCCCC']),
  15: row([11, 'C99999999C']),
  16: row([11, '9999999999']),
  ...rows(17, 19, row([11, '9999449999'])),
  20: row([11, '4444444444']),
  21: row([10, '999999999999']),
  22: row([10, '999999999999']),
  ...rows(23, 25, row([9, '99999999999999'])),
  26: row([9, '44444444444444']),
  27: row([9, 'CCCCCCCCCCCCCC']),
  28: row([11, '4444'], [17, '4444']),
  29: row([11, '4444'], [17, '4444']),
});

export const OUTFITS = {
  male: [PEASANT_MALE, SQUIRE_MALE, KNIGHT_MALE, CAPTAIN_MALE, NOBLE_MALE, MONARCH_MALE],
  female: [
    PEASANT_FEMALE,
    SQUIRE_FEMALE,
    KNIGHT_FEMALE,
    CAPTAIN_FEMALE,
    NOBLE_FEMALE,
    MONARCH_FEMALE,
  ],
} as const;

/** `rank` is 1-based and clamped, so a corrupt saved level can't crash a render. */
export function outfitLayer(gender: Gender, rank: number): SpriteLayer {
  const set = OUTFITS[gender];
  const index = Math.min(set.length - 1, Math.max(0, Math.floor(rank) - 1));
  return set[index] ?? (set[0] as SpriteLayer);
}
