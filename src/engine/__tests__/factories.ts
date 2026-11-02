import type { Boss, Habit, HabitLog, Hero, KingdomState, Settings } from '@/types';
import { createHero, defaultSettings } from '../hero';

export const TODAY = '2026-03-10'; // a Tuesday
export const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];

export function makeHero(overrides: Partial<Hero> = {}): Hero {
  const base = createHero({
    id: 'hero-1',
    name: 'Kevin',
    gender: 'male',
    appearance: { skinTone: 0, hairStyle: 0, hairColor: 0 },
    todayKey: '2026-03-01',
    now: '2026-03-01T12:00:00.000Z',
  });

  return { ...base, graceUntilDayKey: '2026-03-01', ...overrides };
}

export function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    title: 'Minum 8 gelas air',
    icon: 'water',
    type: 'daily',
    difficulty: 'medium',
    stat: 'wisdom',
    schedule: ALL_WEEK,
    streak: 0,
    bestStreak: 0,
    archived: false,
    createdAt: '2026-03-01T12:00:00.000Z',
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...defaultSettings(), ...overrides };
}

export function makeLog(habitId: string, dayKey: string): HabitLog {
  return { habitId, dayKey, completedAt: `${dayKey}T10:00:00.000Z` };
}

export function makeBoss(overrides: Partial<Boss> = {}): Boss {
  return {
    id: 'goblin_king',
    weekKey: '2026-03-09',
    maxHp: 300,
    hp: 300,
    defeated: false,
    rewardClaimed: false,
    ...overrides,
  };
}

export function makeKingdom(overrides: Partial<KingdomState> = {}): KingdomState {
  return { buildings: [], companions: [], trophies: [], boss: null, ...overrides };
}
