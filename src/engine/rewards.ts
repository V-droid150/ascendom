/**
 * What a completion is worth.
 *
 * The streak multiplier is computed from the streak the completion *produces*,
 * not the one it started from, so finishing a seventh consecutive day pays the
 * first +10% immediately rather than one day later.
 */

import type { Difficulty, Habit } from '@/types';
import { REWARDS, STREAK_BONUS_MAX, STREAK_BONUS_PER_TIER, STREAK_TIER_DAYS } from './constants';

export interface Reward {
  xp: number;
  gold: number;
  /** The multiplier that was applied, e.g. 1.2 for a 14-day streak. */
  multiplier: number;
}

/** Bonus multiplier for a streak: +10% per full week, capped at +50%. */
export function streakMultiplier(streak: number): number {
  const tiers = Math.floor(Math.max(0, streak) / STREAK_TIER_DAYS);
  const bonus = Math.min(STREAK_BONUS_MAX, tiers * STREAK_BONUS_PER_TIER);
  return 1 + bonus;
}

export function baseReward(difficulty: Difficulty): { xp: number; gold: number } {
  return REWARDS[difficulty];
}

/**
 * Reward for completing `habit`, where `streakAfter` is the streak value the
 * completion results in. One-time quests never earn a streak bonus.
 */
export function rewardFor(habit: Habit, streakAfter: number): Reward {
  const base = baseReward(habit.difficulty);
  const multiplier = habit.type === 'daily' ? streakMultiplier(streakAfter) : 1;

  return {
    xp: Math.round(base.xp * multiplier),
    gold: Math.round(base.gold * multiplier),
    multiplier,
  };
}
