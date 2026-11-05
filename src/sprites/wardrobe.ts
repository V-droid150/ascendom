/**
 * The royal wardrobe: the backdrop behind the hero while they change their look.
 *
 * Built like `landscape.ts`: a few pure painting steps (panelled wooden wall,
 * beam, floorboards, carpet, an open armoire, a gilded mirror, candles) frozen
 * into the shared `string[]` art format. Same 64x40 canvas and hero anchor as
 * the landscape, so the wardrobe and Hero screens frame the hero identically.
 *
 * The middle of the room is kept clear of furniture so the hero stands out.
 */

import { PALETTE } from '@/theme/colors';
import { LANDSCAPE_HEIGHT, LANDSCAPE_HERO_ANCHOR, LANDSCAPE_WIDTH } from './landscape';

export const WARDROBE_WIDTH = LANDSCAPE_WIDTH;
export const WARDROBE_HEIGHT = LANDSCAPE_HEIGHT;
export const WARDROBE_HERO_ANCHOR = LANDSCAPE_HERO_ANCHOR;

/** Row where the wall meets the floor. The hero's shadow lands on row 36. */
const FLOOR_Y = 31;
/** Top of the darker wainscot panelling on the lower wall. */
const WAINSCOT_Y = 21;
/** Plank width on the upper wall. */
const PLANK = 4;
/** Floorboard height. */
const BOARD = 3;

type Canvas = string[][];

function set(canvas: Canvas, x: number, y: number, char: string): void {
  const line = canvas[y];
  if (!line || x < 0 || x >= WARDROBE_WIDTH) return;
  line[x] = char;
}

function fill(canvas: Canvas, x0: number, y0: number, x1: number, y1: number, char: string): void {
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) set(canvas, x, y, char);
}

/** Stamps art at (x, y); transparent `.` cells leave the canvas untouched. */
function stamp(canvas: Canvas, art: readonly string[], x: number, y: number): void {
  art.forEach((line, dy) => {
    [...line].forEach((char, dx) => {
      if (char !== '.') set(canvas, x + dx, y + dy, char);
    });
  });
}

/** Vertical planks with dark seams, a ceiling beam and a gold picture rail. */
function paintWall(canvas: Canvas): void {
  for (let y = 0; y < FLOOR_Y; y += 1) {
    for (let x = 0; x < WARDROBE_WIDTH; x += 1) {
      const seam = x % PLANK === 0;
      // Every other plank is a shade lighter, and a knot breaks up the grain.
      const plank = Math.floor(x / PLANK) % 2 === 0 ? 'w' : 'v';
      set(canvas, x, y, seam ? 'k' : plank);
    }
  }

  // Knots in the grain, placed by a fixed pattern so the art is deterministic.
  for (let x = 2; x < WARDROBE_WIDTH; x += 7) set(canvas, x, 6 + ((x * 5) % 11), 'k');

  fill(canvas, 0, 0, WARDROBE_WIDTH - 1, 1, 'B');
  for (let x = 0; x < WARDROBE_WIDTH; x += 1) set(canvas, x, 2, x % 2 === 0 ? 'G' : 'g');

  // Wainscot: a gold rail, then dark recessed panels down to the skirting.
  for (let x = 0; x < WARDROBE_WIDTH; x += 1) set(canvas, x, WAINSCOT_Y, 'G');
  fill(canvas, 0, WAINSCOT_Y + 1, WARDROBE_WIDTH - 1, FLOOR_Y - 2, 'B');
  for (let x0 = 1; x0 < WARDROBE_WIDTH; x0 += 8) {
    fill(canvas, x0, WAINSCOT_Y + 2, x0 + 5, FLOOR_Y - 4, 'v');
    fill(canvas, x0, FLOOR_Y - 4, x0 + 5, FLOOR_Y - 4, 'k');
  }
  for (let x = 0; x < WARDROBE_WIDTH; x += 1) set(canvas, x, FLOOR_Y - 1, 'k');
}

/** Horizontal floorboards with staggered joints. */
function paintFloor(canvas: Canvas): void {
  for (let y = FLOOR_Y; y < WARDROBE_HEIGHT; y += 1) {
    const course = Math.floor((y - FLOOR_Y) / BOARD);
    const seamRow = (y - FLOOR_Y) % BOARD === BOARD - 1;
    for (let x = 0; x < WARDROBE_WIDTH; x += 1) {
      const joint = (x + course * 9) % 16 === 0;
      set(canvas, x, y, seamRow || joint ? 'b' : course % 2 === 0 ? 'f' : 'F');
    }
  }
}

