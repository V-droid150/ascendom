/**
 * Sweetie 16 — a free, public pixel-art palette.
 * https://lospec.com/palette-list/sweetie-16
 *
 * Sprites index into PALETTE by position, so the order must never change.
 * Semantic names below are what the UI should use; raw hex belongs here only.
 */

export const PALETTE = [
  '#1a1c2c', // 0  near-black, the night sky
  '#5d275d', // 1  deep purple
  '#b13e53', // 2  blood red
  '#ef7d57', // 3  ember orange
  '#ffcd75', // 4  gold
  '#a7f070', // 5  bright green
  '#38b764', // 6  grass green
  '#257179', // 7  teal
  '#29366f', // 8  navy
  '#3b5dc9', // 9  royal blue
  '#41a6f6', // 10 sky blue
  '#73eff7', // 11 ice
  '#f4f4f4', // 12 bone white
  '#94b0c2', // 13 pale steel
  '#566c86', // 14 slate
  '#333c57', // 15 charcoal
] as const;

export type PaletteIndex = number;

export function paletteColor(index: PaletteIndex): string {
  return PALETTE[index] ?? PALETTE[12];
}

export const colors = {
  // Surfaces
  night: PALETTE[0],
  nightDeep: '#121322',
  charcoal: PALETTE[15],
  slate: PALETTE[14],
  steel: PALETTE[13],

  // Parchment panels hold all readable content.
  parchment: '#e8d8a8',
  parchmentDark: '#c9a86a',
  parchmentShadow: '#8a6d3b',

  // Accents
  gold: PALETTE[4],
  goldDark: '#c99b47',
  ember: PALETTE[3],

  // Game bars
  hp: PALETTE[2],
  hpDark: '#7a2638',
  xp: PALETTE[6],
  xpDark: '#1d6b3c',
  mana: PALETTE[10],

  // Text — contrast-checked against the surface each is used on.
  ink: '#2a1f14', // on parchment
  inkSoft: '#5a4730', // on parchment, secondary
  text: PALETTE[12], // on night
  textDim: PALETTE[13], // on night, secondary

  // Status
  success: PALETTE[6],
  danger: PALETTE[2],
  warning: PALETTE[4],
  info: PALETTE[10],

  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;
