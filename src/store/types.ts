import type { CompanionId, DayResult, Habit, HabitLog, Hero, KingdomState } from '@/types';

/**
 * Something worth interrupting the user for.
 *
 * Celebrations are queued by the store and drained by the UI rather than
 * triggered directly, because a single action can produce several at once — one
 * completion can level you up, promote you, defeat the weekly boss and unlock a
 * companion — and they have to be shown one after another.
 */
export type Celebration =
  | { kind: 'levelUp'; level: number }
  | { kind: 'rankUp'; rankId: string; level: number }
  | {
      kind: 'fall';
      level: number;
      demoted: boolean;
      rankId: string;
      goldLost: number;
    }
  | { kind: 'welcomeBack'; days: number }
  | { kind: 'companion'; id: CompanionId; days: number }
  | { kind: 'bossDefeated'; gold: number };

export interface GameSnapshot {
  hero: Hero | null;
  habits: Habit[];
  logs: HabitLog[];
  dayResults: DayResult[];
  kingdom: KingdomState;
  onboarded: boolean;
}

/** Shape of the JSON produced by export and accepted by import. */
export interface ExportBundle {
  app: 'ascendom';
  version: number;
  exportedAt: string;
  game: GameSnapshot;
  settings: unknown;
}
