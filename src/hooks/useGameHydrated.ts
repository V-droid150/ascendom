import { useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSyncStore } from '@/store/syncStore';

/** The slice of Zustand's persist API this hook needs. */
interface Persisted {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

/**
 * Whether a persisted store has finished loading from storage.
 *
 * Storage is async, so on a cold start a store briefly holds its empty initial
 * state. Anything that branches on saved data — "does this player have a hero",
 * "which account did this device last sync with" — must wait for this. During
 * the static web export nothing has loaded, hence the `false` server snapshot.
 */
export function useHydrated(store: Persisted): boolean {
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}

export function useGameHydrated(): boolean {
  return useHydrated(useGameStore);
}

export function useSyncHydrated(): boolean {
  return useHydrated(useSyncStore);
}
