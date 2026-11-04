import { create } from 'zustand';
import { createJSONStorage } from './persistAdapter';
import { persist } from 'zustand/middleware';
import { MAX_REST_DAYS } from '@/engine/constants';
import { defaultSettings, setRestDays as applyRestDays } from '@/engine/hero';
import { setLanguage as applyLanguage } from '@/i18n';
import type { Language, Settings, ThemeMode } from '@/types';

interface SettingsActions {
  setLanguage: (language: Language) => void;
  setDayStartHour: (hour: number) => void;
  setRestDay: (weekday: number | null) => void;
  setSoundOn: (value: boolean) => void;
  setHapticsOn: (value: boolean) => void;
  setNotificationsOn: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  replaceAll: (settings: Settings) => void;
  reset: () => void;
}

export type SettingsStore = Settings & SettingsActions;

export const SETTINGS_STORAGE_KEY = 'ascendom:settings:v1';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings(),

      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },

      // Clamped rather than validated-and-rejected: a slider can't produce an
      // invalid hour, and a corrupt persisted value shouldn't break the day.
      setDayStartHour: (hour) => set({ dayStartHour: Math.min(23, Math.max(0, Math.floor(hour))) }),

      setRestDay: (weekday) =>
        set((state) => applyRestDays(state, weekday === null ? [] : [weekday], MAX_REST_DAYS)),

      setSoundOn: (soundOn) => set({ soundOn }),
      setHapticsOn: (hapticsOn) => set({ hapticsOn }),
      setNotificationsOn: (notificationsOn) => set({ notificationsOn }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setTheme: (theme) => set({ theme }),

      replaceAll: (settings) => {
        applyLanguage(settings.language);
        set(settings);
      },

      reset: () => set(defaultSettings()),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      // Typed to the partialized shape: only the plain Settings fields are
      // written, never the action functions.
      storage: createJSONStorage<Settings>(),
      version: 2,
      partialize: (state): Settings => ({
        language: state.language,
        dayStartHour: state.dayStartHour,
        soundOn: state.soundOn,
        hapticsOn: state.hapticsOn,
        notificationsOn: state.notificationsOn,
        reduceMotion: state.reduceMotion,
        theme: state.theme,
        restDays: state.restDays,
      }),
      migrate: (persisted, version): Settings => {
        // v0 had no reduceMotion flag and v1 had no theme; default the missing
        // fields rather than dropping the save.
        if (version < 2) {
          return { ...defaultSettings(), ...(persisted as Partial<Settings>) };
        }
        return persisted as Settings;
      },
    },
  ),
);

/** Settings as a plain object, for passing into the engine. */
export function settingsSnapshot(): Settings {
  const state = useSettingsStore.getState();
  return {
    language: state.language,
    dayStartHour: state.dayStartHour,
    soundOn: state.soundOn,
    hapticsOn: state.hapticsOn,
    notificationsOn: state.notificationsOn,
    reduceMotion: state.reduceMotion,
    theme: state.theme,
    restDays: state.restDays,
  };
}
