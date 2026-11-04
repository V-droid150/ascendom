import { useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/gameStore';

/**
 * Whether the persisted game has finished loading from storage.
 *
 * Storage is async, so on a cold start the store briefly holds the empty
 * initial state. Anything that branches on "does this player have a hero yet"
 * must wait for this, or a returning player gets sent to character creation.
 * During the static web export nothing has loaded, hence the `false` snapshot.
 */
export function useGameHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGameStore.persist.onFinishHydration(onChange),
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );
}
