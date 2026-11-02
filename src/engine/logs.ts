/** Lookups over the completion log. Pure, and kept cheap for render paths. */

import type { HabitLog } from '@/types';
import type { DayKey } from './dayKey';

export function isCompletedOn(logs: HabitLog[], habitId: string, dayKey: DayKey): boolean {
  return logs.some((l) => l.habitId === habitId && l.dayKey === dayKey);
}

export function logsForDay(logs: HabitLog[], dayKey: DayKey): HabitLog[] {
  return logs.filter((l) => l.dayKey === dayKey);
}

export function removeLog(logs: HabitLog[], habitId: string, dayKey: DayKey): HabitLog[] {
  return logs.filter((l) => !(l.habitId === habitId && l.dayKey === dayKey));
}

/** Set of habit ids completed on `dayKey`, for O(1) checks during a render. */
export function completedIdsOn(logs: HabitLog[], dayKey: DayKey): Set<string> {
  const ids = new Set<string>();
  for (const log of logs) {
    if (log.dayKey === dayKey) ids.add(log.habitId);
  }
  return ids;
}

/** Number of completions on a day, used by the Royal Chronicle heatmap. */
export function completionCountOn(logs: HabitLog[], dayKey: DayKey): number {
  return logsForDay(logs, dayKey).length;
}
