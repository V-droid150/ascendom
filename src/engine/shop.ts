/**
 * Shop purchases.
 *
 * Every function returns a discriminated result rather than throwing, so the UI
 * can show a specific toast ("not enough gold", "already at three shields")
 * instead of a generic failure.
 */

import type { Hero } from '@/types';
import {
  COSMETICS,
  MAX_SHIELDS,
  POTION_COST,
  POTION_HEAL,
  SHIELD_COST,
  type CosmeticDef,
} from './constants';
import type { DayKey } from './dayKey';
import { heal } from './hp';

export type PurchaseFailure =
  | 'insufficient_gold'
  | 'shield_limit'
  | 'potion_already_used_today'
  | 'already_owned'
  | 'unknown_item'
  | 'hp_already_full';

export type PurchaseResult =
  { ok: true; hero: Hero; spent: number } | { ok: false; reason: PurchaseFailure };

export function cosmeticById(id: string): CosmeticDef | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export function buyShield(hero: Hero): PurchaseResult {
  if (hero.shields >= MAX_SHIELDS) return { ok: false, reason: 'shield_limit' };
  if (hero.gold < SHIELD_COST) return { ok: false, reason: 'insufficient_gold' };

  return {
    ok: true,
    spent: SHIELD_COST,
    hero: { ...hero, gold: hero.gold - SHIELD_COST, shields: hero.shields + 1 },
  };
}

/** Potions heal immediately and are limited to one per game-day. */
export function buyPotion(hero: Hero, todayKey: DayKey): PurchaseResult {
  if (hero.lastPotionDayKey === todayKey) {
    return { ok: false, reason: 'potion_already_used_today' };
  }
  if (hero.gold < POTION_COST) return { ok: false, reason: 'insufficient_gold' };

  const healed = heal({ ...hero, gold: hero.gold - POTION_COST }, POTION_HEAL);

  return { ok: true, spent: POTION_COST, hero: { ...healed, lastPotionDayKey: todayKey } };
}

export function buyCosmetic(hero: Hero, id: string): PurchaseResult {
  const def = cosmeticById(id);
  if (!def) return { ok: false, reason: 'unknown_item' };
  if (hero.ownedCosmetics.includes(id)) return { ok: false, reason: 'already_owned' };
  if (hero.gold < def.cost) return { ok: false, reason: 'insufficient_gold' };

  return {
    ok: true,
    spent: def.cost,
    hero: {
      ...hero,
      gold: hero.gold - def.cost,
      ownedCosmetics: [...hero.ownedCosmetics, id],
    },
  };
}

/**
 * Equips an owned cosmetic, replacing anything already in the same slot.
 * Cosmetics are purely visual — they never affect rank outfits or progression.
 */
export function equipCosmetic(hero: Hero, id: string): Hero {
  const def = cosmeticById(id);
  if (!def || !hero.ownedCosmetics.includes(id)) return hero;

  const others = hero.equippedCosmetics.filter((equipped) => {
    const other = cosmeticById(equipped);
    return other ? other.slot !== def.slot : false;
  });

  return { ...hero, equippedCosmetics: [...others, id] };
}

export function unequipCosmetic(hero: Hero, id: string): Hero {
  return { ...hero, equippedCosmetics: hero.equippedCosmetics.filter((c) => c !== id) };
}

export type CosmeticSlot = CosmeticDef['slot'];

/** Owned cosmetics grouped by slot, in shop order, for the wardrobe. */
export function ownedBySlot(hero: Hero): Record<CosmeticSlot, CosmeticDef[]> {
  const owned = COSMETICS.filter((def) => hero.ownedCosmetics.includes(def.id));
  return {
    cape: owned.filter((def) => def.slot === 'cape'),
    tint: owned.filter((def) => def.slot === 'tint'),
  };
}

/** The id worn in a slot of a loadout, or null when the slot is empty. */
export function cosmeticInSlot(loadout: readonly string[], slot: CosmeticSlot): string | null {
  return loadout.find((id) => cosmeticById(id)?.slot === slot) ?? null;
}

/**
 * A loadout with `slot` set to `id`, or emptied when `id` is null. Unknown
 * ids are dropped, so a stale save can never wear two capes.
 */
export function withCosmeticInSlot(
  loadout: readonly string[],
  slot: CosmeticSlot,
  id: string | null,
): string[] {
  const kept = loadout.filter((worn) => {
    const def = cosmeticById(worn);
    return def !== undefined && def.slot !== slot;
  });
  return id === null || cosmeticById(id)?.slot !== slot ? kept : [...kept, id];
}

/**
 * Wears exactly `loadout`: everything else comes off, and each id goes on
 * through `equipCosmetic`, so unowned items are ignored and slots stay single.
 */
export function equipLoadout(hero: Hero, loadout: readonly string[]): Hero {
  return loadout.reduce(equipCosmetic, { ...hero, equippedCosmetics: [] });
}
