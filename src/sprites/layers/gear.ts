/**
 * Headgear, weapons, and capes — the per-rank accessories.
 *
 * Headgear is composed above hair so a helm covers the crown of the head while
 * the side locks still show. Weapons are held in the right hand: the hand is
 * the body's columns 21-22 on rows 20-21, so every weapon puts its grip on
 * column 23 with the crossguard touching the hand. A blade drawn any further
 * out reads as a pole standing beside the hero. Shields sit on the left arm,
 * columns 4-9, overlapping it so they read as strapped on rather than floating.
 *
 * The cape is painted *behind* the body (see `compose`), so only its edges and
 * the part between the legs show — the classic 8-bit way to draw a cloak.
 */

import type { SpriteLayer } from '../types';
import { emptyLayer, layer, row, rows } from './builder';

// --- Headgear -----------------------------------------------------------

/** Rank 3: a rounded iron helm with a brim and cheek guards. */
const IRON_HELM: SpriteLayer = layer({
  1: row([12, 'DDDDDDDD']),
  2: row([11, 'DWDDDDDDDE']),
  3: row([10, 'DWDDDDDDDDDE']),
  4: row([10, 'DDDDDDDDDDEE']),
  5: row([10, 'DDDDDDDDDDEE']),
  6: row([10, 'EEEEEEEEEEEE']),
  7: row([10, 'D'], [21, 'E']),
  8: row([10, 'D'], [21, 'E']),
  9: row([10, 'E'], [21, 'E']),
});

/** Rank 4: bright steel with a crimson plume and a gold band. */
const STEEL_HELM: SpriteLayer = layer({
  0: row([15, '22']),
  1: row([15, '22']),
  2: row([11, 'DWWDDDDDDE']),
  3: row([10, 'DWDDDDDDDDDE']),
  4: row([10, 'DDDDDDDDDDDE']),
  5: row([10, '444444444444']),
  6: row([10, 'DD'], [20, 'EE']),
  7: row([10, 'D'], [21, 'E']),
  8: row([10, 'D'], [21, 'E']),
});

/** Rank 5: a thin gold circlet with a ruby, leaving the hairstyle visible. */
const CIRCLET: SpriteLayer = layer({
  5: row([10, '444442244444']),
});

/** Rank 6: the crown — the same five-point mark as the app icon. */
const CROWN: SpriteLayer = layer({
  0: row([11, 'W'], [15, 'WW'], [20, 'W']),
  1: row([11, '4'], [15, '44'], [20, '4']),
  2: row([11, '4'], [14, '4444'], [20, '4']),
  3: row([11, '4444444444']),
  4: row([11, '4424444244']),
  5: row([11, '3333333333']),
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

/** Crossguard, grip and pommel shared by every sword. */
const HILT = {
  19: row([22, '444']),
  20: row([23, '3']),
  21: row([23, '3']),
  22: row([23, '4']),
} as const;

/** Rank 1: a whittled walking stick. */
const STICK: SpriteLayer = layer({
  ...rows(11, 24, row([23, '3'])),
  10: row([23, '2']),
  15: row([23, '2']),
});

/** Rank 2: a short sword. */
const SHORT_SWORD: SpriteLayer = layer({
  12: row([23, 'W']),
  ...rows(13, 18, row([23, 'D'])),
  ...HILT,
});

/** Rank 3: a longsword and a round iron buckler. */
const SWORD_AND_SHIELD: SpriteLayer = layer({
  7: row([23, 'W']),
  ...rows(8, 18, row([23, 'D'])),
  16: row([6, 'DDD'], [23, 'D']),
  17: row([5, 'DWDDE'], [23, 'D']),
  18: row([5, 'DD4DE'], [23, 'D']),
  19: row([5, 'DDDDE'], [22, '444']),
  20: row([5, 'EDDEE'], [23, '3']),
  21: row([6, 'EEE'], [23, '3']),
  22: row([23, '4']),
});

/** Rank 4: a gold-rimmed kite shield with a white device, and a steel blade. */
const KITE_SHIELD: SpriteLayer = layer({
  6: row([23, 'W']),
  ...rows(7, 14, row([23, 'W'])),
  15: row([4, '444444'], [23, 'W']),
  16: row([4, '422224'], [23, 'D']),
  17: row([4, '42WW24'], [23, 'D']),
  18: row([4, '42WW24'], [23, 'D']),
  ...HILT,
  // Rows 19-22 of the shield share their row with the hilt, so both are listed.
  19: row([4, '422224'], [22, '444']),
  20: row([5, '4224'], [23, '3']),
  21: row([6, '44'], [23, '3']),
});

/** Rank 6: a golden scepter crowned with a ruby orb. */
const SCEPTER: SpriteLayer = layer({
  9: row([22, '444']),
  10: row([22, '424']),
  11: row([22, '444']),
  ...rows(12, 23, row([23, '4'])),
  24: row([23, '3']),
});

const WEAPONS: readonly SpriteLayer[] = [
  STICK,
  SHORT_SWORD,
  SWORD_AND_SHIELD,
  KITE_SHIELD,
  emptyLayer(), // rank 5 nobles carry no weapon
  SCEPTER,
];

// --- Capes --------------------------------------------------------------

/**
 * Drawn in cosmetic swap characters so a cape colour bought in the shop
 * replaces the default crimson. Most of it is hidden by the body in front.
 */
const CAPE: SpriteLayer = layer({
  15: row([8, 'cccccccccccccccc']),
  ...rows(16, 21, row([7, 'cccccccccccccccccC'])),
  // Below the waist only the two hanging edges show, never the gap between
  // the legs: filled in, it reads as a skirt rather than a cloak.
  ...rows(22, 24, row([7, 'cccc'], [21, 'cccC'])),
  25: row([7, 'CCCC'], [21, 'CCCC']),
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

/**
 * The cape behind the hero. Every rank from Captain wears one; below that a
 * hero only has one if they bought it, so a shop cape always shows.
 */
export function capeLayer(rank: number, boughtCape = false): SpriteLayer | null {
  return boughtCape || rank >= MIN_CAPE_RANK ? CAPE : null;
}

export const GEAR_LAYERS = { HEADGEAR, WEAPONS, CAPE } as const;
