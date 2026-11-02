import { HP_MAX, HP_REGEN_PER_COMPLETION } from '../constants';
import { completeHabit, undoCompletion } from '../completion';
import { makeHabit, makeHero, TODAY } from './factories';

const NOW = '2026-03-10T09:30:00.000Z';

describe('completeHabit', () => {
  it('grants XP, gold, a stat point and HP regen', () => {
    const hero = makeHero({ hp: 80, gold: 100, level: 2, xp: 0 });
    const habit = makeHabit({ difficulty: 'medium', stat: 'wisdom' });

    const result = completeHabit({ hero, habit, dayKey: TODAY, now: NOW });

    expect(result.reward).toEqual({ xp: 20, gold: 10, multiplier: 1 });
    expect(result.hero.xp).toBe(20);
    expect(result.hero.gold).toBe(110);
    expect(result.hero.stats.wisdom).toBe(1);
    expect(result.hero.hp).toBe(80 + HP_REGEN_PER_COMPLETION);
    expect(result.hpRestored).toBe(HP_REGEN_PER_COMPLETION);
  });

  it('writes a log entry for the given day', () => {
    const result = completeHabit({
      hero: makeHero({ hp: 50 }),
      habit: makeHabit({ id: 'h7' }),
      dayKey: TODAY,
      now: NOW,
    });

    expect(result.log).toEqual({
      habitId: 'h7',
      dayKey: TODAY,
      completedAt: NOW,
      hpRestored: HP_REGEN_PER_COMPLETION,
    });
  });

  it('advances the streak and the personal best', () => {
    const habit = makeHabit({ streak: 3, bestStreak: 3 });
    const result = completeHabit({ hero: makeHero(), habit, dayKey: TODAY, now: NOW });

    expect(result.habit.streak).toBe(4);
    expect(result.habit.bestStreak).toBe(4);
  });

  it('does not overheal past the HP cap', () => {
    const result = completeHabit({
      hero: makeHero({ hp: HP_MAX }),
      habit: makeHabit(),
      dayKey: TODAY,
      now: NOW,
    });

    expect(result.hero.hp).toBe(HP_MAX);
    expect(result.hpRestored).toBe(0);
    expect(result.log.hpRestored).toBe(0);
  });

  it('records a partial heal when the cap clips it', () => {
    const result = completeHabit({
      hero: makeHero({ hp: HP_MAX - 1 }),
      habit: makeHabit(),
      dayKey: TODAY,
      now: NOW,
    });

    expect(result.hpRestored).toBe(1);
    expect(result.log.hpRestored).toBe(1);
  });

  it('reports a level up', () => {
    const hero = makeHero({ level: 1, xp: 25 });
    const result = completeHabit({ hero, habit: makeHabit(), dayKey: TODAY, now: NOW });

    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.hero.level).toBe(2);
    expect(result.hero.xp).toBe(15); // 25 + 20 - 30 carried over
  });

  it('reports a promotion when the level up crosses a rank', () => {
    const hero = makeHero({ level: 4, xp: 70 }); // needs 77 for level 5
    const result = completeHabit({
      hero,
      habit: makeHabit({ difficulty: 'hard' }),
      dayKey: TODAY,
      now: NOW,
    });

    expect(result.hero.level).toBe(5);
    expect(result.promoted).toBe(true);
  });

  it('does not report a promotion for a level up inside a rank', () => {
    const hero = makeHero({ level: 1, xp: 25 });
    const result = completeHabit({ hero, habit: makeHabit(), dayKey: TODAY, now: NOW });
    expect(result.promoted).toBe(false);
  });

  it('applies the streak bonus the habit itself earns', () => {
    const habit = makeHabit({ streak: 6, difficulty: 'medium' });
    const result = completeHabit({ hero: makeHero(), habit, dayKey: TODAY, now: NOW });

    expect(result.habit.streak).toBe(7);
    expect(result.reward.multiplier).toBeCloseTo(1.1);
    expect(result.reward.xp).toBe(22);
  });

  it('does not mutate its inputs', () => {
    const hero = makeHero({ gold: 10 });
    const habit = makeHabit({ streak: 1 });
    completeHabit({ hero, habit, dayKey: TODAY, now: NOW });

    expect(hero.gold).toBe(10);
    expect(habit.streak).toBe(1);
  });
});