/** A royal red runner under the hero, widening toward the viewer. */
function paintCarpet(canvas: Canvas): void {
  const centre = WARDROBE_HERO_ANCHOR.x + 16;
  for (let y = FLOOR_Y + 2; y < WARDROBE_HEIGHT; y += 1) {
    const half = 9 + Math.floor((y - FLOOR_Y - 2) / 2);
    for (let x = centre - half; x < centre + half; x += 1) {
      const edge = x === centre - half || x === centre + half - 1;
      const pattern = (x + y) % 4 === 0 && !edge;
      set(canvas, x, y, edge ? 'G' : pattern ? 'q' : 'p');
    }
  }
}

/** An open armoire with the royal wardrobe hanging inside. */
const ARMOIRE: readonly string[] = [
  '....GgGGGGgG....',
  '.BBBBBBBBBBBBBB.',
  'BGGGGGGGGGGGGGGB',
  'BkkkkkkkkkkkkkkB',
  'BkGGGGGGGGGGGGkB',
  'Bkk.g.kkg.kkg.kB',
  'Bk222k9999k666kB',
  'Bk2222999966666B',
  'Bk2422949966466B',
  'Bk2222999966666B',
  'Bk2222999966666B',
  'Bk2222999966666B',
  'Bk2222999966666B',
  'Bk2222k99k66666B',
  'Bk2222k99k66666B',
  'Bk1111k88k77777B',
  'BkkkkkkkkkkkkkkB',
  'BBBBBBBBBBBBBBBB',
  'BvvvvvvGGvvvvvvB',
  'BBBBBBBBBBBBBBBB',
  'BvvvvvvGGvvvvvvB',
  'BBBBBBBBBBBBBBBB',
  '.B............B.',
];

/** A tall standing mirror in a gilded frame. */
const MIRROR: readonly string[] = [
  '...gGGGGg...',
  '..gGiiiiGg..',
  '.gGiiWiiiGg.',
  '.GiiWiiiiiG.',
  '.GiWiiiiiiG.',
  '.GWiiiiiiiG.',
  '.GiiiiiiWiG.',
  '.GiiiiiWiiG.',
  '.GiiiiWiiiG.',
  '.GiiiWiiiiG.',
  '.GiiiiiiiiG.',
  '.GiiiiiiiiG.',
  '.gGiiiiiiGg.',
  '..gGGGGGGg..',
  '.....GG.....',
  '.....gg.....',
  '.....GG.....',
  '....gGGg....',
  '..gGGggGGg..',
];

/** A candle in a gold sconce, flame on top. */
const SCONCE: readonly string[] = ['.y.', 'yoy', '.W.', '.W.', 'GGG', '.g.'];

/** The royal crest hanging over the mirror: a gold crown on a red pennant. */
const PENNANT: readonly string[] = [
  'GGGGGGG',
  'pppppp.',
  'pGpGpGp',
  'pGGGGGp',
  'pGGGGGp',
  'ppppppp',
  'pp...pp',
  'p.....p',
];

function paintWardrobe(): string[] {
  const canvas: Canvas = Array.from({ length: WARDROBE_HEIGHT }, () =>
    Array.from({ length: WARDROBE_WIDTH }, () => '.'),
  );

  paintWall(canvas);
  paintFloor(canvas);
  paintCarpet(canvas);

  stamp(canvas, ARMOIRE, 1, 10);
  stamp(canvas, PENNANT, 49, 3);
  stamp(canvas, MIRROR, 47, 12);
  stamp(canvas, SCONCE, 20, 11);
  stamp(canvas, SCONCE, 41, 11);

  return canvas.map((line) => line.join(''));
}

export const WARDROBE_ART: readonly string[] = paintWardrobe();

export const WARDROBE_COLORS: Readonly<Record<string, string>> = {
  w: '#7a4a2a', // wall plank, lit
  v: '#6a3f24', // wall plank, shade; inset panels
  k: '#3d2414', // seams, shadows, armoire interior
  B: '#2b170c', // beam, wainscot, furniture frame
  f: '#8a5a32', // floorboard, lit
  F: '#7a4e2b', // floorboard, alternate
  b: '#4a2c17', // floorboard seam
  G: PALETTE[4], // gold trim
  g: '#c99b47', // gold, shade
  p: PALETTE[2], // royal red
  q: '#7a1f33', // red, pattern
  i: PALETTE[11], // mirror glass
  W: PALETTE[12], // glint, candle
  y: PALETTE[4], // flame
  o: PALETTE[3], // flame core
  '1': PALETTE[1], // garment hems
  '2': PALETTE[2], // red gown
  '4': PALETTE[4], // gold buttons
  '6': PALETTE[6], // green cloak
  '7': PALETTE[7],
  '8': PALETTE[8],
  '9': PALETTE[9], // blue tunic
};

/** Colours for the screen around the scene. Gold on the dark wood clears 10:1. */
export const WARDROBE_UI = {
  /** The room's darkest wood, so the screen below the scene continues the floor. */
  floor: '#2b170c',
  text: PALETTE[4],
} as const;
