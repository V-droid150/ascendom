/**
 * The title screen's moving sky: clouds drifting past at their own pace, a
 * small flock of birds by day, and now and then a shooting star by night.
 *
 * Pure and deterministic like the rest of the scene: positions come from the
 * scene size and a tick counter, so every device sees the same sky at the
 * same moment and tests can pin it down. Uses the scene palettes
 * (`TITLE_DAY_COLORS` / `TITLE_NIGHT_COLORS`): `w`/`v`/`W` for clouds, `B` for
 * birds, `*`/`+` for the shooting star.
 */

import { logoClearHalf, WIDE_SCENE_COLS, type TitleScene } from './titleScene';

/** Four cloud shapes, small to large: lit top `W`, body `w`, underside `v`. */
export const TITLE_CLOUD_ART: readonly (readonly string[])[] = [
  ['...WWWW....', '.WWwwwwWW..', 'wwwwwwwwwww', '.vvvvvvvvv.'],
  [
    '.....WWWW.........',
    '..WWWwwwwWW.WWW...',
    '.WwwwwwwwwwWwwwWW.',
    'wwwwwwwwwwwwwwwwww',
    '.vvvvvvvvvvvvvvvv.',
  ],
  [
    '........WWWWW..............',
    '....WWWWwwwwwWW...WWWW.....',
    '..WWwwwwwwwwwwwWWWwwwwWW...',
    '.Wwwwwwwwwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwwwwwwwwwwwwwwwwww',
    '.vvvvvvvvvvvvvvvvvvvvvvvvv.',
    '...vvvvvvvv...vvvvvvvvv....',
  ],
  [
    '..............WWWWWW..................',
    '.........WWWWWwwwwwwWW....WWWWW.......',
    '......WWWwwwwwwwwwwwwwWWWWwwwwwWW.....',
    '....WWwwwwwwwwwwwwwwwwwwwwwwwwwwwWW...',
    '..WWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwW..',
    '.Wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    '.vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv.',
    '...vvvvvvvvvv....vvvvvvvvvvvv..vvvv...',
  ],
];

/** A bird, wings up then wings level. */
export const TITLE_BIRD_ART: readonly (readonly string[])[] = [
  ['B...B', '.B.B.', '..B..'],
  ['.....', 'BB.BB', '..B..'],
];
export const BIRD_WIDTH = 5;

/** One cloud's place in the sky. Speeds are scene pixels per tick. */
export interface CloudSpec {
  shape: number;
  row: number;
  /** Where along its loop it starts, 0-1. */
  start: number;
  speed: number;
}

/** Cheap integer hash, the same mixing the scene painter uses. */
function hash(x: number, y: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** About one cloud per 60 scene pixels of width; phones keep two. */
export function cloudCount(sceneWidth: number): number {
  return Math.min(7, Math.max(2, Math.round(sceneWidth / 60)));
}

/**
 * The clouds for a scene. Rows spread evenly down the sky lane, and bigger
 * clouds sit lower and move a little faster, which reads as depth.
 */
export function titleClouds(scene: TitleScene): CloudSpec[] {
  const { top, bottom } = scene.skyLane;
  const count = cloudCount(scene.width);
  const clouds: CloudSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    const depth = count === 1 ? 0.5 : i / (count - 1);
    const shape = Math.min(TITLE_CLOUD_ART.length - 1, Math.floor(depth * TITLE_CLOUD_ART.length));
    const art = TITLE_CLOUD_ART[shape] ?? [];
    const row = Math.round(top + depth * Math.max(0, bottom - top - art.length));
    clouds.push({
      shape,
      row,
      start: (hash(i, 5) % 1000) / 1000,
      speed: 0.05 + 0.04 * depth,
    });
  }
  return clouds;
}

/** Left edge of something drifting right across the scene, wrapping round. */
export function driftX(
  start: number,
  speed: number,
  tick: number,
  sceneWidth: number,
  spriteWidth: number,
): number {
  const span = sceneWidth + spriteWidth;
  const raw = Math.round(start * span + tick * speed);
  return (((raw % span) + span) % span) - spriteWidth;
}

/** The flock crosses, then the sky stays empty for a while before it returns. */
const FLOCK = {
  speed: 0.6,
  gap: 220,
  /** Leader first, then the two wings of the V, offset back and up/down. */
  members: [
    { dx: 0, dy: 0 },
    { dx: -7, dy: -3 },
    { dx: -7, dy: 3 },
    { dx: -14, dy: -6 },
  ],
} as const;

export interface BirdPose {
  x: number;
  y: number;
  frame: 0 | 1;
}

/** Where each bird is at this tick (some may be off screen). */
export function flockAt(scene: TitleScene, tick: number): BirdPose[] {
  const { top, bottom } = scene.skyLane;
  const row = Math.round(top + (bottom - top) * 0.35);
  const span = scene.width + FLOCK.gap;
  const leader = Math.floor((tick * FLOCK.speed) % span) - BIRD_WIDTH;
  return FLOCK.members.map((member, index) => ({
    x: leader + member.dx,
    y: row + member.dy,
    frame: Math.floor(tick / 2 + index) % 2 === 0 ? 0 : 1,
  }));
}

