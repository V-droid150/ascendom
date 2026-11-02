/**
 * Completing and un-completing a quest.
 *
 * These are the only two functions the UI needs for the core loop. They compose
 * rewards, XP, streaks, stats and HP regen into a single atomic transition so a
 * screen can never apply half of a completion.
 */

import type { Habit, HabitLog, Hero } from '@/types';
import { HP_REGEN_PER_COMPLETION, STAT_GAIN_PER_COMPLETION } from './constants';
import type { DayKey } from './dayKey';
import { heal, drainHp } from './hp';
import { isPromotion } from './ranks';
import { rewardFor, type Reward } from './rewards';
import { streakAfterCompletion } from './streaks';
import { addXp, removeXp } from './xp';

export interface CompletionInput {
  hero: Hero;
  habit: Habit;
  dayKey: DayKey;
  /** ISO timestamp of the completion. Injected so the engine stays pure. */
  now: string;
}

export interface CompletionResult {
  hero: Hero;
  habit: Habit;
  log: HabitLog;
  reward: Reward;
  levelsGained: number;
  leveledUp: boolean;
  promoted: boolean;
  hpRestored: number;
}

export interface UndoInput {
  hero: Hero;
  /** The habit in its post-completion state. */
  habit: Habit;
  /**
   * HP the original completion restored, from the log entry. Defaults to the
   * nominal regen; pass the recorded value so undo is exact when the completion
   * was capped by full health.
   */
  hpRestored?: number;
}

export interface UndoResult {
  hero: Hero;
  habit: Habit;
  /** The reward that was taken back. */
  reverted: Reward;
  levelsLost: number;
  leveledDown: boolean;
}

/**
 * Applies a completion. Callers must have already checked that the habit isn't
 * already logged for `dayKey` — `isCompletedOn` in `logs.ts` does that.
 */
export function completeHabit(input: CompletionInput): CompletionResult {
  const { hero, habit, dayKey, now } = input;

  const streaks = streakAfterCompletion(habit);
  const reward = rewardFor(habit, streaks.streak);

  const change = addXp({ level: hero.level, xp: hero.xp }, reward.xp);
  const hpBefore = hero.hp;

  const healed = heal(
    {
      ...hero,
      level: change.level,
      xp: change.xp,
      gold: hero.gold + reward.gold,
      stats: {
        ...hero.stats,
        [habit.stat]: hero.stats[habit.stat] + STAT_GAIN_PER_COMPLETION,
      },
    },
    HP_REGEN_PER_COMPLETION,
  );

  const hpRestored = healed.hp - hpBefore;

  return {
    hero: healed,
    habit: { ...habit, streak: streaks.streak, bestStreak: streaks.bestStreak },
    log: { habitId: habit.id, dayKey, completedAt: now, hpRestored },
    reward,
    levelsGained: change.levelsGained,
    leveledUp: change.levelsGained > 0,
    promoted: isPromotion(hero.level, change.level),
    hpRestored,
  };
}

/**
 * Reverses a completion made on the current day.
 *
 * The reward is recomputed from the habit's post-completion streak, which
 * reproduces exactly what was granted. `bestStreak` is deliberately not lowered:
 * a personal best, once earned, is kept.
 */
export function undoCompletion(input: UndoInput): UndoResult {
  const { hero, habit } = input;
  const hpToReclaim = input.hpRestored ?? HP_REGEN_PER_COMPLETION;

  const reverted = rewardFor(habit, habit.streak);
  const change = removeXp({ level: hero.level, xp: hero.xp }, reverted.xp);

  const drained = drainHp(
    {
      ...hero,
      level: change.level,
      xp: change.xp,
      gold: Math.max(0, hero.gold - reverted.gold),
      stats: {
        ...hero.stats,
        [habit.stat]: Math.max(0, hero.stats[habit.stat] - STAT_GAIN_PER_COMPLETION),
      },
    },
    hpToReclaim,
  );

  const streak = habit.type === 'daily' ? Math.max(0, habit.streak - 1) : habit.streak;

  return {
    hero: drained,
    habit: { ...habit, streak },
    reverted,
    levelsLost: -change.levelsGained,
    leveledDown: change.levelsGained < 0,
  };
}