describe('undoCompletion', () => {
  it('fully reverses a completion', () => {
    const hero = makeHero({ hp: 70, gold: 100, level: 3, xp: 40 });
    const habit = makeHabit({ difficulty: 'medium', stat: 'wisdom', streak: 2, bestStreak: 5 });

    const done = completeHabit({ hero, habit, dayKey: TODAY, now: NOW });
    const undone = undoCompletion({ hero: done.hero, habit: done.habit });

    expect(undone.hero.level).toBe(hero.level);
    expect(undone.hero.xp).toBe(hero.xp);
    expect(undone.hero.gold).toBe(hero.gold);
    expect(undone.hero.hp).toBe(hero.hp);
    expect(undone.hero.stats.wisdom).toBe(hero.stats.wisdom);
    expect(undone.habit.streak).toBe(habit.streak);
  });

  it('round-trips a completion that crossed a level boundary', () => {
    const hero = makeHero({ level: 1, xp: 25 });
    const done = completeHabit({ hero, habit: makeHabit(), dayKey: TODAY, now: NOW });
    const undone = undoCompletion({ hero: done.hero, habit: done.habit });

    expect(done.hero.level).toBe(2);
    expect(undone.hero.level).toBe(1);
    expect(undone.hero.xp).toBe(25);
    expect(undone.leveledDown).toBe(true);
    expect(undone.levelsLost).toBe(1);
  });

  it('round-trips a completion that earned a streak bonus', () => {
    const hero = makeHero({ gold: 0, level: 5, xp: 50 });
    const habit = makeHabit({ streak: 13, difficulty: 'hard' });

    const done = completeHabit({ hero, habit, dayKey: TODAY, now: NOW });
    expect(done.reward.multiplier).toBeCloseTo(1.2);

    const undone = undoCompletion({ hero: done.hero, habit: done.habit });
    expect(undone.hero.gold).toBe(0);
    expect(undone.hero.xp).toBe(50);
    expect(undone.hero.level).toBe(5);
    expect(undone.habit.streak).toBe(13);
  });

  it('keeps a personal best that the completion set', () => {
    const habit = makeHabit({ streak: 9, bestStreak: 9 });
    const done = completeHabit({ hero: makeHero(), habit, dayKey: TODAY, now: NOW });
    const undone = undoCompletion({ hero: done.hero, habit: done.habit });

    expect(done.habit.bestStreak).toBe(10);
    expect(undone.habit.streak).toBe(9);
    expect(undone.habit.bestStreak).toBe(10);
  });

  it('never pushes the hero below the level 1 floor', () => {
    const hero = makeHero({ level: 1, xp: 0, gold: 0 });
    const habit = makeHabit({ difficulty: 'hard', streak: 1 });
    const undone = undoCompletion({ hero, habit });

    expect(undone.hero.level).toBe(1);
    expect(undone.hero.xp).toBe(0);
    expect(undone.hero.gold).toBe(0);
  });

  it('never pushes a stat below zero', () => {
    const hero = makeHero({ stats: { strength: 0, intelligence: 0, wisdom: 0, charisma: 0 } });
    const undone = undoCompletion({ hero, habit: makeHabit({ stat: 'strength', streak: 1 }) });

    expect(undone.hero.stats.strength).toBe(0);
  });

  it('reclaims only the HP a capped completion actually gave', () => {
    const hero = makeHero({ hp: HP_MAX - 1 });
    const done = completeHabit({ hero, habit: makeHabit(), dayKey: TODAY, now: NOW });
    expect(done.hero.hp).toBe(HP_MAX);

    const undone = undoCompletion({
      hero: done.hero,
      habit: done.habit,
      hpRestored: done.log.hpRestored,
    });

    expect(undone.hero.hp).toBe(HP_MAX - 1);
  });

  it('falls back to the nominal regen when no amount is recorded', () => {
    const hero = makeHero({ hp: 50 });
    const undone = undoCompletion({ hero, habit: makeHabit({ streak: 1 }) });
    expect(undone.hero.hp).toBe(50 - HP_REGEN_PER_COMPLETION);
  });

  it('leaves a one-time quest streak untouched', () => {
    const quest = makeHabit({ type: 'quest', streak: 0 });
    const undone = undoCompletion({ hero: makeHero(), habit: quest });
    expect(undone.habit.streak).toBe(0);
  });
});
