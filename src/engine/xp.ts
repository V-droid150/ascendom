/**
 * The XP curve and level transitions.
 *
 * Curve: xpToNext(level) = round(30 + 12 * (level - 1) ^ 1.25)
 *
 * At a sustained ~110 XP/day (roughly five medium habits with a small streak
 * bonus) this reaches level 5 in ~1.9 days, level 10 in ~8.4 days, level 30 in
 * ~99 days and level 45 in ~248 days — the intended pacing for each rank.
 */

import { XP_BASE, XP_EXPONENT, XP_FACTOR } from './constants';

export interface LevelProgress {
  level: number;
  xp: number;
}

export interface LevelChange extends LevelProgress {
  /** Net levels gained; negative when the hero lost levels. */
  levelsGained: number;
}

/** XP required to advance from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  const effective = Math.max(1, Math.floor(level));
  return Math.round(XP_BASE + XP_FACTOR * (effective - 1) ** XP_EXPONENT);
}

/** Total XP needed to climb from level 1 to `level`. */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < Math.max(1, Math.floor(level)); l += 1) {
    total += xpToNext(l);
  }
  return total;
}

/** Fraction of the current level completed, 0..1. */
export function levelProgressRatio(progress: LevelProgress): number {
  const needed = xpToNext(progress.level);
  if (needed <= 0) return 0;
  return Math.min(1, Math.max(0, progress.xp / needed));
}

/**
 * Adds XP, rolling up through as many levels as the amount covers and carrying
 * the remainder into the new level.
 */
export function addXp(progress: LevelProgress, amount: number): LevelChange {
  if (amount < 0) return removeXp(progress, -amount);

  let { level, xp } = progress;
  xp += amount;

  let guard = 0;
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    // The curve grows monotonically, so this can only be hit by absurd input.
    guard += 1;
    if (guard > 10_000) break;
  }

  return { level, xp, levelsGained: level - progress.level };
}

/**
 * Removes XP, stepping back down through levels when the current level's XP is
 * exhausted. Never falls below level 1 with 0 XP, which is the floor of the
 * game.
 */
export function removeXp(progress: LevelProgress, amount: number): LevelChange {
  let { level, xp } = progress;
  xp -= Math.abs(amount);

  while (xp < 0 && level > 1) {
    level -= 1;
    xp += xpToNext(level);
  }

  if (xp < 0) xp = 0;

  return { level, xp, levelsGained: level - progress.level };
}

/**
 * The level penalty applied by a Fall: one level down, XP within the level
 * reset to zero.
 */
export function demoteOneLevel(progress: LevelProgress): LevelChange {
  const level = Math.max(1, progress.level - 1);
  return { level, xp: 0, levelsGained: level - progress.level };
}
