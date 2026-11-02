import { FALL_HP_RESTORE, HP_MAX, MAX_DAILY_DAMAGE } from '../constants';
import { applyDamage, cappedDamage, clampHp, drainHp, heal, resolveFall } from '../hp';
import { makeHero } from './factories';

describe('clampHp', () => {
  it('keeps HP inside 0..HP_MAX', () => {
    expect(clampHp(-20)).toBe(0);
    expect(clampHp(50)).toBe(50);
    expect(clampHp(HP_MAX + 40)).toBe(HP_MAX);
  });
});

describe('heal and drainHp', () => {
  it('heals up to the maximum and no further', () => {
    expect(heal(makeHero({ hp: 90 }), 5).hp).toBe(95);
    expect(heal(makeHero({ hp: 98 }), 10).hp).toBe(HP_MAX);
  });

  it('ignores non-positive healing', () => {
    const hero = makeHero({ hp: 40 });
    expect(heal(hero, 0)).toBe(hero);
    expect(heal(hero, -10)).toBe(hero);
  });

  it('drains without triggering a fall', () => {
    const hero = makeHero({ hp: 2, level: 5 });
    const drained = drainHp(hero, 10);
    expect(drained.hp).toBe(0);
    expect(drained.level).toBe(5);
    expect(drained.fallCount).toBe(0);
  });

  it('ignores non-positive drains', () => {
    const hero = makeHero({ hp: 40 });
    expect(drainHp(hero, 0)).toBe(hero);
  });
});

describe('cappedDamage', () => {
  it('caps a day at MAX_DAILY_DAMAGE', () => {
    expect(cappedDamage(10)).toBe(10);
    expect(cappedDamage(MAX_DAILY_DAMAGE)).toBe(MAX_DAILY_DAMAGE);
    expect(cappedDamage(200)).toBe(MAX_DAILY_DAMAGE);
  });

  it('floors at zero', () => {
    expect(cappedDamage(-5)).toBe(0);
  });

  it('means habit count cannot scale the punishment without limit', () => {
    const tenMissed = cappedDamage(10 * 10);
    const threeMissed = cappedDamage(3 * 10);
    expect(tenMissed).toBe(threeMissed);
  });
});

describe('applyDamage without a fall', () => {
  it('subtracts HP', () => {
    const result = applyDamage(makeHero({ hp: 100 }), 30);
    expect(result.hero.hp).toBe(70);
    expect(result.damageApplied).toBe(30);
    expect(result.fell).toBe(false);
    expect(result.goldLost).toBe(0);
  });

  it('is a no-op for zero or negative damage', () => {
    const hero = makeHero({ hp: 80 });
    const result = applyDamage(hero, 0);
    expect(result.hero).toBe(hero);
    expect(result.damageApplied).toBe(0);
  });

  it('leaves the hero at 1 HP rather than falling', () => {
    const result = applyDamage(makeHero({ hp: 31 }), 30);
    expect(result.hero.hp).toBe(1);
    expect(result.fell).toBe(false);
  });
});

describe('applyDamage triggering a fall', () => {
  it('falls when HP reaches exactly zero', () => {
    const result = applyDamage(makeHero({ hp: 30, level: 8 }), 30);
    expect(result.fell).toBe(true);
    expect(result.hero.hp).toBe(FALL_HP_RESTORE);
    expect(result.hero.level).toBe(7);
  });

  it('discards damage beyond the fall', () => {
    const result = applyDamage(makeHero({ hp: 10, level: 8 }), 30);
    expect(result.fell).toBe(true);
    expect(result.damageApplied).toBe(10);
    expect(result.hero.level).toBe(7);
    expect(result.hero.hp).toBe(FALL_HP_RESTORE);
  });

  it('only ever costs one level per call', () => {
    // 1000 damage against 100 HP is still a single fall.
    const result = applyDamage(makeHero({ hp: 100, level: 20 }), 1000);
    expect(result.hero.level).toBe(19);
    expect(result.hero.fallCount).toBe(1);
  });
});

describe('resolveFall', () => {
  it('drops a level, clears level XP, restores HP and counts the fall', () => {
    const hero = makeHero({ level: 12, xp: 80, hp: 0, gold: 250, fallCount: 2 });
    const { hero: fallen } = resolveFall(hero);

    expect(fallen.level).toBe(11);
    expect(fallen.xp).toBe(0);
    expect(fallen.hp).toBe(FALL_HP_RESTORE);
    expect(fallen.fallCount).toBe(3);
  });

  it('takes 10% of gold, rounded down', () => {
    expect(resolveFall(makeHero({ gold: 250 })).goldLost).toBe(25);
    expect(resolveFall(makeHero({ gold: 99 })).goldLost).toBe(9);
    expect(resolveFall(makeHero({ gold: 5 })).goldLost).toBe(0);
    expect(resolveFall(makeHero({ gold: 0 })).goldLost).toBe(0);
  });

  it('never leaves gold negative', () => {
    expect(resolveFall(makeHero({ gold: 3 })).hero.gold).toBe(3);
  });

  it('reports a demotion when the new level drops below the rank floor', () => {
    const result = resolveFall(makeHero({ level: 10, xp: 50 }));
    expect(result.hero.level).toBe(9);
    expect(result.demoted).toBe(true);
  });

  it('does not report a demotion inside the same rank', () => {
    const result = resolveFall(makeHero({ level: 15, xp: 50 }));
    expect(result.hero.level).toBe(14);
    expect(result.demoted).toBe(false);
  });

  it('holds the floor at level 1', () => {
    const result = resolveFall(makeHero({ level: 1, xp: 25, gold: 100 }));
    expect(result.hero.level).toBe(1);
    expect(result.hero.xp).toBe(0);
    expect(result.demoted).toBe(false);
    expect(result.hero.gold).toBe(90);
    expect(result.hero.fallCount).toBe(1);
  });
});
