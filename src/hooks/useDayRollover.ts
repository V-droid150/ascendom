import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useGameStore } from '@/store/gameStore';

/**
 * Settles missed days on launch and whenever the app comes back to the
 * foreground.
 *
 * Foreground matters as much as launch: a user who leaves the app open
 * overnight would otherwise never have yesterday evaluated.
 */
export function useDayRollover(): void {
  const runRollover = useGameStore((state) => state.runRollover);
  const onboarded = useGameStore((state) => state.onboarded);
  const lastRunKey = useRef<string | null>(null);

  useEffect(() => {
    if (!onboarded) return;

    const runIfNewDay = (): void => {
      const key = useGameStore.getState().todayKey();
      if (lastRunKey.current === key) return;
      lastRunKey.current = key;
      runRollover();
    };

    runIfNewDay();

    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') runIfNewDay();
    });

    return () => subscription.remove();
  }, [onboarded, runRollover]);
}
