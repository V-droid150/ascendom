import {
  advanceStreak,
  freezeStreak,
  isScheduledOn,
  resetStreak,
  streakAfterCompletion,
  withBest,
} from '../streaks';
import { makeHabit } from './factories';

describe('isScheduledOn', () => {
  // 2026-03-10 is a Tuesday (weekday 2); 2026-03-11 is a Wednesday (3).
  it('is true on a scheduled weekday', () => {
    expect(isScheduledOn(makeHabit({ schedule: [2] }), '2026-03-10')).toBe(true);
  });

  it('is false on an unscheduled weekday', () => {
    expect(isScheduledOn(makeHabit({ schedule: [2] }), '2026-03-11')).toBe(false);
  });

  it('is never true for one-time quests', () => {
    expect(isScheduledOn(makeHabit({ type: 'quest', schedule: [2] }), '2026-03-10')).toBe(false);
  });

  it('is never true for archived habits', () => {
    expect(isScheduledOn(makeHabit({ schedule: [2], archived: true }), '2026-03-10')).toBe(false);
  });

  it('handles an empty schedule', () => {
    expect(isScheduledOn(makeHabit({ schedule: [] }), '2026-03-10')).toBe(false);
  });
});

describe('streak transitions', () => {
  it('advances by one', () => {
    expect(advanceStreak(0)).toBe(1);
    expect(advanceStreak(6)).toBe(7);
  });

  it('treats a negative streak as zero before advancing', () => {
    expect(advanceStreak(-3)).toBe(1);
  });

  it('resets to zero', () => {
    expect(resetStreak()).toBe(0);
  });

  it('freezes without changing', () => {
    expect(freezeStreak(12)).toBe(12);
    expect(freezeStreak(-1)).toBe(0);
  });
});

describe('withBest', () => {
  it('raises the best when the streak exceeds it', () => {
    expect(withBest(8, 5)).toEqual({ streak: 8, bestStreak: 8 });
  });

  it('never lowers the best', () => {
    expect(withBest(2, 30)).toEqual({ streak: 2, bestStreak: 30 });
  });
});

describe('streakAfterCompletion', () => {
  it('advances a daily and tracks the best', () => {
    const habit = makeHabit({ streak: 6, bestStreak: 6 });
    expect(streakAfterCompletion(habit)).toEqual({ streak: 7, bestStreak: 7 });
  });

  it('keeps an old best that is still higher', () => {
    const habit = makeHabit({ streak: 1, bestStreak: 40 });
    expect(streakAfterCompletion(habit)).toEqual({ streak: 2, bestStreak: 40 });
  });

  it('leaves one-time quests alone', () => {
    const quest = makeHabit({ type: 'quest', streak: 0, bestStreak: 0 });
    expect(streakAfterCompletion(quest)).toEqual({ streak: 0, bestStreak: 0 });
  });
});
