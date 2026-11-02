/**
 * Health, damage, and the Fall.
 *
 * The Fall is the app's one real consequence: HP hitting zero costs the hero a
 * level, possibly a rank (and the outfit that comes with it), and a tenth of
 * their gold. At most one Fall can happen per call, and damage left over after
 * a Fall is discarded — a single terrible day should cost one level, not four.
 */

import type { Hero } from '@/types';
import { FALL_GOLD_LOSS_PCT, FALL_HP_RESTORE, HP_MAX, MAX_DAILY_DAMAGE } from './constants';
import { isDemotion } from './ranks';
import { demoteOneLevel } from './xp';

export interface DamageOutcome {
  hero: Hero;
  /** Damage actually subtracted from HP, after the daily cap. */
  damageApplied: number;
  fell: boolean;
  demoted: boolean;
  goldLost: number;
}

export function clampHp(hp: number): number {
  return Math.min(HP_MAX, Math.max(0, hp));
}

export function heal(hero: Hero, amount: number): Hero {
  if (amount <= 0) return hero;
  return { ...hero, hp: clampHp(hero.hp + amount) };
}

/** Removes HP without any Fall handling. Used by undo to reverse regen. */
export function drainHp(hero: Hero, amount: number): Hero {
  if (amount <= 0) return hero;
  return { ...hero, hp: clampHp(hero.hp - amount) };
}

/** Caps a day's raw damage so habit count doesn't scale the punishment. */
export function cappedDamage(raw: number): number {
  return Math.min(MAX_DAILY_DAMAGE, Math.max(0, raw));
}

/**
 * The Fall itself: one level down, XP in level reset, HP restored to a usable
 * floor, 10% of gold gone.
 */
export function resolveFall(hero: Hero): { hero: Hero; demoted: boolean; goldLost: number } {
  const change = demoteOneLevel({ level: hero.level, xp: hero.xp });
  const goldLost = Math.floor(hero.gold * FALL_GOLD_LOSS_PCT);

  return {
    hero: {
      ...hero,
      level: change.level,
      xp: change.xp,
      hp: FALL_HP_RESTORE,
      gold: hero.gold - goldLost,
      fallCount: hero.fallCount + 1,
    },
    demoted: isDemotion(hero.level, change.level),
    goldLost,
  };
}

/**
 * Applies damage, triggering at most one Fall. `amount` is expected to already
 * be capped by the caller for scheduled misses; bad-habit taps pass raw values.
 */
export function applyDamage(hero: Hero, amount: number): DamageOutcome {
  if (amount <= 0) {
    return { hero, damageApplied: 0, fell: false, demoted: false, goldLost: 0 };
  }

  const nextHp = hero.hp - amount;

  if (nextHp > 0) {
    return {
      hero: { ...hero, hp: clampHp(nextHp) },
      damageApplied: amount,
      fell: false,
      demoted: false,
      goldLost: 0,
    };
  }

  // HP reached zero: the hero falls, and any excess damage is forgiven.
  const damageApplied = hero.hp;
  const fall = resolveFall({ ...hero, hp: 0 });

  return {
    hero: fall.hero,
    damageApplied,
    fell: true,
    demoted: fall.demoted,
    goldLost: fall.goldLost,
  };
}
