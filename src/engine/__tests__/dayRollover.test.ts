import { CATCHUP_MAX_DAYS, HP_MAX, MAX_DAILY_DAMAGE, MISS_DAMAGE } from '../constants';
import { evaluateMissedDays, questsForDay } from '../dayRollover';
import { makeHabit, makeHero, makeLog, makeSettings } from './factories';

// 2026-03-09 Mon, 03-10 Tue, 03-11 Wed, 03-12 Thu, 03-13 Fri, 03-14 Sat, 03-15 Sun
const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];

describe('nothing to evaluate', () => {
  it('leaves the hero untouched on the same day', () => {
    const hero = makeHero({ lastEvaluatedDayKey: '2026-03-09' });
    const result = evaluateMissedDays({
      hero,
      habits: [makeHabit()],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.hero).toBe(hero);
    expect(result.dayResults).toEqual([]);
    expect(result.fell).toBe(false);
  });

  it('never evaluates today, only up to yesterday', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-08', graceUntilDayKey: '2026-03-01' }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.dayResults.map((d) => d.dayKey)).toEqual(['2026-03-09']);
    expect(result.hero.lastEvaluatedDayKey).toBe('2026-03-09');
  });

  it('ignores a clock that moved backwards', () => {
    const hero = makeHero({ lastEvaluatedDayKey: '2026-03-20' });
    const result = evaluateMissedDays({
      hero,
      habits: [makeHabit()],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.hero.lastEvaluatedDayKey).toBe('2026-03-20');
    expect(result.dayResults).toEqual([]);
  });
});

describe('miss damage', () => {
  const base = {
    settings: makeSettings(),
    todayKey: '2026-03-11',
  };

  it('deals MISS_DAMAGE per missed scheduled daily', () => {
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits: [
        makeHabit({ id: 'a', schedule: ALL_WEEK }),
        makeHabit({ id: 'b', schedule: ALL_WEEK }),
      ],
      logs: [],
    });

    expect(result.hero.hp).toBe(HP_MAX - 2 * MISS_DAMAGE);
    expect(result.dayResults[0]?.missed).toBe(2);
    expect(result.dayResults[0]?.damageTaken).toBe(2 * MISS_DAMAGE);
  });

  it('deals no damage for a habit that was completed', () => {
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits: [makeHabit({ id: 'a', schedule: ALL_WEEK })],
      logs: [makeLog('a', '2026-03-10')],
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.dayResults[0]?.completed).toBe(1);
    expect(result.dayResults[0]?.missed).toBe(0);
  });

  it('caps a single day at MAX_DAILY_DAMAGE', () => {
    const habits = Array.from({ length: 8 }, (_, i) =>
      makeHabit({ id: `h${i}`, schedule: ALL_WEEK }),
    );

    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits,
      logs: [],
    });

    expect(result.dayResults[0]?.missed).toBe(8);
    expect(result.dayResults[0]?.damageTaken).toBe(MAX_DAILY_DAMAGE);
  });

  it('ignores habits not scheduled that weekday', () => {
    // 2026-03-10 is a Tuesday (2); schedule this habit for Wednesdays only.
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits: [makeHabit({ schedule: [3] })],
      logs: [],
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.dayResults[0]?.missed).toBe(0);
  });

  it('ignores one-time quests entirely', () => {
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits: [makeHabit({ type: 'quest' })],
      logs: [],
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.dayResults[0]?.missed).toBe(0);
  });

  it('ignores archived habits', () => {
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits: [makeHabit({ archived: true, schedule: ALL_WEEK })],
      logs: [],
    });

    expect(result.hero.hp).toBe(HP_MAX);
  });

  it('ignores bad habits, which only damage on demand', () => {
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX }),
      habits: [makeHabit({ isBad: true, schedule: ALL_WEEK })],
      logs: [],
    });

    expect(result.hero.hp).toBe(HP_MAX);
  });

  it('never penalises a habit for days before it existed', () => {
    const result = evaluateMissedDays({
      ...base,
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-08', hp: HP_MAX }),
      habits: [makeHabit({ schedule: ALL_WEEK, createdAt: '2026-03-10T12:00:00.000Z' })],
      logs: [],
    });

    // Evaluates the 9th and the 10th, but the habit only existed on the 10th.
    expect(result.dayResults[0]?.missed).toBe(0);
    expect(result.dayResults[1]?.missed).toBe(1);
    expect(result.hero.hp).toBe(HP_MAX - MISS_DAMAGE);
  });
});

