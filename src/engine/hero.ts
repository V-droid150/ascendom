/** Hero and settings construction. Kept in the engine so defaults are testable. */

import type { Appearance, Gender, Hero, Settings, StatKey } from '@/types';
import { DEFAULT_DAY_START_HOUR, GRACE_DAYS, HP_MAX, STAT_KEYS } from './constants';
import { addDaysToKey, type DayKey } from './dayKey';

export function emptyStats(): Record<StatKey, number> {
  return STAT_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<StatKey, number>);
}

export function defaultSettings(): Settings {
  return {
    language: 'en',
    dayStartHour: DEFAULT_DAY_START_HOUR,
    soundOn: true,
    hapticsOn: true,
    notificationsOn: false,
    reduceMotion: false,
    theme: 'dark',
    restDays: [],
  };
}

export interface CreateHeroInput {
  id: string;
  name: string;
  gender: Gender;
  appearance: Appearance;
  todayKey: DayKey;
  now: string;
}

/**
 * A new hero starts at full HP with a grace period covering today plus the next
 * two days, so the first scheduled miss can never happen before day four.
 */
export function createHero(input: CreateHeroInput): Hero {
  return {
    id: input.id,
    name: input.name,
    gender: input.gender,
    appearance: input.appearance,
    level: 1,
    xp: 0,
    hp: HP_MAX,
    gold: 0,
    stats: emptyStats(),
    shields: 0,
    ownedCosmetics: [],
    equippedCosmetics: [],
    createdAt: input.now,
    graceUntilDayKey: addDaysToKey(input.todayKey, GRACE_DAYS - 1),
    lastEvaluatedDayKey: input.todayKey,
    lastPotionDayKey: '',
    fallCount: 0,
  };
}

/** Changing gender or appearance is cosmetic: no progress is touched. */
export function restyleHero(
  hero: Hero,
  changes: { gender?: Gender; appearance?: Partial<Appearance> },
): Hero {
  return {
    ...hero,
    gender: changes.gender ?? hero.gender,
    appearance: { ...hero.appearance, ...changes.appearance },
  };
}

/** Enforces the "at most one rest day" rule from the settings screen. */
export function setRestDays(settings: Settings, weekdays: number[], max: number): Settings {
  const valid = weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return { ...settings, restDays: valid.slice(0, max) };
}
