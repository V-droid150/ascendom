/**
 * Headgear, weapons, and capes — the per-rank accessories.
 *
 * Headgear is composed above hair so a helm covers the crown of the head while
 * the side locks still show. Weapons live in a reserved column band (25-27) and
 * capes in another (21-24) so the two never overwrite each other, which is what
 * lets rank 4 carry a banner shield and wear a cape at the same time.
 */

import type { SpriteLayer } from '../types';
import { emptyLayer, layer, row, rows, type Segment } from './builder';

// --- Headgear -----------------------------------------------------------

/** Rank 3: closed iron helm with cheek guards. */
const IRON_HELM: SpriteLayer = layer({
  3: row([12, 'DDDDDDDD']),
  4: row([11, 'DDDDDDDDDD']),
  5: row([11, 'DDDDDDDDDD']),
  6: row([11, 'DDDDDDDDDD']),
  7: row([11, 'D'], [20, 'E']),
  8: row([11, 'D'], [20, 'E']),
  9: row([11, 'E'], [20, 'E']),
});

/** Rank 4: bright steel helm with a crimson plume and gold band. */
const STEEL_HELM: SpriteLayer = layer({
  1: row([15, '22']),
  2: row([15, '22']),
  3: row([12, 'CCCCCCCC']),
  4: row([11, 'CCCCCCCCCC']),
  5: row([11, 'CCCCCCCCCC']),
  6: row([11, 'C44444444C']),
  7: row([11, 'C'], [20, 'D']),
  8: row([11, 'C'], [20, 'D']),
  9: row([11, 'D'], [20, 'D']),
});

/** Rank 5: a thin gold circlet that leaves the hairstyle visible. */
const CIRCLET: SpriteLayer = layer({
  5: row([15, '22']),
  6: row([11, '4444444444']),
});

/** Rank 6: the crown, with points and two red gems. */
const CROWN: SpriteLayer = layer({
  2: row([12, '4.4..4.4']),
  3: row([12, '44444444']),
  4: row([11, '4444444444']),
  5: row([11, '4244444424']),
  6: row([11, '4444444444']),
});

const HEADGEAR: readonly SpriteLayer[] = [
  emptyLayer(), // rank 1
  emptyLayer(), // rank 2
  IRON_HELM,
  STEEL_HELM,
  CIRCLET,
  CROWN,
];

// --- Weapons ------------------------------------------------------------

/**
 * Weapon geometry is fixed so every rank reads as *held* rather than floating.
 *
 * - The grip sits at column 24 and the hand at columns 22-23, rows 19-20.
 *   The body's arm ends at column 22 (male) or 21 (female); a blade drawn any
 *   further out looks like a pole standing beside the hero, which is exactly
 *   how the first draft looked.
 * - Shields sit at columns 4-8, flush against the opposite arm at column 9,
 *   for the same reason.
 *
 * Rows 19 and 20 are always written out in full rather than merged in from a
 * shared constant, because a shaft that spans them would otherwise be erased on
 * exactly those two rows and leave a gap in the middle of the weapon.
 */
const HAND: Segment = [22, 'ss'];
const HAND_SHADE: Segment = [22, 'sS'];

/** Rank 1: a whittled stick. */
const STICK: SpriteLayer = layer({
  ...rows(12, 25, row([24, 'E'])),
  16: row([24, 'F']),
  19: row(HAND, [24, 'E']),
  20: row(HAND_SHADE, [24, 'E']),
});

/** Rank 2: a short sword. */
const SHORT_SWORD: SpriteLayer = layer({
  ...rows(14, 17, row([24, 'D'])),
  18: row([23, '444']),
  19: row(HAND, [24, '4']),
  20: row(HAND_SHADE, [24, '4']),
  21: row([24, '4']),
});

/** Rank 3: a longsword and a round iron shield. */
const SWORD_AND_SHIELD: SpriteLayer = layer({
  ...rows(10, 14, row([24, 'D'])),
  15: row([6, 'DDD'], [24, 'D']),
  16: row([5, 'DDDD'], [24, 'D']),
  17: row([5, 'DEED'], [24, 'D']),
  18: row([5, 'DEED'], [23, '444']),
  19: row([5, 'DDDD'], HAND, [24, '4']),
  20: row([5, 'DDDD'], HAND_SHADE, [24, '4']),
  21: row([6, 'DDD'], [24, '4']),
});

/** Rank 4: a gold-rimmed kite shield bearing a device, and a steel blade. */
const BANNER_SHIELD: SpriteLayer = layer({
  ...rows(9, 13, row([24, 'C'])),
  14: row([4, '44444'], [24, 'C']),
  15: row([4, '4CCC4'], [24, 'C']),
  16: row([4, '4C2C4'], [24, 'C']),
  17: row([4, '4C2C4'], [24, 'C']),
  18: row([4, '4CCC4'], [23, '444']),
  19: row([4, '4CCC4'], HAND, [24, '4']),
  20: row([4, '44444'], HAND_SHADE, [24, '4']),
  21: row([5, '444'], [24, '4']),
  22: row([6, '4']),
});

/** Rank 6: a golden scepter crowned with an orb. */
const SCEPTER: SpriteLayer = layer({
  11: row([23, '444']),
  12: row([23, '4C4']),
  13: row([23, '444']),
  ...rows(14, 18, row([24, '4'])),
  19: row(HAND, [24, '4']),
  20: row(HAND_SHADE, [24, '4']),
  21: row([24, '4']),
  22: row([24, '4']),
});

const WEAPONS: readonly SpriteLayer[] = [
  STICK,
  SHORT_SWORD,
  SWORD_AND_SHIELD,
  BANNER_SHIELD,
  emptyLayer(), // rank 5 nobles carry no weapon
  SCEPTER,
];

// --- Capes --------------------------------------------------------------

/**
 * Swept to one side rather than draped behind, because a 32px sprite has no
 * depth to read a cape *behind* the body. Drawn in cosmetic swap characters so
 * an equipped cape colour from the shop replaces the default crimson.
 */
const CAPE: SpriteLayer = layer({
  14: row([21, 'cc']),
  15: row([21, 'ccc']),
  16: row([21, 'ccc']),
  ...rows(17, 22, row([21, 'cccc'])),
  23: row([21, 'cccC']),
  24: row([21, 'ccCC']),
  25: row([21, 'cCCC']),
  26: row([21, 'CCCC']),
  27: row([22, 'CCC']),
});

export const MIN_CAPE_RANK = 4;

export function headgearLayer(rank: number): SpriteLayer {
  const index = Math.min(HEADGEAR.length - 1, Math.max(0, Math.floor(rank) - 1));
  return HEADGEAR[index] ?? emptyLayer();
}

export function weaponLayer(rank: number): SpriteLayer {
  const index = Math.min(WEAPONS.length - 1, Math.max(0, Math.floor(rank) - 1));
  return WEAPONS[index] ?? emptyLayer();
}

export function capeLayer(rank: number): SpriteLayer | null {
  return rank >= MIN_CAPE_RANK ? CAPE : null;
}

export const GEAR_LAYERS = { HEADGEAR, WEAPONS, CAPE } as const;
