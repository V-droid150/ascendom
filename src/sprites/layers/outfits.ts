/**
 * Rank outfits — the visible reward for climbing, and the visible cost of
 * falling. Six per gender, drawn with Sweetie 16 hex digits (plus `W` for
 * white) so they read as fabric and metal rather than tinted skin.
 *
 * The colour story is a deliberate progression, one hue per rank so each step
 * is recognisable at a glance: drab slate rags, warm leather, dull iron, a
 * crimson tabard over steel, noble purple with fur, then royal blue and gold.
 *
 * Every outfit keeps to two or three tones plus the traced outline, in the
 * spirit of NES sprites. Male outfits use trousers; female outfits flare into a
 * skirt or gown, so the silhouettes differ even at 32px.
 *
 * Landmarks (shared with `body.ts`): torso columns 11-20 on rows 15-21, arms
 * 9-10 and 21-22 with the hands left bare on rows 20-21, legs 12-14 and 17-19
 * on rows 22-25, feet on row 26.
 */

import type { Gender } from '@/types';
import type { SpriteLayer } from '../types';
import { layer, row, rows } from './builder';

const BOOTS = { 26: row([11, 'FFFF'], [17, 'FFFF']) } as const;

/** A torso row with matching sleeves. */
function top(sleeve: string, torso: string, sleeveRight: string): string {
  return row([9, sleeve], [11, torso], [21, sleeveRight]);
}

// --- Rank 1: Peasant — patched slate tunic, rope belt, bare feet --------

const PEASANT_MALE: SpriteLayer = layer({
  15: top('EE', 'EEEEEEEEEF', 'EF'),
  16: top('EE', 'EEEEEEEEEF', 'EF'),
  17: row([11, 'EEEFFEEEEF']),
  18: row([11, 'EEEFFEEEEF']),
  19: row([11, '3333333333']),
  20: row([11, 'EEEEEEEEEF']),
  21: row([11, 'EEEEEEEEFF']),
  22: row([12, 'EEE'], [17, 'EEF']),
  23: row([12, 'FFF'], [17, 'FFF']),
});

const PEASANT_FEMALE: SpriteLayer = layer({
  15: top('EE', 'EEEEEEEEEF', 'EF'),
  16: top('EE', 'EEEEEEEEEF', 'EF'),
  17: row([11, 'EEEEEEFFEF']),
  18: row([11, 'EEEEEEFFEF']),
  19: row([11, '3333333333']),
  20: row([11, 'EEEEEEEEEF']),
  21: row([10, 'EEEEEEEEEEFF']),
  22: row([10, 'EEEFEEEEEEFF']),
  23: row([10, 'FFFFFFFFFFFF']),
});

// --- Rank 2: Squire — leather vest over a white shirt, boots ------------

const SQUIRE_TOP = {
  ...rows(15, 18, top('WW', '333WWWW332', 'WD')),
  19: top('WW', 'FFFF44FFFF', 'WD'),
} as const;

const SQUIRE_MALE: SpriteLayer = layer({
  ...SQUIRE_TOP,
  20: row([11, '3333333332']),
  21: row([11, 'EEEEEEEEEF']),
  ...rows(22, 24, row([12, 'EEE'], [17, 'EEF'])),
  25: row([12, 'FFF'], [17, 'FFF']),
  ...BOOTS,
});

const SQUIRE_FEMALE: SpriteLayer = layer({
  ...SQUIRE_TOP,
  20: row([10, '333333333322']),
  21: row([10, '333333333322']),
  22: row([10, '222222222222']),
  ...rows(23, 24, row([12, 'EEE'], [17, 'EEF'])),
  25: row([12, 'FFF'], [17, 'FFF']),
  ...BOOTS,
});

// --- Rank 3: Knight — iron plate, first fully armoured outfit -----------

const KNIGHT_TOP = {
  15: top('DD', 'DWDDDDDDDE', 'DE'),
  16: top('DD', 'DWDDDDDDDE', 'DE'),
  17: top('DE', 'DDDDEEDDDE', 'DE'),
  18: top('DE', 'DDDDEEDDEE', 'DE'),
  19: top('EE', 'FFFFFFFFFF', 'EE'),
} as const;

