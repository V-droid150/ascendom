/**
 * The game store.
 *
 * One store holds hero, habits, logs, chronicle and kingdom rather than four
 * separate ones, because almost every interesting action spans several of them
 * at once: completing a quest writes a log, mutates the habit's streak, awards
 * the hero, damages the weekly boss and may unlock a companion. Splitting those
 * across stores would mean a sequence of independent `set` calls, any one of
 * which could fail or re-render halfway through a logically atomic change.
 *
 * Settings live separately (`settingsStore`) because they are read everywhere
 * and never participate in a game transaction.
 *
 * Note the division of labour: this store decides *when* and persists *what*,
 * but every rule — how much XP, whether a fall happens, which day broke a
 * streak — comes from `src/engine`.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  bossForToday,
  build as buildInKingdom,
  buyCosmetic as engineBuyCosmetic,
  buyPotion as engineBuyPotion,
  buyShield as engineBuyShield,
  claimBossReward,
  completeHabit as engineComplete,
  completeSideQuest as engineCompleteSide,
  createHero as engineCreateHero,
  emptyKingdom,
  equipCosmetic as engineEquip,
  equipLoadout,
  evaluateMissedDays,
  grantCompanions,
  hitBoss,
  isCompletedOn,
  logBadHabit as engineLogBad,
  newlyUnlockedCompanions,
  pruneLogs,
  rankForLevel,
  removeLog,
  renameHero,
  restyleHero,
  sideQuestById,
  sideQuestsForDay,
  undoCompletion as engineUndo,
  undoSideQuest as engineUndoSide,
  unequipCosmetic as engineUnequip,
  type BuildResult,
  type PurchaseResult,
} from '@/engine';
import { HERO_NAME_MAX_LENGTH } from '@/engine/constants';
import { bestStreakAcross, companionDef } from '@/engine/kingdom';
import { currentDayKey, nowIso } from '@/services/clock';
import { createId } from '@/utils/id';
import { settingsSnapshot, useSettingsStore } from './settingsStore';
import { createJSONStorage } from './persistAdapter';
import type { Celebration, ExportBundle, GameSnapshot } from './types';
import type {
  Appearance,
  BuildingId,
  DayResult,
  Gender,
  Habit,
  HabitLog,
  Hero,
  KingdomState,
  SideQuestProgress,
} from '@/types';

/** Chronicle length shown on the Hero screen; older entries are dropped. */
const CHRONICLE_LIMIT = 90;

export interface CreateHeroInput {
  name: string;
  gender: Gender;
  appearance: Appearance;
}

export type HabitDraft = Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'archived' | 'createdAt'>;

export type CompleteOutcome =
  | { ok: true; xp: number; gold: number; multiplier: number }
  | { ok: false; reason: 'already_completed' | 'no_hero' | 'not_found' };

export type UndoOutcome = { ok: true } | { ok: false; reason: 'not_completed' | 'no_hero' };

export type SideQuestOutcome =
  | { ok: true; xp: number; gold: number }
  | { ok: false; reason: 'no_hero' | 'not_offered_today' | 'already_completed' };

interface GameState extends GameSnapshot {
  /** Dev-only calendar offset in days, used by the time-travel button. */
  devDayOffset: number;
  celebrations: Celebration[];
}

interface GameActions {
  todayKey: () => string;

  createHero: (input: CreateHeroInput) => void;
  restyle: (changes: { gender?: Gender; appearance?: Partial<Appearance> }) => void;
  rename: (name: string) => { ok: boolean };

  addHabit: (draft: HabitDraft) => Habit;
  updateHabit: (id: string, changes: Partial<HabitDraft>) => void;
  setArchived: (id: string, archived: boolean) => void;
  deleteHabit: (id: string) => void;

  complete: (habitId: string) => CompleteOutcome;
  undo: (habitId: string) => UndoOutcome;
  logBad: (habitId: string) => { ok: boolean; damage: number; fell: boolean };

  completeSide: (questId: string) => SideQuestOutcome;
  undoSide: (questId: string) => UndoOutcome;

  runRollover: () => void;

