/**
 * Side quests: one or two positive activities that change every game-day.
 *
 * They exist so the board never feels like the same list forever, without
 * touching the habits the user chose. A side quest grants XP, gold and a stat
 * point, but has no streak and deals no damage when skipped.
 *
 * Selection is a pure function of the dayKey. The pool is shuffled once with a
 * fixed seed, then each day takes the next `count` entries in that order. With
 * a pool of at least twice `count`, two consecutive days never share a quest,
 * and every activity comes around before any repeats.
 */

import type { Hero, StatKey } from '@/types';
import {
  SIDE_QUEST_EPOCH_DAY_KEY,
  SIDE_QUEST_REWARD,
  SIDE_QUEST_SHUFFLE_SEED,
  SIDE_QUESTS_PER_DAY,
  STAT_GAIN_PER_COMPLETION,
} from './constants';
import { daysBetweenKeys, type DayKey } from './dayKey';
import { isPromotion } from './ranks';
import { addXp, removeXp } from './xp';

export interface SideQuestDef {
  /** Also the i18n key under `sideQuests.pool`. */
  id: string;
  /** Key into the pixel icon set. */
  icon: string;
  stat: StatKey;
}

export const SIDE_QUEST_POOL: readonly SideQuestDef[] = [
  { id: 'stretch', icon: 'exercise', stat: 'strength' },
  { id: 'pushups', icon: 'exercise', stat: 'strength' },
  { id: 'stairs', icon: 'walk', stat: 'strength' },
  { id: 'sunWalk', icon: 'walk', stat: 'strength' },
  { id: 'extraWater', icon: 'water', stat: 'strength' },
  { id: 'fruit', icon: 'food', stat: 'strength' },
  { id: 'tidyDesk', icon: 'broom', stat: 'wisdom' },
  { id: 'declutter', icon: 'broom', stat: 'wisdom' },
  { id: 'noScroll', icon: 'meditate', stat: 'wisdom' },
  { id: 'breathe', icon: 'meditate', stat: 'wisdom' },
  { id: 'cookMeal', icon: 'food', stat: 'wisdom' },
  { id: 'earlyBed', icon: 'sleep', stat: 'wisdom' },
  { id: 'skipSpend', icon: 'coin', stat: 'wisdom' },
  { id: 'readArticle', icon: 'book', stat: 'intelligence' },
  { id: 'newWords', icon: 'book', stat: 'intelligence' },
  { id: 'podcast', icon: 'music', stat: 'intelligence' },
  { id: 'newSkill', icon: 'code', stat: 'intelligence' },
  { id: 'planTomorrow', icon: 'journal', stat: 'intelligence' },
  { id: 'gratitude', icon: 'journal', stat: 'charisma' },
  { id: 'callFamily', icon: 'journal', stat: 'charisma' },
  { id: 'compliment', icon: 'music', stat: 'charisma' },
  { id: 'thankYou', icon: 'journal', stat: 'charisma' },
  { id: 'helpSomeone', icon: 'broom', stat: 'charisma' },
  { id: 'playMusic', icon: 'music', stat: 'charisma' },
] as const;

/** mulberry32: a tiny, well-distributed seeded PRNG. Deterministic by design. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates with an injected random source, returning a new array. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const random = seededRandom(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** The side quests offered on `dayKey`. Same input, same answer, every time. */
export function sideQuestsForDay(
  dayKey: DayKey,
  count: number = SIDE_QUESTS_PER_DAY,
  pool: readonly SideQuestDef[] = SIDE_QUEST_POOL,
): SideQuestDef[] {
  if (pool.length === 0 || count <= 0) return [];

  const order = seededShuffle(pool, SIDE_QUEST_SHUFFLE_SEED);
  const take = Math.min(count, order.length);
  const dayIndex = daysBetweenKeys(dayKey, SIDE_QUEST_EPOCH_DAY_KEY);
  const start = dayIndex * take;

  return Array.from({ length: take }, (_, i) => {
    const index = (((start + i) % order.length) + order.length) % order.length;
    return order[index] as SideQuestDef;
  });
}

export function sideQuestById(id: string): SideQuestDef | undefined {
  return SIDE_QUEST_POOL.find((quest) => quest.id === id);
}

export interface SideQuestResult {
  hero: Hero;
  xp: number;
  gold: number;
  levelsGained: number;
  leveledUp: boolean;
  promoted: boolean;
}

/** Grants a side quest's flat reward. No streak, no HP, no boss damage. */
export function completeSideQuest(hero: Hero, quest: SideQuestDef): SideQuestResult {
  const change = addXp({ level: hero.level, xp: hero.xp }, SIDE_QUEST_REWARD.xp);

  return {
    hero: {
      ...hero,
      level: change.level,
      xp: change.xp,
      gold: hero.gold + SIDE_QUEST_REWARD.gold,
      stats: {
        ...hero.stats,
        [quest.stat]: hero.stats[quest.stat] + STAT_GAIN_PER_COMPLETION,
      },
    },
    xp: SIDE_QUEST_REWARD.xp,
    gold: SIDE_QUEST_REWARD.gold,
    levelsGained: change.levelsGained,
    leveledUp: change.levelsGained > 0,
    promoted: isPromotion(hero.level, change.level),
  };
}

/** Takes back exactly what `completeSideQuest` granted. */
export function undoSideQuest(hero: Hero, quest: SideQuestDef): Hero {
  const change = removeXp({ level: hero.level, xp: hero.xp }, SIDE_QUEST_REWARD.xp);

  return {
    ...hero,
    level: change.level,
    xp: change.xp,
    gold: Math.max(0, hero.gold - SIDE_QUEST_REWARD.gold),
    stats: {
      ...hero.stats,
      [quest.stat]: Math.max(0, hero.stats[quest.stat] - STAT_GAIN_PER_COMPLETION),
    },
  };
}
