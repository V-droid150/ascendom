import {
  BAD_HABIT_DAMAGE,
  FALL_HP_RESTORE,
  GRACE_DAYS,
  HERO_NAME_MAX_LENGTH,
  HP_MAX,
  MAX_REST_DAYS,
  STAT_KEYS,
} from '../constants';
import {
  createHero,
  defaultSettings,
  emptyStats,
  renameHero,
  restyleHero,
  setRestDays,
} from '../hero';
import { logBadHabit } from '../badHabits';
import { completedIdsOn, completionCountOn, isCompletedOn, logsForDay, removeLog } from '../logs';
import { makeHabit, makeHero, makeLog } from './factories';

describe('renameHero', () => {
  const hero = makeHero({ name: 'Kevin' });

  it('trims and collapses whitespace', () => {
    const result = renameHero(hero, '  Sir   Lancelot  ');
    expect(result.ok && result.hero.name).toBe('Sir Lancelot');
  });

  it('cuts names to the maximum length', () => {
    const result = renameHero(hero, 'x'.repeat(HERO_NAME_MAX_LENGTH + 5));
    expect(result.ok && result.hero.name).toHaveLength(HERO_NAME_MAX_LENGTH);
  });

  it('refuses an empty name and keeps progress untouched', () => {
    expect(renameHero(hero, '   ')).toEqual({ ok: false, reason: 'empty' });
    const result = renameHero(hero, 'Ayu');
    expect(result.ok && result.hero.level).toBe(hero.level);
  });
});

describe('createHero', () => {
  const hero = createHero({
    id: 'h1',
    name: 'Kevin',
    gender: 'female',
    appearance: { skinTone: 2, hairStyle: 1, hairColor: 3 },
    todayKey: '2026-03-10',
    now: '2026-03-10T12:00:00.000Z',
  });

  it('starts at level 1 with full health and nothing earned', () => {
    expect(hero.level).toBe(1);
    expect(hero.xp).toBe(0);
    expect(hero.hp).toBe(HP_MAX);
    expect(hero.gold).toBe(0);
    expect(hero.shields).toBe(0);
    expect(hero.fallCount).toBe(0);
  });

  it('starts with every stat at zero', () => {
    for (const key of STAT_KEYS) {
      expect(hero.stats[key]).toBe(0);
    }
    expect(emptyStats()).toEqual(hero.stats);
  });

  it('grants a grace period covering today plus the next two days', () => {
    expect(GRACE_DAYS).toBe(3);
    expect(hero.graceUntilDayKey).toBe('2026-03-12');
  });

  it('marks today as already evaluated so today is never penalised', () => {
    expect(hero.lastEvaluatedDayKey).toBe('2026-03-10');
  });

  it('keeps the chosen appearance', () => {
    expect(hero.gender).toBe('female');
    expect(hero.appearance).toEqual({ skinTone: 2, hairStyle: 1, hairColor: 3 });
  });

  it('has never used a potion', () => {
    expect(hero.lastPotionDayKey).toBe('');
  });
});

describe('defaultSettings', () => {
  it('defaults to Indonesian with no rest day and notifications off', () => {
    const settings = defaultSettings();
    expect(settings.language).toBe('en');
    expect(settings.dayStartHour).toBe(0);
    expect(settings.restDays).toEqual([]);
    expect(settings.notificationsOn).toBe(false);
    expect(settings.soundOn).toBe(true);
    expect(settings.hapticsOn).toBe(true);
  });
});

describe('restyleHero', () => {
  it('changes gender without touching progress', () => {
    const hero = makeHero({ level: 20, xp: 100, gold: 500, fallCount: 3 });
    const restyled = restyleHero(hero, { gender: 'female' });

    expect(restyled.gender).toBe('female');
    expect(restyled.level).toBe(20);
    expect(restyled.xp).toBe(100);
    expect(restyled.gold).toBe(500);
    expect(restyled.fallCount).toBe(3);
  });

  it('merges a partial appearance change', () => {
    const hero = makeHero({ appearance: { skinTone: 1, hairStyle: 2, hairColor: 3 } });
    expect(restyleHero(hero, { appearance: { hairColor: 5 } }).appearance).toEqual({
      skinTone: 1,
      hairStyle: 2,
      hairColor: 5,
    });
  });

  it('is a no-op with no changes', () => {
    const hero = makeHero();
    expect(restyleHero(hero, {}).gender).toBe(hero.gender);
  });
});

describe('setRestDays', () => {
  it('keeps at most MAX_REST_DAYS entries', () => {
    const settings = setRestDays(defaultSettings(), [0, 3, 5], MAX_REST_DAYS);
    expect(settings.restDays).toHaveLength(MAX_REST_DAYS);
    expect(settings.restDays).toEqual([0]);
  });

  it('drops invalid weekdays', () => {
    expect(setRestDays(defaultSettings(), [9, 1], MAX_REST_DAYS).restDays).toEqual([1]);
    expect(setRestDays(defaultSettings(), [-1], MAX_REST_DAYS).restDays).toEqual([]);
    expect(setRestDays(defaultSettings(), [1.5], MAX_REST_DAYS).restDays).toEqual([]);
  });

  it('can clear the rest day', () => {
    expect(setRestDays(defaultSettings(), [], MAX_REST_DAYS).restDays).toEqual([]);
  });
});

describe('logBadHabit', () => {
  it('costs HP but never gold or XP', () => {
    const hero = makeHero({ hp: 80, gold: 100, xp: 20 });
    const result = logBadHabit(hero, makeHabit({ isBad: true }));

    expect(result.hero.hp).toBe(80 - BAD_HABIT_DAMAGE);
    expect(result.hero.gold).toBe(100);
    expect(result.hero.xp).toBe(20);
  });

  it('can trigger a fall like any other damage', () => {
    const result = logBadHabit(makeHero({ hp: 3, level: 9 }), makeHabit({ isBad: true }));

    expect(result.fell).toBe(true);
    expect(result.hero.level).toBe(8);
    expect(result.hero.hp).toBe(FALL_HP_RESTORE);
  });

  it('does nothing for a habit that is not marked bad', () => {
    const hero = makeHero({ hp: 80 });
    const result = logBadHabit(hero, makeHabit({ isBad: false }));

    expect(result.hero).toBe(hero);
    expect(result.damageApplied).toBe(0);
  });
});

describe('log lookups', () => {
  const logs = [makeLog('a', '2026-03-10'), makeLog('b', '2026-03-10'), makeLog('a', '2026-03-09')];

  it('knows whether a habit was completed on a day', () => {
    expect(isCompletedOn(logs, 'a', '2026-03-10')).toBe(true);
    expect(isCompletedOn(logs, 'b', '2026-03-09')).toBe(false);
  });

  it('filters by day', () => {
    expect(logsForDay(logs, '2026-03-10')).toHaveLength(2);
    expect(logsForDay(logs, '2026-03-01')).toHaveLength(0);
  });

  it('builds a set of completed ids', () => {
    const ids = completedIdsOn(logs, '2026-03-10');
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(true);
    expect(ids.size).toBe(2);
  });

  it('counts completions per day', () => {
    expect(completionCountOn(logs, '2026-03-10')).toBe(2);
    expect(completionCountOn(logs, '2026-03-09')).toBe(1);
  });

  it('removes only the targeted entry', () => {
    const remaining = removeLog(logs, 'a', '2026-03-10');
    expect(remaining).toHaveLength(2);
    expect(isCompletedOn(remaining, 'a', '2026-03-10')).toBe(false);
    expect(isCompletedOn(remaining, 'a', '2026-03-09')).toBe(true);
  });
});
