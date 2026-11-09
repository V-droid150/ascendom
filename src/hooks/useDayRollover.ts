import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { useSyncStore } from '@/store/syncStore';

/**
 * Settles missed days on launch and whenever the app comes back to the
 * foreground.
 *
 * Foreground matters as much as launch: a user who leaves the app open
 * overnight would otherwise never have yesterday evaluated.
 *
 * A signed-in device waits for its first sync. Otherwise a laptop that last
 * synced on Monday would open on Thursday, judge Tuesday and Wednesday as
 * missed (the phone played them, but this device hasn't seen that yet), and
 * deal damage or even a Fall before the newer save arrived. While a sync
 * conflict is open it waits too.
 */
export function useDayRollover(): void {
  const runRollover = useGameStore((state) => state.runRollover);
  const onboarded = useGameStore((state) => state.onboarded);
  const ready = useSyncStore(
    (state) =>
      state.sessionKnown &&
      (state.userId === null || state.initialSyncDone) &&
      // Which save is real is still undecided; judge days once the player picks.
      state.conflict === null,
  );
  const lastRunKey = useRef<string | null>(null);

  useEffect(() => {
    if (!onboarded || !ready) return;

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
  }, [onboarded, ready, runRollover]);
}
