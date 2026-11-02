/**
 * The weekly boss (Phase 4).
 *
 * A boss spawns each Monday with an HP pool. Every habit completion chips away
 * at it, scaled by difficulty and doubled when the habit trains the stat the
 * boss is weak to — which gives the four stats a mechanical purpose beyond
 * decoration. Beat it before Sunday ends and the week pays a gold bonus and a
 * trophy.
 *
 * Boss choice is derived from the week key rather than randomised, so the same
 * week always yields the same boss and tests stay deterministic.
 */

import type { Boss, Habit, Trophy } from '@/types';
import {
  BOSSES,
  BOSS_DAMAGE_BASE,
  BOSS_DAMAGE_BY_DIFFICULTY,
  BOSS_WEAKNESS_MULTIPLIER,
  type BossDef,
} from './constants';
import { daysBetweenKeys, weekKeyOf, type DayKey } from './dayKey';

/** Stable pseudo-random boss pick: hashes the week key into the roster. */
export function bossDefForWeek(weekKey: DayKey): BossDef {
  let hash = 0;
  for (let i = 0; i < weekKey.length; i += 1) {
    hash = (hash * 31 + weekKey.charCodeAt(i)) % 100_000;
  }
  const def = BOSSES[hash % BOSSES.length];
  return def ?? (BOSSES[0] as BossDef);
}

export function bossDefById(id: Boss['id']): BossDef | undefined {
  return BOSSES.find((b) => b.id === id);
}

export function spawnBoss(weekKey: DayKey): Boss {
  const def = bossDefForWeek(weekKey);
  return {
    id: def.id,
    weekKey,
    maxHp: def.maxHp,
    hp: def.maxHp,
    defeated: false,
    rewardClaimed: false,
  };
}

/**
 * Returns the boss for the week containing `todayKey`, spawning a fresh one
 * when the week has rolled over. The previous boss is simply replaced: an
 * undefeated boss escapes.
 */
export function bossForToday(current: Boss | null, todayKey: DayKey): Boss {
  const weekKey = weekKeyOf(todayKey);
  if (current && current.weekKey === weekKey) return current;
  return spawnBoss(weekKey);
}

/** Damage a single completion of `habit` deals to `boss`. */
export function bossDamageFor(boss: Boss, habit: Habit): number {
  const def = bossDefById(boss.id);
  const base = BOSS_DAMAGE_BASE * BOSS_DAMAGE_BY_DIFFICULTY[habit.difficulty];
  if (def && def.weakTo === habit.stat) return base * BOSS_WEAKNESS_MULTIPLIER;
  return base;
}

export interface BossHitResult {
  boss: Boss;
  damage: number;
  /** True only on the hit that brought the boss down. */
  justDefeated: boolean;
}

export function hitBoss(boss: Boss, habit: Habit): BossHitResult {
  if (boss.defeated) return { boss, damage: 0, justDefeated: false };

  const damage = Math.min(boss.hp, bossDamageFor(boss, habit));
  const hp = boss.hp - damage;
  const defeated = hp <= 0;

  return {
    boss: { ...boss, hp, defeated },
    damage,
    justDefeated: defeated,
  };
}

export interface BossRewardResult {
  boss: Boss;
  gold: number;
  trophy: Trophy | null;
}

/** Claims the one-time reward for a defeated boss. Idempotent. */
export function claimBossReward(boss: Boss, now: string): BossRewardResult {
  if (!boss.defeated || boss.rewardClaimed) return { boss, gold: 0, trophy: null };

  const def = bossDefById(boss.id);

  return {
    boss: { ...boss, rewardClaimed: true },
    gold: def ? def.rewardGold : 0,
    trophy: { bossId: boss.id, weekKey: boss.weekKey, earnedAt: now },
  };
}

/** Days left in the boss's week, inclusive of today. 0 means it expires today. */
export function daysLeftInBossWeek(boss: Boss, todayKey: DayKey): number {
  const elapsed = daysBetweenKeys(todayKey, boss.weekKey);
  return Math.max(0, 6 - elapsed);
}

export function bossHpRatio(boss: Boss): number {
  if (boss.maxHp <= 0) return 0;
  return Math.min(1, Math.max(0, boss.hp / boss.maxHp));
}
