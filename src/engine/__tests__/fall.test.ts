/**
 * The Fall, end to end through the rollover.
 *
 * This is the app's only real punishment, so it gets its own suite: it has to
 * cost exactly one level per day, demote correctly, respect the level-1 floor,
 * and never double-dip on leftover damage.
 */

import { FALL_HP_RESTORE, HP_MAX, MAX_DAILY_DAMAGE } from '../constants';
import { evaluateMissedDays } from '../dayRollover';
import { rankForLevel } from '../ranks';
import { makeHabit, makeHero, makeSettings } from './factories';

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];
const threeHabits = [
  makeHabit({ id: 'a', schedule: ALL_WEEK }),
  makeHabit({ id: 'b', schedule: ALL_WEEK }),
  makeHabit({ id: 'c', schedule: ALL_WEEK }),
];

describe('a single catastrophic day', () => {
  it('falls when the day empties the HP bar', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 20, level: 8, gold: 100 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.fell).toBe(true);
    expect(result.hero.level).toBe(7);
    expect(result.hero.hp).toBe(FALL_HP_RESTORE);
    expect(result.hero.gold).toBe(90);
    expect(result.hero.fallCount).toBe(1);
    expect(result.dayResults[0]?.fell).toBe(true);
    expect(result.dayResults[0]?.goldLost).toBe(10);
  });

  it('records the level either side of the fall', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 10, level: 12 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.dayResults[0]?.levelBefore).toBe(12);
    expect(result.dayResults[0]?.levelAfter).toBe(11);
  });

  it('discards damage left over after the fall', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 5, level: 8 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    // Only the 5 HP that existed is recorded, not the full capped 30.
    expect(result.dayResults[0]?.damageTaken).toBe(5);
    expect(result.hero.level).toBe(7);
    expect(result.hero.hp).toBe(FALL_HP_RESTORE);
  });

  it('cannot fall twice in one day no matter how many habits were missed', () => {
    const manyHabits = Array.from({ length: 20 }, (_, i) =>
      makeHabit({ id: `h${i}`, schedule: ALL_WEEK }),
    );

    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 10, level: 15 }),
      habits: manyHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.level).toBe(14);
    expect(result.hero.fallCount).toBe(1);
    expect(result.dayResults.filter((d) => d.fell)).toHaveLength(1);
  });
});

describe('demotion', () => {
  it('drops a rank and loses the outfit when crossing the rank floor', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 10, level: 10 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(rankForLevel(10).id).toBe('knight');
    expect(result.hero.level).toBe(9);
    expect(rankForLevel(result.hero.level).id).toBe('squire');
  });

  it('keeps the rank when the fall stays inside the band', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 10, level: 15 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.level).toBe(14);
    expect(rankForLevel(result.hero.level).id).toBe('knight');
  });

  it('clears XP within the level', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 10, level: 20, xp: 150 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.xp).toBe(0);
  });
});

describe('the level 1 floor', () => {
  it('cannot drop a level 1 hero any further', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-09', hp: 10, level: 1, xp: 20, gold: 50 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.level).toBe(1);
    expect(result.hero.xp).toBe(0);
    expect(result.hero.hp).toBe(FALL_HP_RESTORE);
    expect(result.hero.gold).toBe(45);
    expect(result.hero.fallCount).toBe(1);
  });

  it('still counts repeated falls at the floor', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-02', hp: 10, level: 1, gold: 0 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(result.hero.level).toBe(1);
    expect(result.hero.fallCount).toBeGreaterThan(1);
  });
});

describe('falls across a catch-up window', () => {
  it('costs at most one level per evaluated day', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-02', hp: HP_MAX, level: 20 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    const falls = result.dayResults.filter((d) => d.fell).length;
    expect(result.dayResults).toHaveLength(7);
    expect(result.hero.level).toBe(20 - falls);
    expect(falls).toBeLessThanOrEqual(result.dayResults.length);
  });

  it('costs two levels for a full week of neglect at 30 damage a day', () => {
    // 100 -> 70 -> 40 -> 10 -> fall(50) -> 20 -> fall(50) -> 20 over seven days.
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-02', hp: HP_MAX, level: 25 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-11',
    });

    expect(MAX_DAILY_DAMAGE).toBe(30);
    expect(result.hero.fallCount).toBe(2);
    expect(result.hero.level).toBe(23);
  });

  it('does not fall at all when shields cover the whole absence', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-07', hp: 10, level: 10, shields: 3 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.fell).toBe(false);
    expect(result.hero.level).toBe(10);
    expect(result.hero.shields).toBe(1);
  });

  it('reports fell=true when any day in the window ended in a fall', () => {
    const result = evaluateMissedDays({
      hero: makeHero({ lastEvaluatedDayKey: '2026-03-05', hp: 15, level: 6 }),
      habits: threeHabits,
      logs: [],
      settings: makeSettings(),
      todayKey: '2026-03-10',
    });

    expect(result.fell).toBe(true);
    expect(result.dayResults.some((d) => d.fell)).toBe(true);
  });
});
