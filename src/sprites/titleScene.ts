/**
 * The title screen backdrop: a fairy-tale castle above a cobbled courtyard,
 * filling the whole screen at any size.
 *
 * Painted from code like `landscape.ts`, but sized to the screen rather than
 * fixed: the caller passes the screen size in scene pixels and gets back a
 * grid exactly that big. Sky fills the top, the castle's spire stops at
 * `SPIRE_TOP` of the height so the logo always sits on plain sky, and the
 * courtyard (`TITLE_LANE_ROWS` deep) is where the NPCs walk.
 *
 * One piece of art, two palettes: night for the dark theme, day for the
 * light one. Deterministic, so every device and every test sees the same
 * castle for the same size.
 */

import { PALETTE } from '@/theme/colors';
import { NPC_HEIGHT } from './npcs';

/** Courtyard depth below the castle wall, in scene pixels. */
export const TITLE_LANE_ROWS = 16;

/** Rows below the wall where NPC feet land: one lane further back, one nearer. */
export const TITLE_NPC_LANES = { back: 5, front: 12 } as const;

/** The scene never paints smaller than this; tiny windows just crop it. */
const MIN_WIDTH = 64;
const MIN_HEIGHT = 120;

/** Fraction of the height above which only sky, stars and the moon appear. */
export const SPIRE_TOP = 0.36;

/** Sky band boundaries, as fractions of the height. */
const SKY_TOP_END = 0.5;
const SKY_MID_END = 0.7;

const WALL_HEIGHT = 22;
const GATE = { width: 16, height: 16 } as const;
const KEEP_WIDTH = 30;
const SPIRE_WIDTH = 10;
const SPIRE_ROOF = 14;
const TOWER_WIDTH = { outer: 14, inner: 12 } as const;

/** Scene pixels per screen pixel stay whole: 2 on tiny windows, 4 on tall ones. */
const MIN_SCALE = 2;
const MAX_SCALE = 4;
const PX_PER_SCALE_STEP = 220;

/** The integer pixel scale for a title screen this tall. */
export function titleSceneScaleFor(height: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.floor(height / PX_PER_SCALE_STEP)));
}

/**
 * Screen pixels at the bottom that the NPCs walk through, so the menu can sit
 * above them instead of over them.
 */
export function titleCourtyardClearance(height: number): number {
  const rows = TITLE_LANE_ROWS - TITLE_NPC_LANES.back + NPC_HEIGHT;
  return rows * titleSceneScaleFor(height);
}

export interface TitleScene {
  art: readonly string[];
  width: number;
  height: number;
  /** First courtyard row; the castle wall ends on the row above. */
  groundY: number;
}

type Canvas = string[][];

/** Cheap integer hash, so stars and house heights scatter without randomness. */
function hash(x: number, y: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function painter(canvas: Canvas, width: number) {
  const set = (x: number, y: number, char: string): void => {
    const line = canvas[y];
    if (!line || x < 0 || x >= width) return;
    line[x] = char;
  };
  const fill = (x0: number, y0: number, x1: number, y1: number, char: string): void => {
    for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) set(x, y, char);
  };
  /** Stone laid in 6x4 bricks, with a darker right edge for some depth. */
  const stone = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y <= y1; y += 1) {
      const course = Math.floor((y - y0) / 4);
      for (let x = x0; x <= x1; x += 1) {
        const mortar = (y - y0) % 4 === 3 || (x - x0 + (course % 2) * 3) % 6 === 0;
        set(x, y, x === x1 || mortar ? 'S' : 's');
      }
    }
  };
  /** Alternating 3-wide merlons sitting on top of `y`. */
  const battlements = (x0: number, x1: number, y: number): void => {
    for (let x = x0; x <= x1; x += 1) {
      if (Math.floor((x - x0) / 3) % 2 === 0) fill(x, y - 2, x, y - 1, x === x1 ? 'S' : 's');
    }
  };
  /** A pointed roof whose base row is `baseY`, lit on the left, shaded on the right. */
  const cone = (cx: number, baseY: number, baseWidth: number, height: number): void => {
    const half = baseWidth / 2;
    for (let i = 0; i < height; i += 1) {
      const reach = Math.round(((i + 1) / height) * half);
      const y = baseY - height + 1 + i;
      for (let dx = -reach; dx <= reach; dx += 1) set(cx + dx, y, dx > 0 ? 'N' : 'n');
    }
  };
  /** A pole on the roof's tip with a pennant streaming right. */
  const flag = (x: number, tipY: number): void => {
    fill(x, tipY - 6, x, tipY - 1, 'p');
    fill(x + 1, tipY - 6, x + 4, tipY - 6, 'f');
    fill(x + 1, tipY - 5, x + 3, tipY - 5, 'f');
    set(x + 1, tipY - 4, 'f');
  };
  return { set, fill, stone, battlements, cone, flag };
}

