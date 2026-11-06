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

/**
 * Semantic colours, one set per theme. Both sets share every key so a component
 * never branches on the theme itself: it asks for `colors.text` and gets the
 * right ink for whichever surface is showing.
 *
 * Dark is the default arcade look on true black. Light is white with every
 * accent pulled darker so text and borders keep at least 4.5:1 against it.
 * Parchment panels and the Sweetie 16 sprite palette are the same in both.
 */
const darkColors = {
  // Surfaces
  night: '#000000',
  nightDeep: '#0d0e16',
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
  /** Label on a gold or mana fill. */
  onAccent: '#2a1f14',
  /** Label on an hp/danger fill. */
  onDanger: PALETTE[12],
  /** Translucent scrim behind modals and celebrations. */
  scrim: 'rgba(0, 0, 0, 0.82)',
  /** Hard 1px outline around pixel art, NES style. */
  outline: '#000000',
  /** Hard drop shadow behind the ASCENDOM title. */
  titleShadow: PALETTE[2],
  /**
   * The classic JRPG menu window: navy fill, white frame, white text. The
   * same in both themes on purpose; it is a game window, not page chrome.
   */
  windowFill: PALETTE[8],
  windowFrame: PALETTE[12],
  windowInner: PALETTE[9],
  windowText: PALETTE[12],
  windowTextDim: PALETTE[13],
  windowAccent: PALETTE[4],
  /** The menu window over the title castle: navy, letting a little stone through. */
  windowFillScene: 'rgba(41, 54, 111, 0.88)',
  /**
   * Logo and tagline over the title scene's top sky band: #1a1c2c by night,
   * #3b5dc9 by day. Gold clears 3:1 (large text) and white 4.5:1 on both.
   */
  sceneTitle: PALETTE[4],
  sceneText: PALETTE[12],
  sceneTextShadow: PALETTE[0],

  // Status
  success: PALETTE[6],
  danger: PALETTE[2],
  warning: PALETTE[4],
  info: PALETTE[10],

  transparent: 'transparent',
};

export type ThemeColors = Record<keyof typeof darkColors, string>;

const lightColors: ThemeColors = {
  night: '#ffffff',
  nightDeep: '#f1f2f5',
  charcoal: '#c9ced8',
  slate: '#8d97a8',
  steel: '#4a5468',

  parchment: '#f3e7c4',
  parchmentDark: '#d9bd85',
  parchmentShadow: '#8a6d3b',

  gold: '#8a5a00',
  goldDark: '#5e3d00',
  ember: '#b0421c',

  hp: '#b13e53',
  hpDark: '#7a2638',
  xp: '#22874a',
  xpDark: '#145a30',
  mana: '#1f6fb5',

  ink: '#2a1f14',
  inkSoft: '#5a4730',
  text: '#14161f',
  textDim: '#475066',
  onAccent: '#ffffff',
  onDanger: '#ffffff',
  scrim: 'rgba(255, 255, 255, 0.9)',
  outline: '#1a1c2c',
  titleShadow: '#e8d8a8',
  windowFill: PALETTE[8],
  windowFrame: '#1a1c2c',
  windowInner: PALETTE[9],
  windowText: PALETTE[12],
  windowTextDim: PALETTE[13],
  windowAccent: PALETTE[4],
  windowFillScene: 'rgba(41, 54, 111, 0.88)',
  sceneTitle: PALETTE[4],
  sceneText: PALETTE[12],
  sceneTextShadow: PALETTE[0],

  success: '#1d7a3e',
  danger: '#b13e53',
  warning: '#8a5a00',
  info: '#1f6fb5',

  transparent: 'transparent',
};

export const THEMES: Readonly<Record<'dark' | 'light', ThemeColors>> = {
  dark: darkColors,
  light: lightColors,
};

export type ColorName = keyof ThemeColors;
