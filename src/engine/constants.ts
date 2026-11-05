/**
 * Every tunable number in Ascendom lives here.
 *
 * Game balance is changed by editing this file and nothing else. No other
 * module may hardcode a game number.
 */

import type { BossId, BuildingId, CompanionId, Difficulty, StatKey } from '@/types';

// --- Health & penalties ---------------------------------------------------

export const HP_MAX = 100;

/** Damage dealt per scheduled daily that was not completed on its day. */
export const MISS_DAMAGE = 10;

/**
 * Cap on damage from a single day, regardless of how many habits were missed.
 * Without this, a user with ten habits is punished five times harder than a
 * user with two for exactly the same behaviour.
 */
export const MAX_DAILY_DAMAGE = 30;

export const HP_REGEN_PER_COMPLETION = 3;

/** HP the hero wakes up with after a Fall. */
export const FALL_HP_RESTORE = 50;

/** Fraction of current gold lost on a Fall, floored. */
export const FALL_GOLD_LOSS_PCT = 0.1;

/** Damage per tap when logging a bad habit. */
export const BAD_HABIT_DAMAGE = 5;

// --- Protections ---------------------------------------------------------

/** Days protected from damage after onboarding, counting the onboarding day. */
export const GRACE_DAYS = 3;

/** Weekdays a user may declare as rest days. */
export const MAX_REST_DAYS = 1;

export const MAX_SHIELDS = 3;

// --- Progression ---------------------------------------------------------

export const XP_BASE = 30;
export const XP_FACTOR = 12;
export const XP_EXPONENT = 1.25;

export const REWARDS: Record<Difficulty, { xp: number; gold: number }> = {
  easy: { xp: 10, gold: 5 },
  medium: { xp: 20, gold: 10 },
  hard: { xp: 35, gold: 15 },
};

export const STAT_GAIN_PER_COMPLETION = 1;

// --- Streaks -------------------------------------------------------------

export const STREAK_TIER_DAYS = 7;
export const STREAK_BONUS_PER_TIER = 0.1;
export const STREAK_BONUS_MAX = 0.5;

// --- Day rollover --------------------------------------------------------

/** Missed days older than this are forgiven rather than evaluated. */
export const CATCHUP_MAX_DAYS = 7;

export const DEFAULT_DAY_START_HOUR = 0;

// --- Shop ----------------------------------------------------------------

export const SHIELD_COST = 150;
export const POTION_COST = 80;
export const POTION_HEAL = 30;

export interface CosmeticDef {
  id: string;
  cost: number;
  slot: 'cape' | 'tint';
  /** Palette index from the Sweetie 16 palette. */
  color: number;
}

export const COSMETICS: readonly CosmeticDef[] = [
  { id: 'cape_crimson', cost: 100, slot: 'cape', color: 2 },
  { id: 'cape_emerald', cost: 150, slot: 'cape', color: 6 },
  { id: 'cape_azure', cost: 200, slot: 'cape', color: 10 },
  { id: 'cape_violet', cost: 250, slot: 'cape', color: 1 },
  { id: 'tint_gold', cost: 300, slot: 'tint', color: 4 },
  { id: 'tint_frost', cost: 400, slot: 'tint', color: 11 },
] as const;

// --- Stats ---------------------------------------------------------------

export const STAT_KEYS: readonly StatKey[] = [
  'strength',
  'intelligence',
  'wisdom',
  'charisma',
] as const;

// --- Phase 4: weekly boss ------------------------------------------------

export interface BossDef {
  id: BossId;
  maxHp: number;
  /** Completions training this stat deal bonus damage. */
  weakTo: StatKey;
  rewardGold: number;
}

export const BOSSES: readonly BossDef[] = [
  { id: 'goblin_king', maxHp: 300, weakTo: 'strength', rewardGold: 200 },
  { id: 'shadow_dragon', maxHp: 450, weakTo: 'wisdom', rewardGold: 300 },
  { id: 'lich_of_frost', maxHp: 600, weakTo: 'intelligence', rewardGold: 400 },
  // Added later so every stat has a boss that fears it (charisma had none).
  { id: 'slime_emperor', maxHp: 350, weakTo: 'charisma', rewardGold: 250 },
  { id: 'grand_mimic', maxHp: 400, weakTo: 'wisdom', rewardGold: 275 },
  { id: 'moat_kraken', maxHp: 550, weakTo: 'strength', rewardGold: 350 },
] as const;

/** Base boss damage per habit completion, before difficulty and weakness. */
export const BOSS_DAMAGE_BASE = 10;

export const BOSS_DAMAGE_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** Multiplier applied when a completion trains the stat the boss is weak to. */
export const BOSS_WEAKNESS_MULTIPLIER = 2;

// --- Phase 4: kingdom buildings -----------------------------------------

export interface BuildingDef {
  id: BuildingId;
  cost: number;
  /** Must be built in order; each requires the previous one. */
  requires: BuildingId | null;
}

export const BUILDINGS: readonly BuildingDef[] = [
  { id: 'hut', cost: 100, requires: null },
  { id: 'house', cost: 250, requires: 'hut' },
  { id: 'blacksmith', cost: 500, requires: 'house' },
  { id: 'tower', cost: 900, requires: 'blacksmith' },
  { id: 'castle', cost: 1500, requires: 'tower' },
] as const;

// --- Phase 4: companions -------------------------------------------------

export interface CompanionDef {
  id: CompanionId;
  /** Best streak on any single habit required to unlock. */
  streakRequired: number;
}

export const COMPANIONS: readonly CompanionDef[] = [
  { id: 'cat', streakRequired: 7 },
  { id: 'owl', streakRequired: 30 },
  { id: 'dragonling', streakRequired: 100 },
] as const;

// --- Hero -----------------------------------------------------------------

/** Long enough for a real name, short enough for the status bar and banner. */
export const HERO_NAME_MAX_LENGTH = 16;

// --- Side quests -----------------------------------------------------------

/**
 * Bonus activities that rotate every game-day. They sit beside the user's own
 * habits rather than replacing them, so streaks are never put at risk.
 */
export const SIDE_QUESTS_PER_DAY = 2;
export const SIDE_QUEST_REWARD = { xp: 15, gold: 8 } as const;
/** Fixed seed for the one-time shuffle of the pool. Changing it reorders every day. */
export const SIDE_QUEST_SHUFFLE_SEED = 0x5eed1e;
/** Day zero of the rotation. Any fixed date works; this one predates every save. */
export const SIDE_QUEST_EPOCH_DAY_KEY = '2026-01-01';