export function paintTitleScene(requestedWidth: number, requestedHeight: number): TitleScene {
  const width = Math.max(MIN_WIDTH, Math.round(requestedWidth));
  const height = Math.max(MIN_HEIGHT, Math.round(requestedHeight));
  const groundY = height - TITLE_LANE_ROWS;
  const canvas: Canvas = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => '.'),
  );
  const p = painter(canvas, width);

  // Sky: three bands with a checker-dithered seam, as on the Hero screen.
  const topEnd = Math.floor(height * SKY_TOP_END);
  const midEnd = Math.floor(height * SKY_MID_END);
  for (let y = 0; y < groundY; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let band = y < topEnd ? 'a' : y < midEnd ? 'b' : 'c';
      if ((y === topEnd || y === midEnd) && x % 2 === 0) band = y === topEnd ? 'a' : 'b';
      p.set(x, y, band);
    }
  }

  // Stars only in the top band, so in daylight they vanish into it.
  for (let y = 0; y < topEnd - 1; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const roll = hash(x, y) % 157;
      if (roll === 0) p.set(x, y, '*');
      else if (roll === 1 && hash(y, x) % 3 === 0 && x > 0 && x < width - 1 && y > 0) {
        p.set(x, y, '+');
        p.set(x - 1, y, '*');
        p.set(x + 1, y, '*');
        p.set(x, y - 1, '*');
        p.set(x, y + 1, '*');
      }
    }
  }

  // The moon (the sun by day), top right, clear of the centred logo.
  const moonX = width - 16;
  const moonY = 22;
  for (let dy = -6; dy <= 6; dy += 1) {
    for (let dx = -6; dx <= 6; dx += 1) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= 20)
        p.set(moonX + dx, moonY + dy, (dx + 2) * (dx + 2) + (dy - 1) ** 2 <= 3 ? 'j' : 'M');
      else if (d2 <= 34) p.set(moonX + dx, moonY + dy, 'm');
    }
  }

  // Clouds drift in the lower sky, below the logo.
  const cloud = (cx: number, cy: number): void => {
    p.fill(cx - 4, cy - 2, cx + 1, cy - 2, 'w');
    p.fill(cx - 7, cy - 1, cx + 5, cy - 1, 'w');
    p.fill(cx - 9, cy, cx + 8, cy, 'w');
    p.fill(cx - 8, cy + 1, cx + 7, cy + 1, 'v');
  };
  cloud(Math.round(width * 0.16), midEnd - 6);
  cloud(Math.round(width * 0.82), topEnd + 8);

  // Far mountains, then a dark treeline in front of them.
  for (let x = 0; x < width; x += 1) {
    const crest = groundY - 34 + Math.round(7 * Math.sin(x / 9) + 4 * Math.sin(x / 4.3 + 1));
    for (let y = crest; y < groundY; y += 1) p.set(x, y, y === crest ? 'H' : 'h');
    const trees = groundY - 12 + Math.round(2 * Math.sin(x / 5)) - (x % 4 === 1 ? 1 : 0);
    for (let y = trees; y < groundY; y += 1) p.set(x, y, y === trees ? 'T' : 't');
  }

  const cx = Math.floor(width / 2);
  const halfWall = Math.min(46, Math.max(28, Math.floor(width * 0.36)));
  const wallTop = groundY - WALL_HEIGHT;

  // Townhouses on both flanks, outside the castle wall.
  const house = (x0: number, w: number): void => {
    const h = 8 + (hash(x0, 7) % 5);
    const top = groundY - h;
    p.fill(x0, top, x0 + w - 1, groundY - 1, 'u');
    p.fill(x0, top, x0, groundY - 1, 'U');
    p.fill(x0 + w - 1, top, x0 + w - 1, groundY - 1, 'U');
    p.fill(x0 + 1, top + 3, x0 + 2, top + 4, 'y');
    p.fill(x0 + w - 3, top + 3, x0 + w - 2, top + 4, 'y');
    p.fill(x0 + Math.floor(w / 2) - 1, groundY - 4, x0 + Math.floor(w / 2), groundY - 1, 'U');
    const peak = Math.floor(w / 2) + 1;
    for (let i = 0; i < peak; i += 1) {
      p.fill(x0 + peak - 1 - i - 1, top - peak + i, x0 + w - peak + i + 1, top - peak + i, 'r');
      p.set(x0 + w - peak + i + 1, top - peak + i, 'R');
    }
  };
  for (let x = cx - halfWall - 12; x > -10; x -= 13) house(x, 10);
  for (let x = cx + halfWall + 3; x < width; x += 13) house(x, 10);

  // Castle heights, all measured from the spire's tip down to the wall.
  const spireTip = Math.floor(height * SPIRE_TOP);
  const span = wallTop - spireTip;
  const spireBodyTop = spireTip + SPIRE_ROOF;
  const keepTop = Math.max(spireBodyTop + 6, spireTip + Math.round(span * 0.3));
  const innerTip = spireTip + Math.round(span * 0.25);
  const outerTip = spireTip + Math.round(span * 0.42);

  const tower = (tx: number, tip: number, w: number): void => {
    const roof = Math.round(w * 0.9);
    const top = tip + roof;
    const half = Math.floor(w / 2);
    p.stone(tx - half, top, tx + half - 1, groundY - 1);
    p.cone(tx, top - 1, w + 2, roof);
    p.flag(tx, tip);
    for (let y = top + 4; y < wallTop - 3; y += 11) p.fill(tx - 1, y, tx, y + 2, 'y');
  };

  // The keep, back to front: body, spire, then the banner on its face.
  const keepHalf = KEEP_WIDTH / 2;
  p.stone(cx - keepHalf, keepTop, cx + keepHalf - 1, groundY - 1);
  p.battlements(cx - keepHalf, cx + keepHalf - 1, keepTop);
  const spireHalf = SPIRE_WIDTH / 2;
  p.stone(cx - spireHalf, spireBodyTop, cx + spireHalf - 1, keepTop - 1);
  p.cone(cx, spireBodyTop - 1, SPIRE_WIDTH + 2, SPIRE_ROOF);
  p.flag(cx, spireTip);
  p.fill(cx - 1, spireBodyTop + 4, cx, spireBodyTop + 7, 'y');
  for (let y = keepTop + 5; y < wallTop - 4; y += 10) {
    p.fill(cx - 11, y, cx - 9, y + 3, 'y');
    p.fill(cx + 8, y, cx + 10, y + 3, 'y');
  }
  const bannerTop = keepTop + 4;
  p.fill(cx - 4, bannerTop, cx + 3, bannerTop + 13, 'f');
  // Swallowtail notch at the hem.
  p.fill(cx - 1, bannerTop + 13, cx, bannerTop + 13, 's');
  p.fill(cx - 2, bannerTop + 4, cx + 1, bannerTop + 6, 'F');
  p.set(cx - 2, bannerTop + 3, 'F');
  p.set(cx + 1, bannerTop + 3, 'F');

  const innerOffset = Math.round(halfWall * 0.55);
  tower(cx - innerOffset, innerTip, TOWER_WIDTH.inner);
  tower(cx + innerOffset, innerTip, TOWER_WIDTH.inner);

  // Curtain wall with its battlements, then the outer towers in front.
  p.stone(cx - halfWall, wallTop, cx + halfWall, groundY - 1);
  p.battlements(cx - halfWall, cx + halfWall, wallTop);
  tower(cx - halfWall, outerTip, TOWER_WIDTH.outer);
  tower(cx + halfWall, outerTip, TOWER_WIDTH.outer);

  // An arched gate with the portcullis raised, and a torch on either side.
  const gateLeft = cx - GATE.width / 2;
  const gateRight = cx + GATE.width / 2 - 1;
  const gateTop = groundY - GATE.height;
  p.fill(gateLeft - 1, gateTop - 1, gateRight + 1, groundY - 1, 'd');
  p.fill(gateLeft, gateTop, gateRight, groundY - 1, 'g');
  for (let x = gateLeft; x <= gateRight; x += 3) p.fill(x, gateTop, x, gateTop + 3, 'G');
  p.fill(gateLeft, gateTop + 3, gateRight, gateTop + 3, 'G');
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [0, 1],
  ] as const) {
    p.set(gateLeft + dx, gateTop + dy, 's');
    p.set(gateRight - dx, gateTop + dy, 'S');
  }
  for (const torchX of [gateLeft - 4, gateRight + 4]) {
    p.fill(torchX, groundY - 9, torchX, groundY - 7, 'p');
    p.set(torchX, groundY - 10, 'O');
    p.set(torchX, groundY - 11, 'o');
  }

  // The courtyard: cobbles, with a strip of grass at the front edge.
  for (let y = groundY; y < height; y += 1) {
    const row = y - groundY;
    for (let x = 0; x < width; x += 1) {
      let char = row % 3 === 2 || (x + (Math.floor(row / 3) % 2) * 3) % 6 === 0 ? 'E' : 'e';
      if (row === 0) char = 'E';
      if (y >= height - 2) char = y === height - 2 && x % 3 === 0 ? 'Q' : 'q';
      p.set(x, y, char);
    }
  }

  return { art: canvas.map((line) => line.join('')), width, height, groundY };
}

