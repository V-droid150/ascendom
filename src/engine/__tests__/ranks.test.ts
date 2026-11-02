import {
  cumulativeXpForRank,
  isDemotion,
  isPromotion,
  levelsToNextRank,
  MAX_RANK,
  nextRank,
  rankById,
  rankForLevel,
  rankNumberForLevel,
  RANKS,
} from '../ranks';

describe('rankForLevel', () => {
  it.each([
    [1, 'peasant'],
    [4, 'peasant'],
    [5, 'squire'],
    [9, 'squire'],
    [10, 'knight'],
    [19, 'knight'],
    [20, 'captain'],
    [29, 'captain'],
    [30, 'noble'],
    [44, 'noble'],
    [45, 'monarch'],
    [999, 'monarch'],
  ])('level %i is %s', (level, id) => {
    expect(rankForLevel(level).id).toBe(id);
  });

  it('clamps nonsense levels to the first rank', () => {
    expect(rankForLevel(0).id).toBe('peasant');
    expect(rankForLevel(-10).id).toBe('peasant');
  });

  it('covers every level with exactly one rank', () => {
    for (let level = 1; level <= 200; level += 1) {
      const matches = RANKS.filter(
        (r) => level >= r.minLevel && (r.maxLevel === null || level <= r.maxLevel),
      );
      expect(matches).toHaveLength(1);
      expect(rankForLevel(level).id).toBe(matches[0]?.id);
    }
  });

  it('has contiguous band boundaries', () => {
    for (let i = 1; i < RANKS.length; i += 1) {
      const previous = RANKS[i - 1];
      const current = RANKS[i];
      expect(current?.minLevel).toBe((previous?.maxLevel ?? 0) + 1);
    }
  });
});

describe('rank navigation', () => {
  it('reports the next rank', () => {
    expect(nextRank(1)?.id).toBe('squire');
    expect(nextRank(44)?.id).toBe('monarch');
  });

  it('has no next rank at the top', () => {
    expect(nextRank(45)).toBeNull();
    expect(levelsToNextRank(60)).toBeNull();
  });

  it('counts levels to promotion', () => {
    expect(levelsToNextRank(1)).toBe(4);
    expect(levelsToNextRank(4)).toBe(1);
    expect(levelsToNextRank(10)).toBe(10);
  });

  it('looks ranks up by id', () => {
    expect(rankById('knight')?.rank).toBe(3);
    expect(rankById('nope')).toBeUndefined();
  });

  it('exposes the ladder length', () => {
    expect(MAX_RANK).toBe(6);
    expect(rankNumberForLevel(45)).toBe(MAX_RANK);
  });
});

describe('promotion and demotion detection', () => {
  it('detects crossing up into a new rank', () => {
    expect(isPromotion(4, 5)).toBe(true);
    expect(isPromotion(1, 4)).toBe(false);
    expect(isPromotion(9, 12)).toBe(true);
  });

  it('detects dropping into a lower rank', () => {
    expect(isDemotion(5, 4)).toBe(true);
    expect(isDemotion(10, 9)).toBe(true);
    expect(isDemotion(6, 5)).toBe(false);
  });

  it('is never both at once', () => {
    for (let before = 1; before <= 50; before += 1) {
      const after = before - 1;
      expect(isPromotion(before, after) && isDemotion(before, after)).toBe(false);
    }
  });
});

describe('cumulativeXpForRank', () => {
  it('needs nothing for rank 1 and more for each rank after', () => {
    expect(cumulativeXpForRank(1)).toBe(0);
    for (let rank = 2; rank <= MAX_RANK; rank += 1) {
      expect(cumulativeXpForRank(rank)).toBeGreaterThan(cumulativeXpForRank(rank - 1));
    }
  });

  it('returns zero for an unknown rank', () => {
    expect(cumulativeXpForRank(99)).toBe(0);
  });
});
