/**
 * Kingdom building and companions (Phase 4).
 *
 * Buildings are a strict chain — hut, house, blacksmith, tower, castle — which
 * gives gold a long-term sink and the pixel map a visible growth story.
 * Companions unlock from streak milestones instead of gold, so they reward
 * consistency rather than grinding.
 */

import type { BuildingId, CompanionId, Habit, Hero, KingdomState } from '@/types';
import { BUILDINGS, COMPANIONS, type BuildingDef, type CompanionDef } from './constants';

export function buildingDef(id: BuildingId): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

/** The next building in the chain, or null when the castle is finished. */
export function nextBuilding(built: BuildingId[]): BuildingDef | null {
  return BUILDINGS.find((b) => !built.includes(b.id)) ?? null;
}

export type BuildFailure =
  'unknown_building' | 'already_built' | 'missing_prerequisite' | 'insufficient_gold';

export type BuildResult =
  | { ok: true; hero: Hero; kingdom: KingdomState; spent: number }
  | { ok: false; reason: BuildFailure };

export function build(hero: Hero, kingdom: KingdomState, id: BuildingId): BuildResult {
  const def = buildingDef(id);
  if (!def) return { ok: false, reason: 'unknown_building' };
  if (kingdom.buildings.includes(id)) return { ok: false, reason: 'already_built' };
  if (def.requires && !kingdom.buildings.includes(def.requires)) {
    return { ok: false, reason: 'missing_prerequisite' };
  }
  if (hero.gold < def.cost) return { ok: false, reason: 'insufficient_gold' };

  return {
    ok: true,
    spent: def.cost,
    hero: { ...hero, gold: hero.gold - def.cost },
    kingdom: { ...kingdom, buildings: [...kingdom.buildings, id] },
  };
}

export function companionDef(id: CompanionId): CompanionDef | undefined {
  return COMPANIONS.find((c) => c.id === id);
}

/** The best streak the hero has ever reached on any single habit. */
export function bestStreakAcross(habits: Habit[]): number {
  return habits.reduce((best, h) => Math.max(best, h.bestStreak), 0);
}

/** Companions earned by streak milestones that aren't collected yet. */
export function newlyUnlockedCompanions(kingdom: KingdomState, habits: Habit[]): CompanionId[] {
  const best = bestStreakAcross(habits);
  return COMPANIONS.filter(
    (c) => best >= c.streakRequired && !kingdom.companions.includes(c.id),
  ).map((c) => c.id);
}

export function grantCompanions(kingdom: KingdomState, ids: CompanionId[]): KingdomState {
  if (ids.length === 0) return kingdom;
  const merged = new Set([...kingdom.companions, ...ids]);
  return { ...kingdom, companions: [...merged] };
}

export function emptyKingdom(): KingdomState {
  return { buildings: [], companions: [], trophies: [], boss: null };
}