  buyShield: () => PurchaseResult;
  buyPotion: () => PurchaseResult;
  buyCosmetic: (id: string) => PurchaseResult;
  equipCosmetic: (id: string) => void;
  unequipCosmetic: (id: string) => void;
  /** Wears exactly these cosmetics (the wardrobe's save). */
  setLoadout: (ids: readonly string[]) => void;

  buildBuilding: (id: BuildingId) => BuildResult;
  claimBoss: () => { gold: number };

  pushCelebration: (celebration: Celebration) => void;
  dismissCelebration: () => void;

  setDevDayOffset: (days: number) => void;

  exportBundle: () => ExportBundle;
  importBundle: (raw: string) => { ok: true } | { ok: false; reason: string };
  reset: () => void;
}

export type GameStore = GameState & GameActions;

/**
 * What actually reaches storage. Celebrations are excluded on purpose: a queued
 * level-up banner should not reappear days later on a cold start.
 */
export type PersistedGame = Omit<GameState, 'celebrations'>;

export const GAME_STORAGE_KEY = 'ascendom:game:v1';

const initialState: GameState = {
  hero: null,
  habits: [],
  logs: [],
  dayResults: [],
  kingdom: emptyKingdom(),
  sideQuests: emptySideQuests(),
  onboarded: false,
  devDayOffset: 0,
  celebrations: [],
};

function emptySideQuests(): SideQuestProgress {
  return { dayKey: '', completed: [] };
}

/** Side quests done today; yesterday's progress reads as nothing done. */
export function sideQuestsDoneOn(progress: SideQuestProgress, dayKey: string): string[] {
  return progress.dayKey === dayKey ? progress.completed : [];
}

