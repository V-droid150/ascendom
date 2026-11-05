import { create } from 'zustand';
import type { Appearance, Gender } from '@/types';

/**
 * Draft state for the onboarding flow. Deliberately not persisted: a half-built
 * hero is not worth restoring, and starting over is a two-tap flow.
 */
interface OnboardingState {
  gender: Gender;
  appearance: Appearance;
  name: string;
  /** Keys from `onboarding.firstQuest.suggestions`. */
  selectedQuests: string[];
  setGender: (gender: Gender) => void;
  setAppearance: (changes: Partial<Appearance>) => void;
  setName: (name: string) => void;
  toggleQuest: (key: string) => void;
  reset: () => void;
}

const initial = {
  gender: 'male' as Gender,
  appearance: { skinTone: 1, hairStyle: 0, hairColor: 0 },
  name: '',
  selectedQuests: [] as string[],
};

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initial,

  // Both genders offer HAIR_STYLE_COUNT styles, so the picked index stays valid.
  setGender: (gender) => set({ gender }),

  setAppearance: (changes) => set((state) => ({ appearance: { ...state.appearance, ...changes } })),

  setName: (name) => set({ name: name.slice(0, 16) }),

  toggleQuest: (key) =>
    set((state) => ({
      selectedQuests: state.selectedQuests.includes(key)
        ? state.selectedQuests.filter((k) => k !== key)
        : [...state.selectedQuests, key],
    })),

  reset: () => set(initial),
}));

export { HERO_NAME_MAX_LENGTH } from '@/engine/constants';
