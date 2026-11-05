/**
 * Streak transitions.
 *
 * A streak counts consecutive *scheduled* days on which a daily was completed.
 * Days the habit isn't scheduled for are skipped entirely — they neither
 * advance nor break the streak. Rest days and shielded days freeze the streak:
 * it survives, but it does not grow, because the user didn't do the work.
 */

import type { Habit } from '@/types';
import { weekdayOfKey, type DayKey } from './dayKey';

/** True when `habit` is due on `dayKey`. One-time quests are never scheduled. */
export function isScheduledOn(habit: Habit, dayKey: DayKey): boolean {
  if (habit.type !== 'daily') return false;
  if (habit.archived) return false;
  return habit.schedule.includes(weekdayOfKey(dayKey));
}

export function advanceStreak(streak: number): number {
  return Math.max(0, streak) + 1;
}

export function resetStreak(): number {
  return 0;
}

/** Protected days keep the streak exactly where it was. */
export function freezeStreak(streak: number): number {
  return Math.max(0, streak);
}

/** Streaks move up, bests never move down. */
export function withBest(
  streak: number,
  bestStreak: number,
): { streak: number; bestStreak: number } {
  return { streak, bestStreak: Math.max(streak, bestStreak) };
}

/**
 * Applies a completion to a habit's streak counters. `previousStreak` is passed
 * explicitly so undo can restore the exact prior value instead of guessing.
 */
export function streakAfterCompletion(habit: Habit): { streak: number; bestStreak: number } {
  if (habit.type !== 'daily') {
    return { streak: habit.streak, bestStreak: habit.bestStreak };
  }
  return withBest(advanceStreak(habit.streak), habit.bestStreak);
}
