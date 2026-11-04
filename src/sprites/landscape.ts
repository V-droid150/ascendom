/**
 * The Hero screen backdrop: a daytime 8-bit landscape the hero stands in.
 *
 * Generated rather than hand-typed: 40 rows of 64 characters is too easy to get
 * off by one, so the scene is painted with a handful of pure drawing steps
 * (sky bands, sun, clouds, mountains, hills, castles, grass) and frozen into
 * the same `string[]` format as every other piece of art. Deterministic: no
 * randomness, so the scene is identical on every device and in tests.
 *
 * The hero is drawn on top at the same pixel scale, so the sprite and the
 * scenery share one pixel grid. `LANDSCAPE_HERO_ANCHOR` is where the sprite's
 * 32x32 box goes: its ground shadow (row 28) lands on scene row 36.
 */

import { PALETTE } from '@/theme/colors';

export const LANDSCAPE_WIDTH = 64;
export const LANDSCAPE_HEIGHT = 40;

/** Top-left of the hero's 32x32 sprite box, in scene pixels. */
export const LANDSCAPE_HERO_ANCHOR = { x: 16, y: 8 } as const;

/** Row where the hills end and the meadow begins. */
const GROUND_Y = 29;

type Canvas = string[][];

function set(canvas: Canvas, x: number, y: number, char: string): void {
  const line = canvas[y];
  if (!line || x < 0 || x >= LANDSCAPE_WIDTH) return;
  line[x] = char;
}

/** Stamps art at (x, y); transparent `.` cells leave the canvas untouched. */
function stamp(canvas: Canvas, art: readonly string[], x: number, y: number): void {
  art.forEach((line, dy) => {
    [...line].forEach((char, dx) => {
      if (char !== '.') set(canvas, x + dx, y + dy, char);
    });
  });
}

function paintSky(canvas: Canvas): void {
  for (let y = 0; y < GROUND_Y; y += 1) {
    for (let x = 0; x < LANDSCAPE_WIDTH; x += 1) {
      // Three bands, lightening toward the horizon, with a one-row checker
      // dither at each seam — the NES way to fake a gradient.
      let band = y < 9 ? '1' : y < 18 ? '2' : '3';
      if ((y === 9 || y === 18) && x % 2 === 0) band = y === 9 ? '1' : '2';
      set(canvas, x, y, band);
    }
  }
}

/**
 * Stars in the upper sky. Drawn as their own character so the day palette can
 * hide them (same colour as the sky band) and the night palette can light them.
 */
const STARS: readonly (readonly [number, number])[] = [
  [3, 2],
  [11, 6],
  [17, 1],
  [22, 5],
  [30, 3],
  [35, 7],
  [44, 1],
  [47, 6],
  [61, 3],
  [63, 7],
  [58, 0],
];

function paintStars(canvas: Canvas): void {
  for (const [x, y] of STARS) set(canvas, x, y, 'x');
}

function paintSun(canvas: Canvas, cx: number, cy: number): void {
  for (let dy = -3; dy <= 3; dy += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= 4) set(canvas, cx + dx, cy + dy, 'y');
      else if (d2 <= 10) set(canvas, cx + dx, cy + dy, 'o');
    }
  }
}

const CLOUD: readonly string[] = ['..www...', '.wwwwww.', 'wwwwwwww', '.vvvvvv.'];

/** A 45-degree peak with a snow cap; the right face is in shade. */
function paintMountain(canvas: Canvas, peakX: number, peakY: number): void {
  for (let y = peakY; y < GROUND_Y; y += 1) {
    const half = y - peakY;
    for (let x = peakX - half; x <= peakX + half; x += 1) {
      const depth = y - peakY;
      const snow = depth < 2 || (depth === 2 && x % 2 === 0);
      set(canvas, x, y, snow ? 's' : x > peakX ? 'n' : 'm');
    }
  }
}

/** Rolling teal hills in front of the mountains. */
function paintHills(canvas: Canvas): void {
  for (let x = 0; x < LANDSCAPE_WIDTH; x += 1) {
    const top = 24 + Math.round(2 * Math.sin(x / 5));
    for (let y = top; y < GROUND_Y; y += 1) {
      set(canvas, x, y, y === top ? 'H' : 'h');
    }
  }
}

const CASTLE: readonly string[] = [
  '.f.......f.',
  '.C.......C.',
  '.r.......r.',
  'rrr.....rrr',
  'cCc.c.c.cCc',
  'cCcccccccCc',
  'cCckcccckCc',
  'cCcccccccCc',
  'cCccckcccCc',
  'cCcckkkccCc',
  'cCcckkkccCc',
];