const KNIGHT_MALE: SpriteLayer = layer({
  ...KNIGHT_TOP,
  20: row([11, 'DDDDDDDDDE']),
  21: row([11, 'DDDEEEDDDE']),
  ...rows(22, 23, row([12, 'DDE'], [17, 'DDE'])),
  ...rows(24, 25, row([12, 'EEE'], [17, 'EEE'])),
  ...BOOTS,
});

const KNIGHT_FEMALE: SpriteLayer = layer({
  ...KNIGHT_TOP,
  20: row([10, 'DDDDDDDDDDEE']),
  21: row([10, 'DEDEDEDEDEEE']),
  22: row([10, 'EEEEEEEEEEEE']),
  23: row([12, 'DDE'], [17, 'DDE']),
  ...rows(24, 25, row([12, 'EEE'], [17, 'EEE'])),
  ...BOOTS,
});

// --- Rank 4: Captain — crimson tabard over steel, gold trim -------------

const CAPTAIN_TOP = {
  15: top('WD', 'DD222222DE', 'DE'),
  16: top('WD', 'D22222222E', 'DE'),
  17: top('DD', 'D222WW222E', 'DE'),
  18: top('DD', 'D222WW222E', 'DE'),
  19: top('DE', '4444444444', 'EE'),
} as const;

const CAPTAIN_MALE: SpriteLayer = layer({
  ...CAPTAIN_TOP,
  20: row([11, 'D22222222E']),
  21: row([11, 'E44444444E']),
  ...rows(22, 23, row([12, 'DDE'], [17, 'DDE'])),
  ...rows(24, 25, row([12, 'EEE'], [17, 'EEE'])),
  ...BOOTS,
});

const CAPTAIN_FEMALE: SpriteLayer = layer({
  ...CAPTAIN_TOP,
  20: row([10, 'E2222222222E']),
  21: row([10, '222222222222']),
  22: row([10, '444444444444']),
  23: row([12, 'DDE'], [17, 'DDE']),
  ...rows(24, 25, row([12, 'EEE'], [17, 'EEE'])),
  ...BOOTS,
});

// --- Rank 5: Noble — purple robes, white fur collar, gold sash ----------

const NOBLE_TOP = {
  15: top('1W', 'WWWWWWWWWW', 'W1'),
  ...rows(16, 18, top('11', '1111441111', '1F')),
  19: top('11', '4444444444', '1F'),
} as const;

const NOBLE_MALE: SpriteLayer = layer({
  ...NOBLE_TOP,
  ...rows(20, 21, row([11, '1111441111'])),
  ...rows(22, 24, row([10, '111111441111'])),
  25: row([10, 'WWWWWWWWWWWW']),
  ...BOOTS,
});

const NOBLE_FEMALE: SpriteLayer = layer({
  ...NOBLE_TOP,
  20: row([10, '111114411111']),
  21: row([9, '11111144111111']),
  ...rows(22, 24, row([8, '1111111441111111'])),
  25: row([8, 'WWWWWWWWWWWWWWWW']),
  ...BOOTS,
});

// --- Rank 6: Monarch — royal blue, gold, and an ermine trim -------------

const MONARCH_TOP = {
  15: top('9W', 'W0WWWWW0WW', 'W9'),
  ...rows(16, 18, top('99', '9999449998', '98')),
  19: top('99', '4444444444', '98'),
} as const;

const GOLD_SHOES = { 26: row([11, '4444'], [17, '4444']) } as const;

const MONARCH_MALE: SpriteLayer = layer({
  ...MONARCH_TOP,
  ...rows(20, 21, row([11, '9999449998'])),
  ...rows(22, 24, row([10, '999999449998'])),
  25: row([10, 'W0WWWW0WWW0W']),
  ...GOLD_SHOES,
});

const MONARCH_FEMALE: SpriteLayer = layer({
  ...MONARCH_TOP,
  20: row([10, '999994499998']),
  21: row([9, '99999944999988']),
  ...rows(22, 24, row([8, '9999999449999988'])),
  25: row([8, 'W0WWWW0WWWW0WWW0']),
  ...GOLD_SHOES,
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
