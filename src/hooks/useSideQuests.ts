import { useMemo } from 'react';
import { SIDE_QUEST_REWARD } from '@/engine/constants';
import { sideQuestsForDay, type SideQuestDef } from '@/engine/sideQuests';
import { currentDayKey } from '@/services/clock';
import { sideQuestsDoneOn, useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';

export interface TodaySideQuest extends SideQuestDef {
  completed: boolean;
}

export interface TodaySideQuests {
  quests: TodaySideQuest[];
  reward: { xp: number; gold: number };
}

/** Today's rotating side quests, annotated with what's already done. */
export function useSideQuests(): TodaySideQuests {
  const progress = useGameStore((state) => state.sideQuests);
  const dayStartHour = useSettingsStore((state) => state.dayStartHour);
  // Subscribed so dev time travel rotates the board immediately.
  const devDayOffset = useGameStore((state) => state.devDayOffset);

  const dayKey = currentDayKey(dayStartHour, devDayOffset);

  return useMemo(() => {
    const done = new Set(sideQuestsDoneOn(progress, dayKey));
    return {
      quests: sideQuestsForDay(dayKey).map((quest) => ({
        ...quest,
        completed: done.has(quest.id),
      })),
      reward: SIDE_QUEST_REWARD,
    };
  }, [progress, dayKey]);
}
