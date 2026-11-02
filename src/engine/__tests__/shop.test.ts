import {
  COSMETICS,
  HP_MAX,
  MAX_SHIELDS,
  POTION_COST,
  POTION_HEAL,
  SHIELD_COST,
} from '../constants';
import {
  buyCosmetic,
  buyPotion,
  buyShield,
  cosmeticById,
  equipCosmetic,
  unequipCosmetic,
} from '../shop';
import { makeHero, TODAY } from './factories';

describe('buyShield', () => {
  it('spends gold and adds a shield', () => {
    const result = buyShield(makeHero({ gold: SHIELD_COST }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.gold).toBe(0);
    expect(result.hero.shields).toBe(1);
    expect(result.spent).toBe(SHIELD_COST);
  });

  it('refuses without enough gold', () => {
    const result = buyShield(makeHero({ gold: SHIELD_COST - 1 }));
    expect(result).toEqual({ ok: false, reason: 'insufficient_gold' });
  });

  it('refuses past the shield limit', () => {
    const result = buyShield(makeHero({ gold: 9999, shields: MAX_SHIELDS }));
    expect(result).toEqual({ ok: false, reason: 'shield_limit' });
  });

  it('allows exactly MAX_SHIELDS to be stockpiled', () => {
    let hero = makeHero({ gold: SHIELD_COST * MAX_SHIELDS });
    for (let i = 0; i < MAX_SHIELDS; i += 1) {
      const result = buyShield(hero);
      expect(result.ok).toBe(true);
      if (result.ok) hero = result.hero;
    }
    expect(hero.shields).toBe(MAX_SHIELDS);
    expect(buyShield(hero).ok).toBe(false);
  });
});

describe('buyPotion', () => {
  it('heals and records the day', () => {
    const result = buyPotion(makeHero({ gold: POTION_COST, hp: 40 }), TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.hp).toBe(40 + POTION_HEAL);
    expect(result.hero.gold).toBe(0);
    expect(result.hero.lastPotionDayKey).toBe(TODAY);
  });

  it('does not heal past the cap', () => {
    const result = buyPotion(makeHero({ gold: POTION_COST, hp: HP_MAX - 5 }), TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hero.hp).toBe(HP_MAX);
  });

  it('refuses a second potion on the same day', () => {
    const result = buyPotion(
      makeHero({ gold: 9999, hp: 10, lastPotionDayKey: TODAY }),
      TODAY,
    );
    expect(result).toEqual({ ok: false, reason: 'potion_already_used_today' });
  });

  it('allows another potion the next day', () => {
    const result = buyPotion(
      makeHero({ gold: 9999, hp: 10, lastPotionDayKey: '2026-03-09' }),
      TODAY,
    );
    expect(result.ok).toBe(true);
  });

  it('refuses without enough gold', () => {
    const result = buyPotion(makeHero({ gold: POTION_COST - 1 }), TODAY);
    expect(result).toEqual({ ok: false, reason: 'insufficient_gold' });
  });
});

describe('buyCosmetic', () => {
  const first = COSMETICS[0]!;

  it('spends gold and records ownership', () => {
    const result = buyCosmetic(makeHero({ gold: first.cost }), first.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hero.gold).toBe(0);
    expect(result.hero.ownedCosmetics).toContain(first.id);
  });

  it('refuses an unknown item', () => {
    const result = buyCosmetic(makeHero({ gold: 9999 }), 'cape_of_nothing');
    expect(result).toEqual({ ok: false, reason: 'unknown_item' });
  });

  it('refuses a duplicate purchase', () => {
    const hero = makeHero({ gold: 9999, ownedCosmetics: [first.id] });
    expect(buyCosmetic(hero, first.id)).toEqual({ ok: false, reason: 'already_owned' });
  });

  it('refuses without enough gold', () => {
    const result = buyCosmetic(makeHero({ gold: first.cost - 1 }), first.id);
    expect(result).toEqual({ ok: false, reason: 'insufficient_gold' });
  });

  it('prices every cosmetic between 100 and 400 gold', () => {
    for (const cosmetic of COSMETICS) {
      expect(cosmetic.cost).toBeGreaterThanOrEqual(100);
      expect(cosmetic.cost).toBeLessThanOrEqual(400);
    }
  });
});

describe('equipping cosmetics', () => {
  const capeA = COSMETICS.find((c) => c.slot === 'cape')!;
  const capeB = COSMETICS.filter((c) => c.slot === 'cape')[1]!;
  const tint = COSMETICS.find((c) => c.slot === 'tint')!;

  it('equips an owned cosmetic', () => {
    const hero = makeHero({ ownedCosmetics: [capeA.id] });
    expect(equipCosmetic(hero, capeA.id).equippedCosmetics).toEqual([capeA.id]);
  });

  it('refuses to equip something not owned', () => {
    const hero = makeHero({ ownedCosmetics: [] });
    expect(equipCosmetic(hero, capeA.id)).toBe(hero);
  });

  it('refuses to equip an unknown id', () => {
    const hero = makeHero({ ownedCosmetics: [capeA.id] });
    expect(equipCosmetic(hero, 'nope')).toBe(hero);
  });

  it('replaces whatever occupied the same slot', () => {
    const hero = makeHero({
      ownedCosmetics: [capeA.id, capeB.id],
      equippedCosmetics: [capeA.id],
    });
    expect(equipCosmetic(hero, capeB.id).equippedCosmetics).toEqual([capeB.id]);
  });

  it('keeps cosmetics in other slots', () => {
    const hero = makeHero({
      ownedCosmetics: [capeA.id, capeB.id, tint.id],
      equippedCosmetics: [capeA.id, tint.id],
    });
    const equipped = equipCosmetic(hero, capeB.id).equippedCosmetics;
    expect(equipped).toContain(tint.id);
    expect(equipped).toContain(capeB.id);
    expect(equipped).not.toContain(capeA.id);
  });

  it('unequips', () => {
    const hero = makeHero({ ownedCosmetics: [capeA.id], equippedCosmetics: [capeA.id] });
    expect(unequipCosmetic(hero, capeA.id).equippedCosmetics).toEqual([]);
  });

  it('looks cosmetics up by id', () => {
    expect(cosmeticById(capeA.id)).toBe(capeA);
    expect(cosmeticById('nope')).toBeUndefined();
  });
});
