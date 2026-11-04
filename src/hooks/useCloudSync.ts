import { useEffect } from 'react';
import { AppState } from 'react-native';
import { saveTimezone } from '@/services/cloudSave';
import { supabase } from '@/services/supabase';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSyncStore } from '@/store/syncStore';
import { noteLocalChange, syncNow } from '@/sync/controller';
import { useGameHydrated, useSyncHydrated } from './useGameHydrated';

/** Game fields that make up the save; celebrations and dev offsets are not progress. */
const SAVED_GAME_FIELDS = [
  'hero',
  'habits',
  'logs',
  'dayResults',
  'kingdom',
  'sideQuests',
  'onboarded',
] as const;

/**
 * Wires cloud sync into the app's lifetime: follows the login session, syncs
 * once the local save has loaded, uploads edits as they settle, and re-syncs
 * whenever the app comes back to the foreground.
 */
export function useCloudSync(): void {
  const gameHydrated = useGameHydrated();
  const syncHydrated = useSyncHydrated();
  const hydrated = gameHydrated && syncHydrated;
  const userId = useSyncStore((state) => state.userId);

  // Login session.
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      useSyncStore
        .getState()
        .setSession(user ? { userId: user.id, email: user.email ?? null } : null);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      useSyncStore
        .getState()
        .setSession(user ? { userId: user.id, email: user.email ?? null } : null);
      if (event === 'SIGNED_IN' && user) {
        // Best effort: a stale zone only shifts reminder times until the next login.
        saveTimezone(user.id, Intl.DateTimeFormat().resolvedOptions().timeZone).catch(() => {});
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // First sync once both the session and the local save are ready.
  useEffect(() => {
    if (hydrated && userId) void syncNow();
  }, [hydrated, userId]);

  // Local edits.
  useEffect(() => {
    if (!hydrated) return;
    const unsubscribeGame = useGameStore.subscribe((state, previous) => {
      if (SAVED_GAME_FIELDS.some((field) => state[field] !== previous[field])) noteLocalChange();
    });
    // Settings travel in the same save, so a theme or language change syncs too.
    // Its own rehydration from storage is not an edit, so that is ignored.
    const unsubscribeSettings = useSettingsStore.subscribe(() => {
      if (useSettingsStore.persist.hasHydrated()) noteLocalChange();
    });
    return () => {
      unsubscribeGame();
      unsubscribeSettings();
    };
  }, [hydrated]);

  // Coming back to the app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && useSyncStore.getState().userId) void syncNow();
    });
    return () => subscription.remove();
  }, []);
}
