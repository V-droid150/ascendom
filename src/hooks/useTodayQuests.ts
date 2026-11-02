import { useMemo } from 'react';
import { questsForDay } from '@/engine/dayRollover';
import { completedIdsOn } from '@/engine/logs';
import { currentDayKey } from '@/services/clock';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Habit } from '@/types';

export interface TodayQuests {
  dayKey: string;
  dailies: Habit[];
  oneTime: Habit[];
  bad: Habit[];
  completedIds: Set<string>;
  /** Scheduled dailies still outstanding — drives the evening reminder. */
  remainingCount: number;
  allDone: boolean;
  isEmpty: boolean;
}

/** Today's quest board, split by kind and annotated with what's already done. */
export function useTodayQuests(): TodayQuests {
  const habits = useGameStore((state) => state.habits);
  const logs = useGameStore((state) => state.logs);
  const dayStartHour = useSettingsStore((state) => state.dayStartHour);
  // Subscribed rather than read through `todayKey()` so that time travelling in
  // the dev settings re-renders the board instead of leaving it on stale a day.
  const devDayOffset = useGameStore((state) => state.devDayOffset);

  const dayKey = currentDayKey(dayStartHour, devDayOffset);

  return useMemo(() => {
    const { dailies, oneTime, bad } = questsForDay(habits, dayKey, dayStartHour);
    const completedIds = completedIdsOn(logs, dayKey);

    const remainingCount = dailies.filter((habit) => !completedIds.has(habit.id)).length;

    return {
      dayKey,
      dailies,
      oneTime,
      bad,
      completedIds,
      remainingCount,
      allDone: dailies.length > 0 && remainingCount === 0,
      isEmpty: dailies.length === 0 && oneTime.length === 0 && bad.length === 0,
    };
  }, [habits, logs, dayKey, dayStartHour]);
}
