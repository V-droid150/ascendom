/**
 * The six starter quests offered during onboarding.
 *
 * Product content rather than game rules, so it lives outside the engine. Each
 * maps to a different stat on purpose: a new hero who picks several of these
 * ends up with a visibly uneven stat chart on day one, which is what makes the
 * Hero screen interesting immediately.
 */

import type { QuestIconId } from '@/sprites/icons';
import type { Difficulty, StatKey } from '@/types';

export interface StarterQuest {
  /** Key under `onboarding.firstQuest.suggestions` in the locale files. */
  key: string;
  icon: QuestIconId;
  difficulty: Difficulty;
  stat: StatKey;
  schedule: number[];
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

export const STARTER_QUESTS: readonly StarterQuest[] = [
  { key: 'water', icon: 'water', difficulty: 'easy', stat: 'wisdom', schedule: EVERY_DAY },
  {
    key: 'exercise',
    icon: 'exercise',
    difficulty: 'medium',
    stat: 'strength',
    schedule: WEEKDAYS,
  },
  { key: 'read', icon: 'book', difficulty: 'medium', stat: 'intelligence', schedule: EVERY_DAY },
  { key: 'sleep', icon: 'sleep', difficulty: 'hard', stat: 'wisdom', schedule: EVERY_DAY },
  { key: 'walk', icon: 'walk', difficulty: 'medium', stat: 'strength', schedule: EVERY_DAY },
  {
    key: 'journal',
    icon: 'journal',
    difficulty: 'easy',
    stat: 'charisma',
    schedule: EVERY_DAY,
  },
] as const;
