/**
 * The only place in the app that asks what time it is.
 *
 * The engine is deliberately clock-free, so every day-sensitive call needs a
 * `dayKey` injected. This module produces it, and folds in the dev-only time
 * travel offset so "skip a day" works without touching the device clock.
 */

import { addDays } from 'date-fns';
import { toDayKey, type DayKey } from '@/engine/dayKey';

export function nowWithOffset(offsetDays = 0): Date {
  const now = new Date();
  return offsetDays === 0 ? now : addDays(now, offsetDays);
}

/** The current game-day, honouring `dayStartHour` and the dev offset. */
export function currentDayKey(dayStartHour: number, offsetDays = 0): DayKey {
  return toDayKey(nowWithOffset(offsetDays), dayStartHour);
}

export function nowIso(offsetDays = 0): string {
  return nowWithOffset(offsetDays).toISOString();
}
