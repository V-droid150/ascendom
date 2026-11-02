/**
 * The rank ladder.
 *
 * Rank is always derived from level — storing it would let the two drift apart.
 * Titles are i18n keys rather than literals so they can be translated and
 * gendered (Knight/Dame, Lord/Lady, King/Queen).
 */

import { cumulativeXpForLevel } from './xp';

export interface RankDef {
  /** 1-based rank index, also used in i18n keys. */
  rank: number;
  minLevel: number;
  /** Null for the final rank, which is open-ended. */
  maxLevel: number | null;
  /** i18n key prefix: `rank.<id>.title.<gender>`. */
  id: string;
}

export const RANKS: readonly RankDef[] = [
  { rank: 1, minLevel: 1, maxLevel: 4, id: 'peasant' },
  { rank: 2, minLevel: 5, maxLevel: 9, id: 'squire' },
  { rank: 3, minLevel: 10, maxLevel: 19, id: 'knight' },
  { rank: 4, minLevel: 20, maxLevel: 29, id: 'captain' },
  { rank: 5, minLevel: 30, maxLevel: 44, id: 'noble' },
  { rank: 6, minLevel: 45, maxLevel: null, id: 'monarch' },
] as const;

export const MAX_RANK = RANKS.length;

export function rankForLevel(level: number): RankDef {
  const clamped = Math.max(1, Math.floor(level));
  // Walk from the top so the open-ended final rank catches everything above it.
  for (let i = RANKS.length - 1; i >= 0; i -= 1) {
    const def = RANKS[i];
    if (def && clamped >= def.minLevel) return def;
  }
  // RANKS[0].minLevel is 1 and level is clamped to >= 1, so this is unreachable.
  return RANKS[0] as RankDef;
}

export function rankNumberForLevel(level: number): number {
  return rankForLevel(level).rank;
}

export function rankById(id: string): RankDef | undefined {
  return RANKS.find((r) => r.id === id);
}

/** The rank above the hero's current one, or null at the top of the ladder. */
export function nextRank(level: number): RankDef | null {
  const current = rankForLevel(level);
  return RANKS.find((r) => r.rank === current.rank + 1) ?? null;
}

/** Levels remaining until promotion, or null when already at the final rank. */
export function levelsToNextRank(level: number): number | null {
  const next = nextRank(level);
  if (!next) return null;
  return Math.max(0, next.minLevel - Math.max(1, Math.floor(level)));
}

/** True when moving from `before` to `after` crosses up into a new rank. */
export function isPromotion(before: number, after: number): boolean {
  return rankNumberForLevel(after) > rankNumberForLevel(before);
}

/** True when moving from `before` to `after` drops into a lower rank. */
export function isDemotion(before: number, after: number): boolean {
  return rankNumberForLevel(after) < rankNumberForLevel(before);
}

/** Total XP, from a standing start, needed to reach a rank. Used by the README. */
export function cumulativeXpForRank(rank: number): number {
  const def = RANKS.find((r) => r.rank === rank);
  if (!def) return 0;
  return cumulativeXpForLevel(def.minLevel);
}