/** Moonlit, with lit windows: the dark theme's title screen. */
export const TITLE_NIGHT_COLORS: Readonly<Record<string, string>> = {
  a: PALETTE[0], // sky, top: the logo sits here
  b: '#212a4a', // sky, middle
  c: PALETTE[8], // sky, horizon
  '*': PALETTE[12], // stars
  '+': PALETTE[11], // bright star core
  M: PALETTE[12], // moon
  m: PALETTE[13], // moon rim
  j: PALETTE[13], // moon crater
  w: '#2b3456', // cloud
  v: '#232a47', // cloud underside
  h: '#1c2440', // mountains
  H: '#2b3a63', // mountain crest
  t: '#14283a', // treeline
  T: '#1d3d4c', // treetops
  u: '#3a3f5c', // house walls
  U: '#262a40', // timber, doors
  r: PALETTE[1], // house roofs
  R: '#3f1c40', // roof shade
  y: PALETTE[4], // lit windows
  s: PALETTE[14], // castle stone
  S: PALETTE[15], // mortar, shaded stone
  d: '#22263a', // gate arch
  g: PALETTE[0], // gate passage
  G: '#3a3f56', // portcullis
  n: '#33418a', // tower roofs
  N: '#222c5a', // tower roof shade
  p: '#6b4226', // poles, torch holders
  f: PALETTE[2], // pennants, the royal banner
  F: PALETTE[4], // banner crown
  o: PALETTE[3], // torch flame
  O: PALETTE[4], // flame core
  e: '#2e3247', // cobbles
  E: '#1f2233', // cobble joints
  q: '#173a35', // grass
  Q: '#22574a', // grass blades
};

/** Bright midday: the light theme's title screen. */
export const TITLE_DAY_COLORS: Readonly<Record<string, string>> = {
  ...TITLE_NIGHT_COLORS,
  a: PALETTE[9],
  b: PALETTE[10],
  c: PALETTE[11],
  '*': PALETTE[9],
  '+': PALETTE[9],
  M: PALETTE[4],
  m: PALETTE[3],
  j: PALETTE[4],
  w: PALETTE[12],
  v: PALETTE[13],
  h: '#4b8fb8',
  H: '#6cb3d6',
  t: '#1d6b3c',
  T: PALETTE[6],
  u: '#e8d8a8',
  U: '#8a6d3b',
  r: PALETTE[2],
  R: '#7a2638',
  y: PALETTE[8],
  s: PALETTE[13],
  S: PALETTE[14],
  d: PALETTE[15],
  g: PALETTE[0],
  G: PALETTE[14],
  n: PALETTE[2],
  N: '#7a2638',
  f: PALETTE[4],
  F: PALETTE[2],
  e: '#c9b48a',
  E: '#9c8458',
  q: PALETTE[6],
  Q: PALETTE[5],
};
