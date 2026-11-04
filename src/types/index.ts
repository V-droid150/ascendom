/**
 * Domain types for Ascendom.
 *
 * These are plain data shapes with no behaviour. All rules that read or write
 * them live in `src/engine`.
 */

export type Gender = 'male' | 'female';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type StatKey = 'strength' | 'intelligence' | 'wisdom' | 'charisma';

/** `daily` repeats on a weekday schedule; `quest` is a one-time to-do. */
export type HabitType = 'daily' | 'quest';

export type Language = 'id' | 'en';

/** Colour scheme. Dark is the default arcade look; light is high-contrast white. */
export type ThemeMode = 'dark' | 'light';

export interface Appearance {
  skinTone: number;
  hairStyle: number;
  hairColor: number;
}

export interface Hero {
  id: string;
  name: string;
  gender: Gender;
  appearance: Appearance;
  /** Always >= 1. Rank is derived from this, never stored. */
  level: number;
  /** XP accumulated inside the current level, always < xpToNext(level). */
  xp: number;
  hp: number;
  gold: number;
  stats: Record<StatKey, number>;
  /** Royal Shields owned, 0..MAX_SHIELDS. */
  shields: number;
  ownedCosmetics: string[];
  equippedCosmetics: string[];
  createdAt: string;
  /** Inclusive: no miss damage is dealt on any dayKey <= this. */
  graceUntilDayKey: string;
  lastEvaluatedDayKey: string;
  /** Enforces the one-potion-per-day limit. Empty string means never used. */
  lastPotionDayKey: string;
  fallCount: number;
}

export interface Habit {
  id: string;
  title: string;
  /** Key into the pixel icon set in `src/sprites/icons.ts`. */
  icon: string;
  type: HabitType;
  difficulty: Difficulty;
  stat: StatKey;
  /** Weekdays 0 (Sunday) - 6 (Saturday). Ignored for one-time quests. */
  schedule: number[];
  reminderTime?: string;
  streak: number;
  bestStreak: number;
  archived: boolean;
  createdAt: string;
  /** Bad habits deal damage when logged instead of granting rewards. */
  isBad?: boolean;
}

export interface HabitLog {
  habitId: string;
  dayKey: string;
  completedAt: string;
  /**
   * HP this completion actually restored. Recorded because the HP cap can make
   * it less than HP_REGEN_PER_COMPLETION, and undo has to give back exactly
   * what was granted rather than a nominal amount.
   */
  hpRestored?: number;
}

export interface DayResult {
  dayKey: string;
  completed: number;
  missed: number;
  damageTaken: number;
  shieldUsed: boolean;
  restDay: boolean;
  graceDay: boolean;
  fell: boolean;
  goldLost: number;
  levelBefore: number;
  levelAfter: number;
}

export interface Settings {
  language: Language;
  /** Hour at which a new day begins, 0-23. Lets night owls log past midnight. */
  dayStartHour: number;
  soundOn: boolean;
  hapticsOn: boolean;
  notificationsOn: boolean;
  reduceMotion: boolean;
  theme: ThemeMode;
  /** At most MAX_REST_DAYS entries. Weekdays that never deal miss damage. */
  restDays: number[];
}

/** Which of today's rotating side quests are done. Reset when the day changes. */
export interface SideQuestProgress {
  dayKey: string;
  completed: string[];
}

// --- Phase 4: depth systems ----------------------------------------------

export type BossId = 'goblin_king' | 'shadow_dragon' | 'lich_of_frost';

export interface Boss {
  id: BossId;
  /** Monday dayKey of the week this boss belongs to. */
  weekKey: string;
  maxHp: number;
  hp: number;
  defeated: boolean;
  rewardClaimed: boolean;
}

export interface Trophy {
  bossId: BossId;
  weekKey: string;
  earnedAt: string;
}

export type BuildingId = 'hut' | 'house' | 'blacksmith' | 'tower' | 'castle';

export type CompanionId = 'cat' | 'owl' | 'dragonling';

export interface KingdomState {
  buildings: BuildingId[];
  companions: CompanionId[];
  trophies: Trophy[];
  boss: Boss | null;
}
