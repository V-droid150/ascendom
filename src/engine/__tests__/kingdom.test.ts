import { BUILDINGS, COMPANIONS } from '../constants';
import {
  bestStreakAcross,
  build,
  buildingDef,
  companionDef,
  emptyKingdom,
  grantCompanions,
  newlyUnlockedCompanions,
  nextBuilding,
} from '../kingdom';
import { makeHabit, makeHero, makeKingdom } from './factories';

describe('building chain', () => {
  it('starts with the hut', () => {
    expect(nextBuilding([])?.id).toBe('hut');
  });

  it('advances through the chain in order', () => {
    expect(nextBuilding(['hut'])?.id).toBe('house');
    expect(nextBuilding(['hut', 'house'])?.id).toBe('blacksmith');
    expect(nextBuilding(['hut', 'house', 'blacksmith', 'tower'])?.id).toBe('castle');
  });

  it('has nothing left after the castle', () => {
    expect(nextBuilding(BUILDINGS.map((b) => b.id))).toBeNull();
  });

  it('gets more expensive at every step', () => {
    for (let i = 1; i < BUILDINGS.length; i += 1) {
      expect(BUILDINGS[i]!.cost).toBeGreaterThan(BUILDINGS[i - 1]!.cost);
    }
  });

  it('looks definitions up by id', () => {
    expect(buildingDef('castle')?.cost).toBe(1500);
  });
});

describe('build', () => {
  it('spends gold and records the building', () => {
    const result = build(makeHero({ gold: 100 }), emptyKingdom(), 'hut');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.gold).toBe(0);
    expect(result.kingdom.buildings).toEqual(['hut']);
    expect(result.spent).toBe(100);
  });

  it('refuses without enough gold', () => {
    expect(build(makeHero({ gold: 99 }), emptyKingdom(), 'hut')).toEqual({
      ok: false,
      reason: 'insufficient_gold',
    });
  });

  it('refuses to skip a prerequisite', () => {
    expect(build(makeHero({ gold: 9999 }), emptyKingdom(), 'castle')).toEqual({
      ok: false,
      reason: 'missing_prerequisite',
    });
  });

  it('refuses to rebuild', () => {
    const kingdom = makeKingdom({ buildings: ['hut'] });
    expect(build(makeHero({ gold: 9999 }), kingdom, 'hut')).toEqual({
      ok: false,
      reason: 'already_built',
    });
  });

  it('allows the whole chain with enough gold', () => {
    let hero = makeHero({ gold: 4000 });
    let kingdom = emptyKingdom();

    for (const def of BUILDINGS) {
      const result = build(hero, kingdom, def.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      hero = result.hero;
      kingdom = result.kingdom;
    }

    expect(kingdom.buildings).toHaveLength(BUILDINGS.length);
    expect(hero.gold).toBe(4000 - BUILDINGS.reduce((sum, b) => sum + b.cost, 0));
  });
});

describe('companions', () => {
  it('reports the best streak across all habits', () => {
    const habits = [
      makeHabit({ id: 'a', bestStreak: 3 }),
      makeHabit({ id: 'b', bestStreak: 31 }),
      makeHabit({ id: 'c', bestStreak: 12 }),
    ];
    expect(bestStreakAcross(habits)).toBe(31);
  });

  it('is zero with no habits', () => {
    expect(bestStreakAcross([])).toBe(0);
  });

  it('unlocks nothing below the first milestone', () => {
    const habits = [makeHabit({ bestStreak: 6 })];
    expect(newlyUnlockedCompanions(emptyKingdom(), habits)).toEqual([]);
  });

  it('unlocks the cat at a seven-day streak', () => {
    const habits = [makeHabit({ bestStreak: 7 })];
    expect(newlyUnlockedCompanions(emptyKingdom(), habits)).toEqual(['cat']);
  });

  it('unlocks every milestone already passed', () => {
    const habits = [makeHabit({ bestStreak: 100 })];
    expect(newlyUnlockedCompanions(emptyKingdom(), habits)).toEqual([
      'cat',
      'owl',
      'dragonling',
    ]);
  });

  it('does not re-offer companions already collected', () => {
    const kingdom = makeKingdom({ companions: ['cat'] });
    const habits = [makeHabit({ bestStreak: 30 })];
    expect(newlyUnlockedCompanions(kingdom, habits)).toEqual(['owl']);
  });

  it('grants without duplicating', () => {
    const kingdom = makeKingdom({ companions: ['cat'] });
    expect(grantCompanions(kingdom, ['cat', 'owl']).companions).toEqual(['cat', 'owl']);
  });

  it('is a no-op when granting nothing', () => {
    const kingdom = makeKingdom({ companions: ['cat'] });
    expect(grantCompanions(kingdom, [])).toBe(kingdom);
  });

  it('has rising milestones', () => {
    for (let i = 1; i < COMPANIONS.length; i += 1) {
      expect(COMPANIONS[i]!.streakRequired).toBeGreaterThan(COMPANIONS[i - 1]!.streakRequired);
    }
    expect(companionDef('owl')?.streakRequired).toBe(30);
  });
});

describe('emptyKingdom', () => {
  it('starts with nothing', () => {
    expect(emptyKingdom()).toEqual({
      buildings: [],
      companions: [],
      trophies: [],
      boss: null,
    });
  });
});