const SMALL_CASTLE: readonly string[] = ['..f..', '..C..', '.rrr.', 'c.c.c', 'ccccc', 'cckcc'];

function paintMeadow(canvas: Canvas): void {
  for (let y = GROUND_Y; y < LANDSCAPE_HEIGHT; y += 1) {
    for (let x = 0; x < LANDSCAPE_WIDTH; x += 1) {
      let char = 'g';
      if (y === GROUND_Y) char = 'l';
      else if (y === GROUND_Y + 1) char = x % 2 === 0 ? 'l' : 'g';
      else if (y >= 36 && (x + y) % 2 === 0) char = 'd';
      set(canvas, x, y, char);
    }
  }

  // Grass blades poking up into the hills.
  for (let x = 1; x < LANDSCAPE_WIDTH; x += 4) set(canvas, x, GROUND_Y - 1, 'l');

  // A few flowers, kept clear of the hero standing in the middle.
  const flowers: [number, number, string][] = [
    [4, 33, 'y'],
    [9, 37, 'w'],
    [13, 32, 'r'],
    [50, 33, 'y'],
    [55, 37, 'r'],
    [60, 32, 'w'],
  ];
  for (const [x, y, char] of flowers) set(canvas, x, y, char);
}

function paintLandscape(): string[] {
  const canvas: Canvas = Array.from({ length: LANDSCAPE_HEIGHT }, () =>
    Array.from({ length: LANDSCAPE_WIDTH }, () => '.'),
  );

  paintSky(canvas);
  paintStars(canvas);
  paintSun(canvas, 54, 6);
  stamp(canvas, CLOUD, 6, 4);
  stamp(canvas, CLOUD, 41, 2);

  paintMountain(canvas, 9, 13);
  paintMountain(canvas, 24, 10);
  paintMountain(canvas, 41, 14);
  paintMountain(canvas, 58, 12);
  stamp(canvas, SMALL_CASTLE, 43, 15);

  paintHills(canvas);
  stamp(canvas, CASTLE, 2, 18);
  stamp(canvas, CASTLE, 51, 18);

  paintMeadow(canvas);

  return canvas.map((line) => line.join(''));
}

export const LANDSCAPE_ART: readonly string[] = paintLandscape();

export const LANDSCAPE_COLORS: Readonly<Record<string, string>> = {
  '1': PALETTE[9], // sky, top
  '2': PALETTE[10], // sky, middle
  '3': PALETTE[11], // sky, horizon
  x: PALETTE[9], // stars, hidden by day
  y: PALETTE[4], // sun
  o: PALETTE[3], // sun rim
  w: PALETTE[12], // cloud, flower
  v: PALETTE[13], // cloud underside
  m: PALETTE[14], // mountain, lit face
  n: PALETTE[15], // mountain, shaded face
  s: PALETTE[12], // snow
  H: PALETTE[6], // hill crest
  h: PALETTE[7], // hills
  c: PALETTE[13], // castle stone
  C: PALETTE[14], // castle shade, flagpole
  k: PALETTE[0], // windows and gates
  r: PALETTE[2], // roofs, red flowers
  f: PALETTE[4], // pennants
  g: PALETTE[6], // grass
  l: PALETTE[5], // grass highlight
  d: '#1d6b3c', // grass shade
};

/**
 * Night: the sky fades from true black at the top, so the scene melts into the
 * dark theme's background. The sun becomes a moon, the stars come out, and the
 * castle windows are lit.
 */
export const LANDSCAPE_NIGHT_COLORS: Readonly<Record<string, string>> = {
  ...LANDSCAPE_COLORS,
  '1': '#000000',
  '2': PALETTE[0],
  '3': PALETTE[8],
  x: PALETTE[12],
  y: PALETTE[12],
  o: PALETTE[13],
  w: PALETTE[14],
  v: PALETTE[15],
  m: PALETTE[15],
  n: '#20243a',
  s: PALETTE[13],
  H: PALETTE[7],
  h: '#1b4d52',
  c: PALETTE[14],
  C: PALETTE[15],
  k: PALETTE[4],
  r: '#7a2638',
  g: '#1d6b3c',
  l: PALETTE[6],
  d: '#0f3d23',
};

/** Bright day: the sky fades up to white so it melts into the light theme. */
export const LANDSCAPE_BRIGHT_COLORS: Readonly<Record<string, string>> = {
  ...LANDSCAPE_COLORS,
  '1': '#ffffff',
  '2': '#c9f7fb',
  '3': PALETTE[11],
  x: '#ffffff',
};
