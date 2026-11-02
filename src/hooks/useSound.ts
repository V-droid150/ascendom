import { useCallback } from 'react';
import { playCue, type SoundCue } from '@/services/sound';
import { useSettingsStore } from '@/store/settingsStore';

/** Sound gated on the user's setting. */
export function useSound(): (cue: SoundCue) => void {
  const enabled = useSettingsStore((state) => state.soundOn);

  return useCallback(
    (cue: SoundCue) => {
      if (enabled) playCue(cue);
    },
    [enabled],
  );
}
