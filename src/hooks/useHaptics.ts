import { useMemo } from 'react';
import { rawHaptics, type HapticsApi } from '@/services/haptics';
import { useSettingsStore } from '@/store/settingsStore';

const noop = (): void => {};

const SILENT: HapticsApi = {
  selection: noop,
  light: noop,
  medium: noop,
  heavy: noop,
  success: noop,
  warning: noop,
  error: noop,
};

/** Haptics gated on the user's setting, so components never check it. */
export function useHaptics(): HapticsApi {
  const enabled = useSettingsStore((state) => state.hapticsOn);
  return useMemo(() => (enabled ? rawHaptics : SILENT), [enabled]);
}