describe('protections', () => {
  it('deals no damage during the grace period', () => {
    const result = evaluateMissedDays({
      hero: makeHero({
        lastEvaluatedDayKey: '2026-03-09',
        graceUntilDayKey: '2026-03-10',
        hp: HP_MAX,
      }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.dayResults[0]?.graceDay).toBe(true);
    expect(result.dayResults[0]?.damageTaken).toBe(0);
  });

  it('starts dealing damage the day after grace ends', () => {
    const result = evaluateMissedDays({
      hero: makeHero({
        lastEvaluatedDayKey: '2026-03-09',
        graceUntilDayKey: '2026-03-10',
        hp: HP_MAX,
      }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-12',
    });

    expect(result.dayResults[0]?.damageTaken).toBe(0); // 10th, in grace
    expect(result.dayResults[1]?.damageTaken).toBe(MISS_DAMAGE); // 11th, exposed
    expect(result.hero.hp).toBe(HP_MAX - MISS_DAMAGE);
  });

  it('deals no damage on a declared rest day', () => {
    // 2026-03-15 is a Sunday (weekday 0).
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-14', hp: HP_MAX }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings({ restDays: [0] }),
      todayKey: '2026-03-16',
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.dayResults[0]?.restDay).toBe(true);
  });

  it('consumes one shield to absorb a whole day', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX, shields: 2 }),
      habits: [
        makeHabit({ id: 'a', schedule: ALL_WEEK }),
        makeHabit({ id: 'b', schedule: ALL_WEEK }),
        makeHabit({ id: 'c', schedule: ALL_WEEK }),
      ],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.hero.shields).toBe(1);
    expect(result.dayResults[0]?.shieldUsed).toBe(true);
    expect(result.dayResults[0]?.damageTaken).toBe(0);
  });

  it('spends one shield per day until they run out', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: HP_MAX, shields: 1 }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-12',
    });

    expect(result.hero.shields).toBe(0);
    expect(result.dayResults[0]?.shieldUsed).toBe(true);
    expect(result.dayResults[1]?.shieldUsed).toBe(false);
    expect(result.hero.hp).toBe(HP_MAX - MISS_DAMAGE);
  });

  it('does not waste a shield on a grace or rest day', () => {
    const result = evaluateMissedDays({
      hero: makeHero({
        lastEvaluatedDayKey: '2026-03-09',
        graceUntilDayKey: '2026-03-10',
        hp: HP_MAX,
        shields: 1,
      }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.shields).toBe(1);
    expect(result.dayResults[0]?.shieldUsed).toBe(false);
  });

  it('does not consume a shield when nothing was missed', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', shields: 3 }),
      habits: [makeHabit({ id: 'a', schedule: ALL_WEEK })],
      logs: [makeLog('a', '2026-03-10')],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.shields).toBe(3);
  });
});

describe('streak consequences', () => {
  it('resets the streak of an unprotected missed habit', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09' }),
      habits: [makeHabit({ id: 'a', schedule: ALL_WEEK, streak: 12, bestStreak: 12 })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.habits[0]?.streak).toBe(0);
    expect(result.habits[0]?.bestStreak).toBe(12);
  });

  it('freezes the streak on a shielded day', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', shields: 1 }),
      habits: [makeHabit({ schedule: ALL_WEEK, streak: 12 })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.habits[0]?.streak).toBe(12);
  });

  it('freezes the streak on a rest day', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-14' }),
      habits: [makeHabit({ schedule: ALL_WEEK, streak: 9 })],
      logs: [],
      settings: makeSettings({ restDays: [0] }),
      todayKey: '2026-03-16',
    });

    expect(result.habits[0]?.streak).toBe(9);
  });

  it('leaves an unscheduled day without touching the streak', () => {
    // Habit only runs Wednesdays; the 10th is a Tuesday.
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09' }),
      habits: [makeHabit({ schedule: [3], streak: 4 })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.habits[0]?.streak).toBe(4);
  });

  it('only breaks the streaks of the habits actually missed', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09' }),
      habits: [
        makeHabit({ id: 'a', schedule: ALL_WEEK, streak: 5 }),
        makeHabit({ id: 'b', schedule: ALL_WEEK, streak: 5 }),
      ],
      logs: [makeLog('a', '2026-03-10')],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.habits.find((h) => h.id === 'a')?.streak).toBe(5);
    expect(result.habits.find((h) => h.id === 'b')?.streak).toBe(0);
  });
});

describe('catch-up cap', () => {
  it('evaluates at most CATCHUP_MAX_DAYS and forgives the rest', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-01-01', hp: HP_MAX }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.dayResults).toHaveLength(CATCHUP_MAX_DAYS);
    expect(result.forgivenDays).toBeGreaterThan(0);
  });

  it('evaluates the most recent days, not the oldest', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-02-01' }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    const keys = result.dayResults.map((d) => d.dayKey);
    expect(keys[keys.length - 1]).toBe('2026-03-09');
    expect(keys[0]).toBe('2026-03-03');
  });

  it('forgives nothing for a short absence', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-07' }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.forgivenDays).toBe(0);
    expect(result.dayResults).toHaveLength(2);
  });

  it('always advances lastEvaluatedDayKey to yesterday', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2025-06-01' }),
      habits: [makeHabit({ schedule: ALL_WEEK })],
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.hero.lastEvaluatedDayKey).toBe('2026-03-09');
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-01', hp: HP_MAX, gold: 300 }),
      habits: [makeHabit({ id: 'a', schedule: ALL_WEEK, streak: 4 })],
      logs: [makeLog('a', '2026-03-03')],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    };

    expect(evaluateMissedDays(input)).toEqual(evaluateMissedDays(input));
  });

  it('does not mutate the habits it was given', () => {
    const habits = [makeHabit({ schedule: ALL_WEEK, streak: 10 })];
    evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09' }),
      habits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(habits[0]?.streak).toBe(10);
  });
});

describe('questsForDay', () => {
  it('splits dailies, one-time quests and bad habits', () => {
    const habits = [
      makeHabit({ id: 'daily-today', schedule: [2] }),
      makeHabit({ id: 'daily-other', schedule: [3] }),
      makeHabit({ id: 'one-time', type: 'quest' }),
      makeHabit({ id: 'bad', isBad: true, schedule: [2] }),
    ];

    const result = questsForDay(habits, '2026-03-10', 0);

    expect(result.dailies.map((h) => h.id)).toEqual(['daily-today']);
    expect(result.oneTime.map((h) => h.id)).toEqual(['one-time']);
    expect(result.bad.map((h) => h.id)).toEqual(['bad']);
  });

  it('hides archived habits and ones created later', () => {
    const habits = [
      makeHabit({ id: 'archived', schedule: [2], archived: true }),
      makeHabit({ id: 'future', schedule: [2], createdAt: '2026-04-01T12:00:00.000Z' }),
    ];

    const result = questsForDay(habits, '2026-03-10', 0);
    expect(result.dailies).toEqual([]);
  });
});
