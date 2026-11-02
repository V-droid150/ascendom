import { REWARDS } from '../constants';
import { baseReward, rewardFor, streakMultiplier } from '../rewards';
import { makeHabit } from './factories';

describe('streakMultiplier', () => {
  it('gives no bonus below the first full week', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(6)).toBe(1);
  });

  it('adds 10% per completed week', () => {
    expect(streakMultiplier(7)).toBeCloseTo(1.1);
    expect(streakMultiplier(13)).toBeCloseTo(1.1);
    expect(streakMultiplier(14)).toBeCloseTo(1.2);
    expect(streakMultiplier(21)).toBeCloseTo(1.3);
    expect(streakMultiplier(28)).toBeCloseTo(1.4);
  });

  it('caps at +50% after five weeks', () => {
    expect(streakMultiplier(35)).toBeCloseTo(1.5);
    expect(streakMultiplier(42)).toBeCloseTo(1.5);
    expect(streakMultiplier(3650)).toBeCloseTo(1.5);
  });

  it('treats a negative streak as zero', () => {
    expect(streakMultiplier(-5)).toBe(1);
  });
});

describe('baseReward', () => {
  it('matches the difficulty table', () => {
    expect(baseReward('easy')).toEqual({ xp: 10, gold: 5 });
    expect(baseReward('medium')).toEqual({ xp: 20, gold: 10 });
    expect(baseReward('hard')).toEqual({ xp: 35, gold: 15 });
  });

  it('is the single source of truth for the table', () => {
    expect(baseReward('hard')).toBe(REWARDS.hard);
  });
});

describe('rewardFor', () => {
  it('pays the base amount with no streak', () => {
    const habit = makeHabit({ difficulty: 'medium', streak: 0 });
    expect(rewardFor(habit, 1)).toEqual({ xp: 20, gold: 10, multiplier: 1 });
  });

  it('applies the streak bonus on the day the tier is reached', () => {
    // Completing the seventh consecutive day pays the first +10% immediately.
    const habit = makeHabit({ difficulty: 'medium' });
    expect(rewardFor(habit, 7)).toEqual({ xp: 22, gold: 11, multiplier: 1.1 });
  });

  it('rounds XP and gold to whole numbers', () => {
    const habit = makeHabit({ difficulty: 'hard' });
    const reward = rewardFor(habit, 7);
    expect(reward.xp).toBe(39); // 35 * 1.1 = 38.5 -> 39
    expect(reward.gold).toBe(17); // 15 * 1.1 = 16.5 -> 17
    expect(Number.isInteger(reward.xp)).toBe(true);
    expect(Number.isInteger(reward.gold)).toBe(true);
  });

  it('never gives one-time quests a streak bonus', () => {
    const quest = makeHabit({ type: 'quest', difficulty: 'medium' });
    expect(rewardFor(quest, 42)).toEqual({ xp: 20, gold: 10, multiplier: 1 });
  });

  it('caps the bonus for very long streaks', () => {
    const habit = makeHabit({ difficulty: 'easy' });
    expect(rewardFor(habit, 500)).toEqual({ xp: 15, gold: 8, multiplier: 1.5 });
  });
});
