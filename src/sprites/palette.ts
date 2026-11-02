/**
 * Sprite palette and the character ramps.
 *
 * Structural colours (outfits, weapons, UI) come straight from Sweetie 16 via
 * `src/theme/colors.ts`, addressed by hex digit in the layer art.
 *
 * Skin and hair are the exception. Sweetie 16 contains no skin tones at all —
 * its warmest colours are a gold and an orange — so forcing character ramps
 * into it produces either grey or sunburnt heroes. Instead each ramp below is a
 * small, hand-picked set that sits harmoniously against the Sweetie 16 night
 * palette, and a sprite picks one by index. This is the palette-swap mechanism:
 * there is one piece of art per body and per hairstyle, never one per colour.
 */

import { PALETTE } from '@/theme/colors';

export interface ColorRamp {
  /** i18n-independent id, used in dev tooling and persisted appearance. */
  id: string;
  base: string;
  shade: string;
  light: string;
}

export const SKIN_TONES: readonly ColorRamp[] = [
  { id: 'porcelain', base: '#ffdbb5', shade: '#e0a877', light: '#fff2e0' },
  { id: 'light', base: '#f0c091', shade: '#c98d5e', light: '#ffe3c4' },
  { id: 'tan', base: '#d79463', shade: '#a86b42', light: '#edb787' },
  { id: 'brown', base: '#a3663c', shade: '#7a4525', light: '#c4894f' },
  { id: 'deep', base: '#6b4226', shade: '#492c18', light: '#8c5c38' },
  { id: 'ebony', base: '#43291a', shade: '#2a1710', light: '#5e3c26' },
] as const;

export const HAIR_COLORS: readonly ColorRamp[] = [
  { id: 'raven', base: '#2b2f45', shade: '#1a1c2c', light: '#3d4260' },
  { id: 'chestnut', base: '#6b4226', shade: '#492c18', light: '#8c5c38' },
  { id: 'blonde', base: PALETTE[4], shade: '#d79e4a', light: '#ffe3a8' },
  { id: 'auburn', base: PALETTE[2], shade: '#7a2638', light: PALETTE[3] },
  { id: 'silver', base: PALETTE[12], shade: PALETTE[13], light: '#ffffff' },
  { id: 'azure', base: PALETTE[10], shade: PALETTE[9], light: PALETTE[11] },
  { id: 'rose', base: '#ff6ba8', shade: '#c94a7d', light: '#ffa3c8' },
  { id: 'moss', base: PALETTE[5], shade: PALETTE[6], light: '#c8ff9e' },
] as const;

export const SKIN_TONE_COUNT = SKIN_TONES.length;
export const HAIR_COLOR_COUNT = HAIR_COLORS.length;

/** Wraps out-of-range indices so a bad saved value can never crash a render. */
export function skinTone(index: number): ColorRamp {
  const ramp = SKIN_TONES[((index % SKIN_TONE_COUNT) + SKIN_TONE_COUNT) % SKIN_TONE_COUNT];
  return ramp ?? (SKIN_TONES[0] as ColorRamp);
}

export function hairColor(index: number): ColorRamp {
  const ramp = HAIR_COLORS[((index % HAIR_COLOR_COUNT) + HAIR_COLOR_COUNT) % HAIR_COLOR_COUNT];
  return ramp ?? (HAIR_COLORS[0] as ColorRamp);
}

/**
 * Characters used in layer art.
 *
 * - `.`          transparent
 * - `0`-`9`,`A`-`F`  a Sweetie 16 index, written as a hex digit
 * - `s` `S` `l`  skin base / shade / light  (swapped per hero)
 * - `r` `R` `L`  hair base / shade / light  (swapped per hero)
 * - `c` `C`      cosmetic colour base / shade (equipped cape or tint)
 */
export const TRANSPARENT = '.';

const HEX = '0123456789ABCDEF';
const SEMANTIC = 'sSlrRLcC';

export const VALID_SPRITE_CHARS = `${TRANSPARENT}${HEX}${SEMANTIC}`;

/** Darkens a #rrggbb colour by a 0..1 fraction. Used to derive shade ramps. */
export function darken(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;

  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16);
    return Math.max(0, Math.round(value * (1 - amount)));
  });

  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export interface SwapContext {
  skin: ColorRamp;
  hair: ColorRamp;
  /** Equipped cosmetic colour, if any. Falls back to the hair ramp's base. */
  cosmetic?: { base: string; shade: string };
}

/** Resolves one art character to a concrete CSS colour, or null if transparent. */
export function resolveChar(char: string, ctx: SwapContext): string | null {
  if (char === TRANSPARENT) return null;

  switch (char) {
    case 's':
      return ctx.skin.base;
    case 'S':
      return ctx.skin.shade;
    case 'l':
      return ctx.skin.light;
    case 'r':
      return ctx.hair.base;
    case 'R':
      return ctx.hair.shade;
    case 'L':
      return ctx.hair.light;
    case 'c':
      return ctx.cosmetic?.base ?? PALETTE[2];
    case 'C':
      return ctx.cosmetic?.shade ?? '#7a2638';
    default: {
      const index = HEX.indexOf(char.toUpperCase());
      return index >= 0 ? (PALETTE[index] ?? null) : null;
    }
  }
}
