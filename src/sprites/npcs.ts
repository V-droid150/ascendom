/**
 * The townsfolk who stroll across the title screen's courtyard.
 *
 * Side-on chibi sprites, 12x21 before the outline, facing right. Each kind
 * has a full first frame and a second set of bottom rows (legs or hem), so a
 * walk cycle is two frames. Walking left is the same art mirrored.
 *
 * Colours are swapped per NPC, like the hero's skin and hair, so two guards
 * can wear different tabards without a second drawing.
 *
 * Positions are a pure function of a tick count (`npcPoseAt`), so the parade
 * is deterministic and the component only has to count ticks.
 */

import { PALETTE } from '@/theme/colors';
import { hairColor, skinTone } from './palette';
import { withOutline } from './scenes';

export type NpcKind = 'guard' | 'lady' | 'peasant' | 'king' | 'hound';
export type NpcDirection = 1 | -1;

interface NpcDrawing {
  /** Frame 0, top to bottom. */
  frame: readonly string[];
  /** Replaces the last rows of frame 0 to make frame 1. */
  stride: readonly string[];
}

/*
 * Alphabet: s skin, e eye, h hair (fur for the hound), a/A outfit and shade,
 * b trim, c/C hat or crown and shade, g gem, m/M steel and shade, w ermine,
 * t spear tip or sceptre, p wood, l hose, f boots, q/Q sack and shade.
 */
const DRAWINGS: Readonly<Record<NpcKind, NpcDrawing>> = {
  guard: {
    frame: [
      '...........t',
      '..........tt',
      '...........p',
      '...mmmmmm..p',
      '..mmmmmmmm.p',
      '.mmmmmmmmmmp',
      '.MMMMMMMMMMp',
      '.Mhhhssssesp',
      '.Mhhhssssssp',
      '..hhhsssss.p',
      '...hhssss..p',
      '.....ss....p',
      '...aaaaa...p',
      '..aaaaaaa..p',
      '..aaAAAAAssp',
      '..aabbbaa..p',
      '..aaabaaa..p',
      '..aaaaaaa..p',
      '...ll.ll...p',
      '..ll...ll..p',
      '..ff...fff..',
    ],
    stride: ['....lll....p', '....lll....p', '....ffff....'],
  },
  lady: {
    frame: [
      '............',
      '............',
      '.....c.c....',
      '.hh.ccgcc...',
      'hhhhhhhhhh..',
      'hhhhhhhhhhh.',
      '.hhhhhsssss.',
      '..hhhsssses.',
      '..hhhssssss.',
      '..hhhsssss..',
      '..hhhhssss..',
      '..hhh.ss....',
      '..hhaaaaa...',
      '...aaaaaaa..',
      '...aaAAAss..',
      '...abbbbaa..',
      '..aaaaaaaa..',
      '..aaaaaaaaa.',
      '.aaaaaaaaaa.',
      '.aaaaaaaaaaa',
      '.AAAAAAAAff.',
    ],
    stride: ['..aaaaaaaaa.', '.aaaaaaaaaa.', '.AAAAAAAAAA.'],
  },
  peasant: {
    frame: [
      '............',
      '............',
      '............',
      '....cccc....',
      '...cccccc...',
      'CCCCCCCCCCC.',
      '.hhhhhsssss.',
      '.hhhhsssses.',
      '.hhhhssssss.',
      '..hhhsssss..',
      '...hhssss...',
      'qq...ss.....',
      'qqqqaaaaa...',
      'qqqaaaaaaa..',
      'qqqaaAAaas..',
      'QQQbbbbbb...',
      '.QQaaaaaa...',
      '...aaaaaa...',
      '...ll.ll....',
      '..ll...ll...',
      '..ff...fff..',
    ],
    stride: ['....lll.....', '....lll.....', '....ffff....'],
  },
  king: {
    frame: [
      '............',
      '....c.c.c...',
      '....cgcgc...',
      '...hcccccc..',
      '..hhhhhhhhh.',
      '.hhhhhhhhhh.',
      '.hhhhhsssss.',
      '.hhhhsssses.',
      '.hhhhssssss.',
      '..hhhssshhh.',
      '..hhhhhhhh..',
      '...hhhhhh.g.',
      '.wwwwwwwww.t',
      '.aawwwwwaa.t',
      '.aaaaaaaasst',
      '.aaAaaaaaa.t',
      'aaaAaaaaaa..',
      'aaaAaaaaaaa.',
      'aaaAaaaaaaa.',
      'aaaaaaaaaaa.',
      '.AAAAAAAff..',
    ],
    stride: ['aaaAaaaaaa..', 'aaaaaaaaaaa.', '.AAAAAAAAA..'],
  },
  hound: {
    frame: [
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '........h...',
      '.......hhhh.',
      '.......hhehh',
      'h......bhhh.',
      '.hhhhhhhhh..',
      '..hhhhhhhh..',
      '..h.h..h.h..',
      '..h.h..h.h..',
    ],
    stride: ['.hh....hh...', 'h..h..h..h..'],
  },
};

export const NPC_KINDS = Object.keys(DRAWINGS) as NpcKind[];

