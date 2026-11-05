/**
 * Day rollover and catch-up.
 *
 * Called on app launch and on foreground. Walks every unevaluated day from the
 * one after `hero.lastEvaluatedDayKey` up to yesterday, in order, and settles
 * the consequences: miss damage, protections, streak breaks, and Falls.
 *
 * Today is never evaluated — the user still has time to finish it.
 *
 * This function is pure and deterministic. It reads no clock; `todayKey` is
 * injected. Given the same inputs it always produces the same output, which is
 * what makes the Fall testable and the dev-only time travel possible.
 */

import type { DayResult, Habit, HabitLog, Hero, Settings } from '@/types';
import { CATCHUP_MAX_DAYS, MISS_DAMAGE } from './constants';
import { addDaysToKey, dayKeyRange, toDayKey, weekdayOfKey, type DayKey } from './dayKey';
import { applyDamage, cappedDamage } from './hp';
import { completedIdsOn } from './logs';
import { isScheduledOn, resetStreak } from './streaks';

export interface RolloverInput {
  hero: Hero;
  habits: Habit[];
  logs: HabitLog[];
  settings: Settings;
  todayKey: DayKey;
}

export interface RolloverOutput {
  hero: Hero;
  habits: Habit[];
  /** One entry per evaluated day, oldest first. Appended to the Chronicle. */
  dayResults: DayResult[];
  /** Days skipped by the catch-up cap. Non-zero triggers the welcome-back screen. */
  forgivenDays: number;
  /** True when any evaluated day ended in a Fall. */
  fell: boolean;
}

/** The dayKey a habit was created on, derived from its stored timestamp. */
function createdDayKey(habit: Habit, dayStartHour: number): DayKey {
  return toDayKey(new Date(habit.createdAt), dayStartHour);
}

/**
 * Habits that were due on `dayKey` and could actually have been done: dailies
 * only, scheduled that weekday, not archived, and already created by then.
 */
function dueOn(habits: Habit[], dayKey: DayKey, dayStartHour: number): Habit[] {
  return habits.filter(
    (h) => !h.isBad && isScheduledOn(h, dayKey) && createdDayKey(h, dayStartHour) <= dayKey,
  );
}

export function evaluateMissedDays(input: RolloverInput): RolloverOutput {
  const { habits, logs, settings, todayKey } = input;

  const yesterday = addDaysToKey(todayKey, -1);
  const firstUnevaluated = addDaysToKey(input.hero.lastEvaluatedDayKey, 1);

  const pending = dayKeyRange(firstUnevaluated, yesterday);

  // A clock moved backwards, or nothing has elapsed: leave the hero untouched.
  if (pending.length === 0) {
    return {
      hero: input.hero,
      habits,
      dayResults: [],
      forgivenDays: 0,
      fell: false,
    };
  }

  const forgivenDays = Math.max(0, pending.length - CATCHUP_MAX_DAYS);
  const toEvaluate = pending.slice(forgivenDays);

  let hero = input.hero;
  let workingHabits = habits;
  const dayResults: DayResult[] = [];
  let fell = false;

  for (const dayKey of toEvaluate) {
    const due = dueOn(workingHabits, dayKey, settings.dayStartHour);
    const completedIds = completedIdsOn(logs, dayKey);
    const missed = due.filter((h) => !completedIds.has(h.id));

    const isGraceDay = dayKey <= hero.graceUntilDayKey;
    const isRestDay = settings.restDays.includes(weekdayOfKey(dayKey));

    const levelBefore = hero.level;
    let damageTaken = 0;
    let goldLost = 0;
    let shieldUsed = false;
    let dayFell = false;

    if (missed.length > 0) {
      const protectedByCalendar = isGraceDay || isRestDay;

      if (!protectedByCalendar && hero.shields > 0) {
        // A shield absorbs the entire day and is consumed.
        hero = { ...hero, shields: hero.shields - 1 };
        shieldUsed = true;
      } else if (!protectedByCalendar) {
        const outcome = applyDamage(hero, cappedDamage(missed.length * MISS_DAMAGE));
        hero = outcome.hero;
        damageTaken = outcome.damageApplied;
        goldLost = outcome.goldLost;
        dayFell = outcome.fell;
        fell = fell || outcome.fell;

        // Only an unprotected miss breaks a streak.
        const brokenIds = new Set(missed.map((h) => h.id));
        workingHabits = workingHabits.map((h) =>
          brokenIds.has(h.id) ? { ...h, streak: resetStreak() } : h,
        );
      }
      // Protected days freeze streaks: no reset, no growth.
    }

    dayResults.push({
      dayKey,
      completed: due.length - missed.length,
      missed: missed.length,
      damageTaken,
      shieldUsed,
      restDay: isRestDay,
      graceDay: isGraceDay,
      fell: dayFell,
      goldLost,
      levelBefore,
      levelAfter: hero.level,
    });
  }

  return {
    hero: { ...hero, lastEvaluatedDayKey: yesterday },
    habits: workingHabits,
    dayResults,
    forgivenDays,
    fell,
  };
}

/** Habits the user should see on the Quests screen for `dayKey`. */
export function questsForDay(
  habits: Habit[],
  dayKey: DayKey,
  dayStartHour: number,
): { dailies: Habit[]; oneTime: Habit[]; bad: Habit[] } {
  const live = habits.filter((h) => !h.archived && createdDayKey(h, dayStartHour) <= dayKey);

  return {
    dailies: live.filter((h) => h.type === 'daily' && !h.isBad && isScheduledOn(h, dayKey)),
    oneTime: live.filter((h) => h.type === 'quest' && !h.isBad),
    bad: live.filter((h) => h.isBad === true),
  };
}
