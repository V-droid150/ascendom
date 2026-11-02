/**
 * Day arithmetic. Every notion of "what day is it" in Ascendom goes through
 * this module so the `dayStartHour` setting is honoured in exactly one place.
 *
 * A dayKey is a `YYYY-MM-DD` string in the user's local calendar, shifted back
 * by `dayStartHour`. With dayStartHour = 4, a completion logged at 02:00 on
 * March 2nd still belongs to March 1st.
 *
 * Nothing here reads the clock. Callers inject the Date.
 */

import { addDays, differenceInCalendarDays, format, parseISO, subHours } from 'date-fns';

export type DayKey = string;

/** Converts an instant into the dayKey of the game-day that contains it. */
export function toDayKey(date: Date, dayStartHour: number): DayKey {
  return format(subHours(date, dayStartHour), 'yyyy-MM-dd');
}

/** Parses a dayKey back into a Date at local midnight. */
export function fromDayKey(key: DayKey): Date {
  return parseISO(`${key}T00:00:00`);
}

export function addDaysToKey(key: DayKey, days: number): DayKey {
  return format(addDays(fromDayKey(key), days), 'yyyy-MM-dd');
}

/** Positive when `a` is later than `b`. */
export function daysBetweenKeys(a: DayKey, b: DayKey): number {
  return differenceInCalendarDays(fromDayKey(a), fromDayKey(b));
}

export function compareDayKeys(a: DayKey, b: DayKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Weekday of a dayKey: 0 = Sunday ... 6 = Saturday. */
export function weekdayOfKey(key: DayKey): number {
  return fromDayKey(key).getDay();
}

/**
 * Every dayKey from `from` to `to`, inclusive. Returns an empty array when
 * `from` is after `to`.
 */
export function dayKeyRange(from: DayKey, to: DayKey): DayKey[] {
  const span = daysBetweenKeys(to, from);
  if (span < 0) return [];
  const keys: DayKey[] = [];
  for (let i = 0; i <= span; i += 1) {
    keys.push(addDaysToKey(from, i));
  }
  return keys;
}

/** The Monday dayKey of the week containing `key`. Weeks run Monday-Sunday. */
export function weekKeyOf(key: DayKey): DayKey {
  const weekday = weekdayOfKey(key);
  // Sunday (0) belongs to the week that started six days earlier.
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToKey(key, offsetToMonday);
}

export function isValidDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = fromDayKey(value);
  return !Number.isNaN(parsed.getTime()) && format(parsed, 'yyyy-MM-dd') === value;
}