const mirror = (art: readonly string[]): string[] =>
  art.map((line) => [...line].reverse().join(''));

function buildFrames(drawing: NpcDrawing): readonly [readonly string[], readonly string[]] {
  const second = [...drawing.frame.slice(0, -drawing.stride.length), ...drawing.stride];
  return [withOutline(drawing.frame, 'k'), withOutline(second, 'k')];
}

/** Every frame, built once: kind → direction → frame. */
const FRAMES: Readonly<
  Record<NpcKind, Readonly<Record<NpcDirection, readonly [readonly string[], readonly string[]]>>>
> = Object.fromEntries(
  NPC_KINDS.map((kind) => {
    const right = buildFrames(DRAWINGS[kind]);
    const left = [mirror(right[0]), mirror(right[1])] as const;
    return [kind, { 1: right, [-1]: left }];
  }),
) as never;

/** Width of every NPC frame, outline included. */
export const NPC_WIDTH = 14;
/** Height of every NPC frame, outline included. Feet sit on the last row. */
export const NPC_HEIGHT = 23;

export function npcArt(kind: NpcKind, direction: NpcDirection, frame: 0 | 1): readonly string[] {
  return FRAMES[kind][direction][frame];
}

export interface NpcSpec {
  id: string;
  kind: NpcKind;
  lane: 'back' | 'front';
  direction: NpcDirection;
  /** Scene pixels per tick: 1 strolls, 0.5 is a stately pace. */
  speed: number;
  /** Where along the walk the NPC starts, 0-1. */
  start: number;
  skinTone: number;
  hairColor: number;
  /** Outfit colour and its shade. */
  outfit: readonly [string, string];
}

/** The courtyard crowd. Ordered back lane first, so the front lane draws over it. */
export const TITLE_NPCS: readonly NpcSpec[] = [
  {
    id: 'guard-red',
    kind: 'guard',
    lane: 'back',
    direction: 1,
    speed: 0.5,
    start: 0.1,
    skinTone: 2,
    hairColor: 0,
    outfit: [PALETTE[2], '#7a2638'],
  },
  {
    id: 'lady',
    kind: 'lady',
    lane: 'back',
    direction: -1,
    speed: 0.5,
    start: 0.55,
    skinTone: 0,
    hairColor: 2,
    outfit: ['#c94a7d', '#8f2f5a'],
  },
  {
    id: 'guard-blue',
    kind: 'guard',
    lane: 'back',
    direction: -1,
    speed: 0.5,
    start: 0.9,
    skinTone: 4,
    hairColor: 1,
    outfit: [PALETTE[9], PALETTE[8]],
  },
  {
    id: 'peasant',
    kind: 'peasant',
    lane: 'front',
    direction: 1,
    speed: 1,
    start: 0.35,
    skinTone: 3,
    hairColor: 1,
    outfit: [PALETTE[6], '#1d6b3c'],
  },
  {
    id: 'king',
    kind: 'king',
    lane: 'front',
    direction: -1,
    speed: 0.5,
    start: 0.7,
    skinTone: 1,
    hairColor: 4,
    outfit: [PALETTE[2], '#7a2638'],
  },
  {
    id: 'hound',
    kind: 'hound',
    lane: 'front',
    direction: -1,
    speed: 0.5,
    start: 0.79,
    skinTone: 0,
    hairColor: 1,
    outfit: [PALETTE[2], PALETTE[2]],
  },
];

/** The colour map for one NPC: shared accents plus its own skin, hair and outfit. */
export function npcColors(spec: NpcSpec): Readonly<Record<string, string>> {
  const skin = skinTone(spec.skinTone);
  const hair = hairColor(spec.hairColor);
  return {
    k: PALETTE[0],
    s: skin.base,
    e: PALETTE[0],
    h: spec.kind === 'hound' ? '#a3663c' : hair.base,
    a: spec.outfit[0],
    A: spec.outfit[1],
    b: spec.kind === 'hound' ? PALETTE[2] : PALETTE[4],
    c: PALETTE[4],
    C: '#c99b47',
    g: spec.kind === 'king' ? PALETTE[10] : PALETTE[2],
    m: PALETTE[13],
    M: PALETTE[14],
    w: PALETTE[12],
    t: spec.kind === 'king' ? PALETTE[4] : PALETTE[12],
    p: '#8a5a2b',
    l: PALETTE[15],
    f: '#492c18',
    q: '#c9a86a',
    Q: '#8a6d3b',
  };
}

export interface NpcPose {
  /** Left edge of the frame, in scene pixels; may be off either side. */
  x: number;
  frame: 0 | 1;
}

/**
 * Where an NPC is after `tick` ticks. It walks off one side and comes back on
 * the other, and its legs change every two steps.
 */
export function npcPoseAt(spec: NpcSpec, tick: number, sceneWidth: number): NpcPose {
  const span = sceneWidth + NPC_WIDTH;
  const steps = Math.floor(tick * spec.speed);
  const raw = Math.round(spec.start * span) + spec.direction * steps;
  const x = (((raw % span) + span) % span) - NPC_WIDTH;
  return { x, frame: Math.floor(steps / 2) % 2 === 0 ? 0 : 1 };
}
