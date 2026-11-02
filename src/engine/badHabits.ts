/**
 * Bad habits (Phase 4).
 *
 * Logging one is an honest self-report, so it costs HP but never gold or XP —
 * the app shouldn't make admitting a slip feel worse than hiding it. A bad-habit
 * tap can trigger a Fall like any other damage.
 */

import type { Habit, Hero } from '@/types';
import { BAD_HABIT_DAMAGE } from './constants';
import { applyDamage, type DamageOutcome } from './hp';

export function logBadHabit(hero: Hero, habit: Habit): DamageOutcome {
  if (!habit.isBad) {
    return { hero, damageApplied: 0, fell: false, demoted: false, goldLost: 0 };
  }
  return applyDamage(hero, BAD_HABIT_DAMAGE);
}
