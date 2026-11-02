import { BOSSES, BOSS_DAMAGE_BASE, BOSS_WEAKNESS_MULTIPLIER } from '../constants';
import {
  bossDamageFor,
  bossDefById,
  bossDefForWeek,
  bossForToday,
  bossHpRatio,
  claimBossReward,
  daysLeftInBossWeek,
  hitBoss,
  spawnBoss,
} from '../boss';
import { makeBoss, makeHabit } from './factories';

const NOW = '2026-03-10T09:00:00.000Z';

describe('boss selection', () => {
  it('is stable for a given week', () => {
    expect(bossDefForWeek('2026-03-09').id).toBe(bossDefForWeek('2026-03-09').id);
  });

  it('always picks a boss from the roster', () => {
    for (let i = 0; i < 40; i += 1) {
      const weekKey = `2026-03-${String((i % 28) + 1).padStart(2, '0')}`;
      expect(BOSSES.map((b) => b.id)).toContain(bossDefForWeek(weekKey).id);
    }
  });

  it('varies across weeks rather than always returning the same boss', () => {
    const ids = new Set(
      ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26', '2026-02-02', '2026-02-09'].map(
        (week) => bossDefForWeek(week).id,
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it('looks a definition up by id', () => {
    expect(bossDefById('goblin_king')?.maxHp).toBe(300);
  });
});

describe('spawnBoss and bossForToday', () => {
  it('spawns at full health, undefeated and unclaimed', () => {
    const boss = spawnBoss('2026-03-09');
    expect(boss.hp).toBe(boss.maxHp);
    expect(boss.defeated).toBe(false);
    expect(boss.rewardClaimed).toBe(false);
    expect(boss.weekKey).toBe('2026-03-09');
  });

  it('keeps the current boss inside the same week', () => {
    const boss = makeBoss({ weekKey: '2026-03-09', hp: 120 });
    expect(bossForToday(boss, '2026-03-12')).toBe(boss);
  });

  it('spawns a fresh boss when the week rolls over', () => {
    const boss = makeBoss({ weekKey: '2026-03-09', hp: 120 });
    const next = bossForToday(boss, '2026-03-16');

    expect(next.weekKey).toBe('2026-03-16');
    expect(next.hp).toBe(next.maxHp);
  });

  it('spawns one when there is none', () => {
    expect(bossForToday(null, '2026-03-12').weekKey).toBe('2026-03-09');
  });

  it('lets an undefeated boss escape rather than carrying it over', () => {
    const wounded = makeBoss({ weekKey: '2026-03-09', hp: 5 });
    expect(bossForToday(wounded, '2026-03-16').hp).toBeGreaterThan(5);
  });
});

describe('bossDamageFor', () => {
  it('scales with difficulty', () => {
    const boss = makeBoss({ id: 'goblin_king' }); // weak to strength
    expect(bossDamageFor(boss, makeHabit({ difficulty: 'easy', stat: 'wisdom' }))).toBe(
      BOSS_DAMAGE_BASE,
    );
    expect(bossDamageFor(boss, makeHabit({ difficulty: 'medium', stat: 'wisdom' }))).toBe(
      BOSS_DAMAGE_BASE * 2,
    );
    expect(bossDamageFor(boss, makeHabit({ difficulty: 'hard', stat: 'wisdom' }))).toBe(
      BOSS_DAMAGE_BASE * 3,
    );
  });

  it('doubles when the habit trains the stat the boss is weak to', () => {
    const boss = makeBoss({ id: 'goblin_king' });
    const strong = bossDamageFor(boss, makeHabit({ difficulty: 'medium', stat: 'strength' }));
    const plain = bossDamageFor(boss, makeHabit({ difficulty: 'medium', stat: 'wisdom' }));

    expect(strong).toBe(plain * BOSS_WEAKNESS_MULTIPLIER);
  });
});

describe('hitBoss', () => {
  it('removes HP', () => {
    const result = hitBoss(makeBoss({ hp: 300 }), makeHabit({ stat: 'wisdom' }));
    expect(result.boss.hp).toBe(300 - BOSS_DAMAGE_BASE * 2);
    expect(result.justDefeated).toBe(false);
  });

  it('never drives HP below zero', () => {
    const result = hitBoss(makeBoss({ hp: 5 }), makeHabit({ difficulty: 'hard' }));
    expect(result.boss.hp).toBe(0);
    expect(result.damage).toBe(5);
  });

  it('reports the killing blow exactly once', () => {
    const first = hitBoss(makeBoss({ hp: 5 }), makeHabit());
    expect(first.justDefeated).toBe(true);
    expect(first.boss.defeated).toBe(true);

    const second = hitBoss(first.boss, makeHabit());
    expect(second.justDefeated).toBe(false);
    expect(second.damage).toBe(0);
  });

  it('leaves a defeated boss untouched', () => {
    const boss = makeBoss({ hp: 0, defeated: true });
    expect(hitBoss(boss, makeHabit()).boss).toBe(boss);
  });
});

describe('claimBossReward', () => {
  it('pays gold and grants a trophy once', () => {
    const boss = makeBoss({ hp: 0, defeated: true });
    const result = claimBossReward(boss, NOW);

    expect(result.gold).toBe(200);
    expect(result.trophy).toEqual({
      bossId: 'goblin_king',
      weekKey: boss.weekKey,
      earnedAt: NOW,
    });
    expect(result.boss.rewardClaimed).toBe(true);
  });

  it('is idempotent', () => {
    const claimed = makeBoss({ hp: 0, defeated: true, rewardClaimed: true });
    expect(claimBossReward(claimed, NOW)).toEqual({ boss: claimed, gold: 0, trophy: null });
  });

  it('pays nothing for a living boss', () => {
    const alive = makeBoss({ hp: 100 });
    expect(claimBossReward(alive, NOW)).toEqual({ boss: alive, gold: 0, trophy: null });
  });
});

describe('week deadline and health ratio', () => {
  it('counts down to the end of Sunday', () => {
    const boss = makeBoss({ weekKey: '2026-03-09' });
    expect(daysLeftInBossWeek(boss, '2026-03-09')).toBe(6); // Monday
    expect(daysLeftInBossWeek(boss, '2026-03-14')).toBe(1); // Saturday
    expect(daysLeftInBossWeek(boss, '2026-03-15')).toBe(0); // Sunday, last chance
  });

  it('never reports negative days', () => {
    expect(daysLeftInBossWeek(makeBoss({ weekKey: '2026-03-09' }), '2026-04-01')).toBe(0);
  });

  it('reports a health ratio between 0 and 1', () => {
    expect(bossHpRatio(makeBoss({ hp: 300, maxHp: 300 }))).toBe(1);
    expect(bossHpRatio(makeBoss({ hp: 150, maxHp: 300 }))).toBe(0.5);
    expect(bossHpRatio(makeBoss({ hp: 0, maxHp: 300 }))).toBe(0);
    expect(bossHpRatio(makeBoss({ hp: 10, maxHp: 0 }))).toBe(0);
  });
});
