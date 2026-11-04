/**
 * Design tokens. Every size is a multiple of 4 so the UI stays on a pixel grid,
 * and no component may hardcode a colour, radius, or spacing value.
 */

export { PALETTE, paletteColor, THEMES } from './colors';
export type { ColorName, PaletteIndex, ThemeColors } from './colors';
export { makeStyles, useColors, useThemeMode } from './useTheme';

/** 4px grid. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Pixel art has no rounded corners. Borders are hard, shadows are offsets. */
export const border = {
  width: 2,
  widthThick: 4,
  radius: 0,
  shadowOffset: 2,
} as const;

export const fonts = {
  /** Press Start 2P: titles and numbers only — unreadable in long text. */
  display: 'PressStart2P_400Regular',
  body: 'PixelifySans_400Regular',
  bodyBold: 'PixelifySans_700Bold',
} as const;

/** Minimum body size is 14; display sizes stay small because the font is wide. */
export const fontSize = {
  display: 20,
  displaySm: 14,
  displayXs: 10,
  title: 18,
  body: 16,
  bodySm: 14,
  caption: 12,
} as const;

export const lineHeight = {
  display: 28,
  title: 24,
  body: 22,
  caption: 18,
} as const;

/** Every tappable element must be at least this big. */
export const MIN_TOUCH_SIZE = 44;

/** On wide screens the app is centred in a game window of this width. */
export const APP_MAX_WIDTH = 480;

/** Pixel games use stepped, snappy motion — never soft easing. */
export const duration = {
  instant: 80,
  fast: 160,
  normal: 280,
  slow: 520,
  idleFrame: 600,
  celebration: 1800,
} as const;

export const zIndex = {
  base: 0,
  panel: 10,
  fab: 20,
  toast: 30,
  modal: 40,
  celebration: 50,
} as const;