/** Keeps the chronicle bounded and ordered oldest-first. */
function mergeDayResults(existing: DayResult[], incoming: DayResult[]): DayResult[] {
  if (incoming.length === 0) return existing;

  const byKey = new Map(existing.map((result) => [result.dayKey, result]));
  for (const result of incoming) byKey.set(result.dayKey, result);

  return [...byKey.values()].sort((a, b) => (a.dayKey < b.dayKey ? -1 : 1)).slice(-CHRONICLE_LIMIT);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      todayKey: () => currentDayKey(useSettingsStore.getState().dayStartHour, get().devDayOffset),

      // --- Hero ---------------------------------------------------------

      createHero: (input) => {
        const todayKey = get().todayKey();
        set({
          hero: engineCreateHero({
            id: createId('hero'),
            name: input.name.slice(0, HERO_NAME_MAX_LENGTH),
            gender: input.gender,
            appearance: input.appearance,
            todayKey,
            now: nowIso(get().devDayOffset),
          }),
          onboarded: true,
        });
      },

      restyle: (changes) => {
        const { hero } = get();
        if (!hero) return;
        set({ hero: restyleHero(hero, changes) });
      },

      rename: (name) => {
        const { hero } = get();
        if (!hero) return { ok: false };
        const result = renameHero(hero, name);
        if (result.ok) set({ hero: result.hero });
        return { ok: result.ok };
      },

      // --- Habits -------------------------------------------------------

      addHabit: (draft) => {
        const habit: Habit = {
          ...draft,
          id: createId('habit'),
          streak: 0,
          bestStreak: 0,
          archived: false,
          createdAt: nowIso(get().devDayOffset),
        };
        set((state) => ({ habits: [...state.habits, habit] }));
        return habit;
      },

      updateHabit: (id, changes) =>
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)),
        })),

      setArchived: (id, archived) =>
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? { ...habit, archived } : habit)),
        })),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
          logs: state.logs.filter((log) => log.habitId !== id),
        })),

      // --- The core loop ------------------------------------------------

      complete: (habitId) => {
        const state = get();
        const { hero } = state;
        if (!hero) return { ok: false, reason: 'no_hero' };

        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return { ok: false, reason: 'not_found' };

        const dayKey = state.todayKey();
        if (isCompletedOn(state.logs, habitId, dayKey)) {
          return { ok: false, reason: 'already_completed' };
        }

        const result = engineComplete({
          hero,
          habit,
          dayKey,
          now: nowIso(state.devDayOffset),
        });

        // A completion also strikes the weekly boss.
        const boss = bossForToday(state.kingdom.boss, dayKey);
        const hit = hitBoss(boss, habit);

        let heroAfter = result.hero;
        let kingdom: KingdomState = { ...state.kingdom, boss: hit.boss };
        const celebrations: Celebration[] = [];

        if (result.leveledUp) {
          celebrations.push({ kind: 'levelUp', level: heroAfter.level });
        }
        if (result.promoted) {
          celebrations.push({
            kind: 'rankUp',
            rankId: rankForLevel(heroAfter.level).id,
            level: heroAfter.level,
          });
        }

        if (hit.justDefeated) {
          const claim = claimBossReward(hit.boss, nowIso(state.devDayOffset));
          heroAfter = { ...heroAfter, gold: heroAfter.gold + claim.gold };
          kingdom = {
            ...kingdom,
            boss: claim.boss,
            trophies: claim.trophy ? [...kingdom.trophies, claim.trophy] : kingdom.trophies,
          };
          celebrations.push({ kind: 'bossDefeated', gold: claim.gold });
        }

        const habitsAfter = state.habits.map((h) => (h.id === habitId ? result.habit : h));

        const unlocked = newlyUnlockedCompanions(kingdom, habitsAfter);
        if (unlocked.length > 0) {
          kingdom = grantCompanions(kingdom, unlocked);
          for (const id of unlocked) {
            celebrations.push({
              kind: 'companion',
              id,
              days: companionDef(id)?.streakRequired ?? bestStreakAcross(habitsAfter),
            });
          }
        }

        set({
          hero: heroAfter,
          habits: habitsAfter,
          logs: [...state.logs, result.log],
          kingdom,
          celebrations: [...state.celebrations, ...celebrations],
        });

        return {
          ok: true,
          xp: result.reward.xp,
          gold: result.reward.gold,
          multiplier: result.reward.multiplier,
        };
      },

      undo: (habitId) => {
        const state = get();
        const { hero } = state;
        if (!hero) return { ok: false, reason: 'no_hero' };

        const dayKey = state.todayKey();
        const log = state.logs.find((l) => l.habitId === habitId && l.dayKey === dayKey);
        const habit = state.habits.find((h) => h.id === habitId);
        if (!log || !habit) return { ok: false, reason: 'not_completed' };

        const result = engineUndo({
          hero,
          habit,
          ...(log.hpRestored === undefined ? {} : { hpRestored: log.hpRestored }),
        });

        set({
          hero: result.hero,
          habits: state.habits.map((h) => (h.id === habitId ? result.habit : h)),
          logs: removeLog(state.logs, habitId, dayKey),
        });

        return { ok: true };
      },

      logBad: (habitId) => {
        const state = get();
        const { hero } = state;
        if (!hero) return { ok: false, damage: 0, fell: false };

        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return { ok: false, damage: 0, fell: false };

        const outcome = engineLogBad(hero, habit);
        const celebrations: Celebration[] = [...state.celebrations];

        if (outcome.fell) {
          celebrations.push({
            kind: 'fall',
            level: outcome.hero.level,
            demoted: outcome.demoted,
            rankId: rankForLevel(outcome.hero.level).id,
            goldLost: outcome.goldLost,
          });
        }

        set({ hero: outcome.hero, celebrations });

        return { ok: true, damage: outcome.damageApplied, fell: outcome.fell };
      },

      // --- Day rollover -------------------------------------------------

      runRollover: () => {
        const state = get();
        const { hero } = state;
        if (!hero) return;

        const todayKey = state.todayKey();

        const result = evaluateMissedDays({
          hero,
          habits: state.habits,
          logs: state.logs,
          settings: settingsSnapshot(),
          todayKey,
        });

        const celebrations: Celebration[] = [];

        if (result.forgivenDays > 0) {
          celebrations.push({ kind: 'welcomeBack', days: result.forgivenDays });
        }

        // Only the final fall of a catch-up window is announced; showing seven
        // fall screens in a row would be punishing rather than dramatic.
        const lastFall = [...result.dayResults].reverse().find((day) => day.fell);
        if (lastFall) {
          celebrations.push({
            kind: 'fall',
            level: result.hero.level,
            demoted: rankForLevel(lastFall.levelBefore).rank > rankForLevel(result.hero.level).rank,
            rankId: rankForLevel(result.hero.level).id,
            goldLost: result.dayResults.reduce((sum, day) => sum + day.goldLost, 0),
          });
        }

        // One-time quests don't survive the day they were finished.
        const staleOneTime = new Set(
          state.habits
            .filter(
              (habit) =>
                habit.type === 'quest' &&
                !habit.archived &&
                state.logs.some((log) => log.habitId === habit.id && log.dayKey < todayKey),
            )
            .map((habit) => habit.id),
        );

        // Nothing to settle: leave the state alone, or every call would look
        // like an edit and send the same save to the cloud again.
        const logs = pruneLogs(state.logs, todayKey);

        if (
          result.dayResults.length === 0 &&
          result.forgivenDays === 0 &&
          staleOneTime.size === 0 &&
          logs === state.logs
        ) {
          return;
        }

        set({
          hero: result.hero,
          habits: result.habits.map((habit) =>
            staleOneTime.has(habit.id) ? { ...habit, archived: true } : habit,
          ),
          logs,
          dayResults: mergeDayResults(state.dayResults, result.dayResults),
          celebrations: [...state.celebrations, ...celebrations],
        });
      },

      // --- Side quests --------------------------------------------------

      completeSide: (questId) => {
        const state = get();
        const { hero } = state;
        if (!hero) return { ok: false, reason: 'no_hero' };

        const dayKey = state.todayKey();
        const offered = sideQuestsForDay(dayKey).some((quest) => quest.id === questId);
        const quest = sideQuestById(questId);
        if (!offered || !quest) return { ok: false, reason: 'not_offered_today' };

        const done = sideQuestsDoneOn(state.sideQuests, dayKey);
        if (done.includes(questId)) return { ok: false, reason: 'already_completed' };

        const result = engineCompleteSide(hero, quest);
        const celebrations: Celebration[] = [];
        if (result.leveledUp) celebrations.push({ kind: 'levelUp', level: result.hero.level });
        if (result.promoted) {
          celebrations.push({
            kind: 'rankUp',
            rankId: rankForLevel(result.hero.level).id,
            level: result.hero.level,
          });
        }

        set({
          hero: result.hero,
          sideQuests: { dayKey, completed: [...done, questId] },
          celebrations: [...state.celebrations, ...celebrations],
        });

        return { ok: true, xp: result.xp, gold: result.gold };
      },

      undoSide: (questId) => {
        const state = get();
        const { hero } = state;
        if (!hero) return { ok: false, reason: 'no_hero' };

        const dayKey = state.todayKey();
        const done = sideQuestsDoneOn(state.sideQuests, dayKey);
        const quest = sideQuestById(questId);
        if (!quest || !done.includes(questId)) return { ok: false, reason: 'not_completed' };

        set({
          hero: engineUndoSide(hero, quest),
          sideQuests: { dayKey, completed: done.filter((id) => id !== questId) },
        });

        return { ok: true };
      },

      // --- Shop ---------------------------------------------------------

      buyShield: () => {
        const { hero } = get();
        if (!hero) return { ok: false, reason: 'unknown_item' };

        const result = engineBuyShield(hero);
        if (result.ok) set({ hero: result.hero });
        return result;
      },

      buyPotion: () => {
        const state = get();
        if (!state.hero) return { ok: false, reason: 'unknown_item' };

        const result = engineBuyPotion(state.hero, state.todayKey());
        if (result.ok) set({ hero: result.hero });
        return result;
      },

      buyCosmetic: (id) => {
        const { hero } = get();
        if (!hero) return { ok: false, reason: 'unknown_item' };

        const result = engineBuyCosmetic(hero, id);
        if (result.ok) set({ hero: engineEquip(result.hero, id) });
        return result;
      },

      equipCosmetic: (id) => {
        const { hero } = get();
        if (!hero) return;
        set({ hero: engineEquip(hero, id) });
      },

      unequipCosmetic: (id) => {
        const { hero } = get();
        if (!hero) return;
        set({ hero: engineUnequip(hero, id) });
      },

      setLoadout: (ids) => {
        const { hero } = get();
        if (!hero) return;
        set({ hero: equipLoadout(hero, ids) });
      },

      // --- Kingdom ------------------------------------------------------

      buildBuilding: (id) => {
        const state = get();
        if (!state.hero) return { ok: false, reason: 'unknown_building' };

        const result = buildInKingdom(state.hero, state.kingdom, id);
        if (result.ok) set({ hero: result.hero, kingdom: result.kingdom });
        return result;
      },

      claimBoss: () => {
        const state = get();
        const { hero, kingdom } = state;
        if (!hero || !kingdom.boss) return { gold: 0 };

        const claim = claimBossReward(kingdom.boss, nowIso(state.devDayOffset));
        if (claim.gold === 0 && !claim.trophy) return { gold: 0 };

        set({
          hero: { ...hero, gold: hero.gold + claim.gold },
          kingdom: {
            ...kingdom,
            boss: claim.boss,
            trophies: claim.trophy ? [...kingdom.trophies, claim.trophy] : kingdom.trophies,
          },
        });

        return { gold: claim.gold };
      },

      // --- Celebrations -------------------------------------------------

      pushCelebration: (celebration) =>
        set((state) => ({ celebrations: [...state.celebrations, celebration] })),

      dismissCelebration: () => set((state) => ({ celebrations: state.celebrations.slice(1) })),

      // --- Dev ----------------------------------------------------------

      setDevDayOffset: (days) => set({ devDayOffset: Math.max(0, Math.floor(days)) }),

      // --- Data ---------------------------------------------------------

      exportBundle: () => {
        const state = get();
        return {
          app: 'ascendom',
          version: 1,
          exportedAt: new Date().toISOString(),
          game: {
            hero: state.hero,
            habits: state.habits,
            logs: state.logs,
            dayResults: state.dayResults,
            kingdom: state.kingdom,
            sideQuests: state.sideQuests,
            onboarded: state.onboarded,
          },
          settings: settingsSnapshot(),
        };
      },

      importBundle: (raw) => {
        try {
          const parsed = JSON.parse(raw) as Partial<ExportBundle>;

          if (parsed.app !== 'ascendom' || !parsed.game) {
            return { ok: false, reason: 'not_an_ascendom_export' };
          }

          const game = parsed.game as Partial<GameSnapshot>;
          if (!Array.isArray(game.habits) || !Array.isArray(game.logs)) {
            return { ok: false, reason: 'malformed_game_data' };
          }

          set({
            hero: (game.hero as Hero | null) ?? null,
            habits: game.habits as Habit[],
            logs: game.logs as HabitLog[],
            dayResults: (game.dayResults as DayResult[]) ?? [],
            kingdom: (game.kingdom as KingdomState) ?? emptyKingdom(),
            sideQuests: (game.sideQuests as SideQuestProgress | undefined) ?? emptySideQuests(),
            onboarded: game.onboarded ?? Boolean(game.hero),
            celebrations: [],
          });

          if (parsed.settings) {
            useSettingsStore.getState().replaceAll({
              ...settingsSnapshot(),
              ...(parsed.settings as Record<string, never>),
            });
          }

          return { ok: true };
        } catch {
          return { ok: false, reason: 'invalid_json' };
        }
      },

      reset: () => set({ ...initialState, kingdom: emptyKingdom(), sideQuests: emptySideQuests() }),
    }),
    {
      name: GAME_STORAGE_KEY,
      storage: createJSONStorage<PersistedGame>(),
      version: 2,
      partialize: (state): PersistedGame => ({
        hero: state.hero,
        habits: state.habits,
        logs: state.logs,
        dayResults: state.dayResults,
        kingdom: state.kingdom,
        sideQuests: state.sideQuests,
        onboarded: state.onboarded,
        devDayOffset: state.devDayOffset,
      }),
      migrate: (persisted, version): PersistedGame => {
        // v0 predates versioning and v1 had no side quests: fill in whatever
        // the save is missing from the defaults rather than dropping it.
        if (version < 2) {
          const { celebrations: _ignored, ...base } = initialState;
          return { ...base, ...(persisted as Partial<PersistedGame>) };
        }
        return persisted as PersistedGame;
      },
    },
  ),
);
