import {
  addXp,
  cumulativeXpForLevel,
  demoteOneLevel,
  levelProgressRatio,
  removeXp,
  xpToNext,
} from '../xp';

describe('xpToNext', () => {
  it('matches the documented curve', () => {
    expect(xpToNext(1)).toBe(30);
    expect(xpToNext(2)).toBe(42);
    expect(xpToNext(3)).toBe(59);
    expect(xpToNext(4)).toBe(77);
    expect(xpToNext(5)).toBe(98);
    expect(xpToNext(10)).toBe(217);
  });

  it('increases monotonically', () => {
    for (let level = 1; level < 100; level += 1) {
      expect(xpToNext(level + 1)).toBeGreaterThan(xpToNext(level));
    }
  });

  it('treats levels below 1 as level 1', () => {
    expect(xpToNext(0)).toBe(30);
    expect(xpToNext(-5)).toBe(30);
  });
});

describe('pacing targets', () => {
  // The design baseline is a user earning about 110 XP per day.
  const perDay = 110;
  const daysToReach = (level: number): number => cumulativeXpForLevel(level) / perDay;

  it('reaches rank 2 (level 5) in about two days', () => {
    expect(daysToReach(5)).toBeGreaterThan(1.5);
    expect(daysToReach(5)).toBeLessThan(2.5);
  });

  it('reaches Knight (level 10) in about a week', () => {
    expect(daysToReach(10)).toBeGreaterThan(7);
    expect(daysToReach(10)).toBeLessThan(10);
  });

  it('reaches Lord/Lady (level 30) in about three months', () => {
    expect(daysToReach(30)).toBeGreaterThan(80);
    expect(daysToReach(30)).toBeLessThan(115);
  });

  it('reaches King/Queen (level 45) in about eight months', () => {
    expect(daysToReach(45)).toBeGreaterThan(220);
    expect(daysToReach(45)).toBeLessThan(275);
  });
});

describe('addXp', () => {
  it('accumulates inside a level without levelling', () => {
    expect(addXp({ level: 1, xp: 0 }, 20)).toEqual({ level: 1, xp: 20, levelsGained: 0 });
  });

  it('levels up and carries the remainder', () => {
    expect(addXp({ level: 1, xp: 25 }, 10)).toEqual({ level: 2, xp: 5, levelsGained: 1 });
  });

  it('levels up exactly on the threshold with no remainder', () => {
    expect(addXp({ level: 1, xp: 0 }, 30)).toEqual({ level: 2, xp: 0, levelsGained: 1 });
  });

  it('handles multiple level-ups in a single action', () => {
    // 30 + 42 + 59 = 131 covers levels 1 -> 4 with 9 XP left over.
    const result = addXp({ level: 1, xp: 0 }, 140);
    expect(result.level).toBe(4);
    expect(result.xp).toBe(9);
    expect(result.levelsGained).toBe(3);
  });

  it('is the inverse of removeXp for a round trip', () => {
    const start = { level: 7, xp: 40 };
    const up = addXp(start, 500);
    const down = removeXp({ level: up.level, xp: up.xp }, 500);
    expect(down.level).toBe(start.level);
    expect(down.xp).toBe(start.xp);
  });

  it('delegates negative amounts to removeXp', () => {
    expect(addXp({ level: 3, xp: 10 }, -20)).toEqual(removeXp({ level: 3, xp: 10 }, 20));
  });

  it('survives an absurd amount without hanging', () => {
    const result = addXp({ level: 1, xp: 0 }, 1_000_000);
    expect(result.level).toBeGreaterThan(50);
    expect(Number.isFinite(result.xp)).toBe(true);
  });
});

describe('removeXp', () => {
  it('subtracts inside a level', () => {
    expect(removeXp({ level: 3, xp: 30 }, 10)).toEqual({ level: 3, xp: 20, levelsGained: 0 });
  });

  it('levels back down when XP would go below zero', () => {
    // Dropping below level 3 restores the XP needed for level 2 (42).
    expect(removeXp({ level: 3, xp: 5 }, 10)).toEqual({ level: 2, xp: 37, levelsGained: -1 });
  });

  it('can step down several levels at once', () => {
    // -60 XP from level 4 refunds level 3's 59 and then level 2's 42.
    const result = removeXp({ level: 4, xp: 0 }, 60);
    expect(result).toEqual({ level: 2, xp: 41, levelsGained: -2 });
  });

  it('floors at level 1 with zero XP', () => {
    expect(removeXp({ level: 1, xp: 5 }, 999)).toEqual({ level: 1, xp: 0, levelsGained: 0 });
  });
});

describe('demoteOneLevel', () => {
  it('drops one level and clears XP in level', () => {
    expect(demoteOneLevel({ level: 10, xp: 90 })).toEqual({
      level: 9,
      xp: 0,
      levelsGained: -1,
    });
  });

  it('never goes below level 1', () => {
    expect(demoteOneLevel({ level: 1, xp: 25 })).toEqual({
      level: 1,
      xp: 0,
      levelsGained: 0,
    });
  });
});

describe('cumulativeXpForLevel and levelProgressRatio', () => {
  it('needs no XP to be level 1', () => {
    expect(cumulativeXpForLevel(1)).toBe(0);
    expect(cumulativeXpForLevel(0)).toBe(0);
  });

  it('sums the curve', () => {
    expect(cumulativeXpForLevel(3)).toBe(xpToNext(1) + xpToNext(2));
  });

  it('reports progress through the current level', () => {
    expect(levelProgressRatio({ level: 1, xp: 15 })).toBeCloseTo(0.5);
    expect(levelProgressRatio({ level: 1, xp: 0 })).toBe(0);
    expect(levelProgressRatio({ level: 1, xp: 999 })).toBe(1);
  });
});