/** A shooting star every so often, burning for a few ticks. */
const SHOOTING_STAR = { every: 75, burns: 9, trail: 5, step: 2 } as const;

export interface ShootingStar {
  /** Head position; the trail runs up and to the right of it. */
  x: number;
  y: number;
  trail: number;
}

/**
 * The shooting star at this tick, or null. It falls down-left through the
 * high sky, on one side or the other, never across the logo.
 */
export function shootingStarAt(scene: TitleScene, tick: number): ShootingStar | null {
  const cycle = Math.floor(tick / SHOOTING_STAR.every);
  const age = tick % SHOOTING_STAR.every;
  if (age >= SHOOTING_STAR.burns) return null;
  const side = hash(cycle, 3) % 2 === 0 ? -1 : 1;
  // Its whole path (head start to tail end) stays on one side of the logo.
  const travel = SHOOTING_STAR.burns * SHOOTING_STAR.step;
  const reach = (SHOOTING_STAR.trail + 1) * 2;
  const mid = Math.floor(scene.width / 2);
  const clear = logoClearHalf(scene.width);
  const [low, high] =
    side < 0 ? [4 + travel, mid - clear - reach] : [mid + clear + travel, scene.width - reach - 2];
  // No room beside the logo (a phone): no shooting star rather than one across the title.
  if (high <= low) return null;
  const startX = low + (hash(cycle, 7) % (high - low));
  const startY = 4 + (hash(cycle, 11) % Math.max(1, Math.floor(scene.skyLane.top / 2)));
  return {
    x: startX - age * SHOOTING_STAR.step,
    y: startY + age,
    trail: SHOOTING_STAR.trail,
  };
}

/** The shooting star as art: a bright head and a fading diagonal trail. */
export function shootingStarArt(trail: number): string[] {
  const size = trail + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size * 2 }, (_, col) => {
      // Head at bottom-left; the trail climbs two across for each row up.
      const along = size - 1 - row;
      if (col === along * 2 || col === along * 2 + 1) return along === 0 ? '+' : '*';
      return '.';
    }).join(''),
  );
}

/** Scene characters that are sky: everything that moves passes in front of these. */
export const TITLE_SKY_CHARS = new Set(['a', 'b', 'c', '*', '+', 'M', 'm', 'j', 'z', 'i', 'l']);

/**
 * The scene with its sky cut out, drawn over the clouds and birds so they
 * pass behind the castle, the hills and the town.
 */
export function titleForeground(art: readonly string[]): string[] {
  return art.map((line) =>
    Array.from(line, (char) => (TITLE_SKY_CHARS.has(char) ? '.' : char)).join(''),
  );
}

/** A cloud in the high sky beside the logo, drifting to and fro within its side. */
export interface HighCloudSpec {
  shape: number;
  row: number;
  /** Leftmost and rightmost x it may reach. */
  from: number;
  to: number;
  /** Phase along its to-and-fro, in scene pixels. */
  phase: number;
  speed: number;
}

/** Clears the sun or moon (top right) by this many rows. */
const SUN_CLEAR_ROWS = 40;

/**
 * Wide scenes only: two clouds on each side of the logo in the high sky.
 * They drift back and forth and never cross the title.
 */
export function titleHighClouds(scene: TitleScene): HighCloudSpec[] {
  if (scene.width < WIDE_SCENE_COLS) return [];
  const midX = Math.floor(scene.width / 2);
  const clear = logoClearHalf(scene.width);
  const ceiling = 8;
  const floor = scene.skyLane.top - 6;
  const sides = [
    { from: 2, to: midX - clear - 2, minRow: ceiling },
    { from: midX + clear + 2, to: scene.width - 2, minRow: SUN_CLEAR_ROWS },
  ];
  const clouds: HighCloudSpec[] = [];
  sides.forEach((side, sideIndex) => {
    [0.15, 0.7].forEach((depth, index) => {
      const shape = index === 0 ? 2 : 3;
      const art = TITLE_CLOUD_ART[shape] ?? [];
      const cloudWidth = art[0]?.length ?? 0;
      const top = Math.max(side.minRow, ceiling);
      const row = Math.round(top + depth * (floor - top - art.length));
      if (row < top || row + art.length > floor || side.to - side.from < cloudWidth + 4) return;
      clouds.push({
        shape,
        row,
        from: side.from,
        to: side.to - cloudWidth,
        phase: hash(sideIndex * 2 + index, 9) % 200,
        speed: 0.04 + 0.02 * index,
      });
    });
  });
  return clouds;
}

/** Left edge of a high cloud at this tick: to and fro between `from` and `to`. */
export function highCloudX(cloud: HighCloudSpec, tick: number): number {
  const range = Math.max(1, cloud.to - cloud.from);
  const travelled = Math.round(cloud.phase + tick * cloud.speed) % (range * 2);
  return cloud.from + (travelled <= range ? travelled : range * 2 - travelled);
}
