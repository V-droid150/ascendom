/**
 * Sound effects, synthesised rather than bundled.
 *
 * Shipping four audio files would mean adding an audio dependency
 * (`expo-audio`) for a feature the brief marks optional. Instead the web build
 * synthesises the cues with the Web Audio API — square and triangle waves,
 * which is exactly what a chiptune SFX is anyway — and native is a no-op until
 * an audio library is approved.
 *
 * Documented in the README so the limitation is explicit rather than a mystery.
 */

import { Platform } from 'react-native';

export type SoundCue = 'coin' | 'levelUp' | 'rankUp' | 'fall' | 'tap';

interface Tone {
  frequency: number;
  duration: number;
  type: OscillatorType;
  /** Delay before this tone starts, in seconds. */
  at: number;
  gain: number;
}

/** Short arpeggios in place of sampled audio. */
const CUES: Record<SoundCue, Tone[]> = {
  tap: [{ frequency: 440, duration: 0.05, type: 'square', at: 0, gain: 0.05 }],
  coin: [
    { frequency: 988, duration: 0.06, type: 'square', at: 0, gain: 0.07 },
    { frequency: 1319, duration: 0.12, type: 'square', at: 0.06, gain: 0.07 },
  ],
  levelUp: [
    { frequency: 523, duration: 0.09, type: 'square', at: 0, gain: 0.07 },
    { frequency: 659, duration: 0.09, type: 'square', at: 0.09, gain: 0.07 },
    { frequency: 784, duration: 0.09, type: 'square', at: 0.18, gain: 0.07 },
    { frequency: 1047, duration: 0.18, type: 'square', at: 0.27, gain: 0.07 },
  ],
  rankUp: [
    { frequency: 392, duration: 0.12, type: 'triangle', at: 0, gain: 0.08 },
    { frequency: 523, duration: 0.12, type: 'triangle', at: 0.12, gain: 0.08 },
    { frequency: 659, duration: 0.12, type: 'triangle', at: 0.24, gain: 0.08 },
    { frequency: 784, duration: 0.14, type: 'triangle', at: 0.36, gain: 0.08 },
    { frequency: 1047, duration: 0.3, type: 'triangle', at: 0.5, gain: 0.09 },
  ],
  fall: [
    { frequency: 220, duration: 0.18, type: 'triangle', at: 0, gain: 0.09 },
    { frequency: 146, duration: 0.28, type: 'triangle', at: 0.18, gain: 0.09 },
    { frequency: 98, duration: 0.4, type: 'triangle', at: 0.46, gain: 0.09 },
  ],
};

type AudioContextCtor = new () => AudioContext;

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (context) return context;

  const globalWindow = globalThis as typeof globalThis & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };

  const Ctor = globalWindow.AudioContext ?? globalWindow.webkitAudioContext;
  if (!Ctor) return null;

  try {
    context = new Ctor();
    return context;
  } catch {
    return null;
  }
}

/** Plays a cue. Silently does nothing where Web Audio isn't available. */
export function playCue(cue: SoundCue): void {
  const ctx = audioContext();
  if (!ctx) return;

  // Browsers suspend the context until a user gesture; a tap will resume it.
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;

  for (const tone of CUES[cue]) {
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();

    oscillator.type = tone.type;
    oscillator.frequency.value = tone.frequency;

    const start = now + tone.at;
    const stop = start + tone.duration;

    amp.gain.setValueAtTime(tone.gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, stop);

    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(stop);
  }
}

export const SOUND_SUPPORTED = Platform.OS === 'web';
