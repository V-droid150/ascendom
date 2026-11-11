import {
  NPC_HEIGHT,
  NPC_KINDS,
  NPC_WIDTH,
  npcArt,
  npcColors,
  npcPoseAt,
  TITLE_NPCS,
  type NpcSpec,
} from '../npcs';
import {
  isDaytimeHour,
  paintTitleScene,
  SPIRE_FLAG_ROWS,
  SPIRE_TOP,
  TITLE_DAY_COLORS,
  TITLE_LANE_ROWS,
  TITLE_NIGHT_COLORS,
  TITLE_NPC_LANES,
  titleCourtyardClearance,
  titleSceneScaleFor,
} from '../titleScene';

const SIZES: [number, number][] = [
  [130, 253], // iPhone, scale 3
  [120, 225], // desktop window, scale 4
  [64, 120], // the smallest it paints
  [160, 330],
];

// Sky and its decoration (halo, galaxy haze, cirrus): never castle.
const SKY = new Set(['a', 'b', 'c', '*', '+', 'M', 'm', 'j', 'z', 'i', 'l']);

describe('the title scene', () => {
  it.each(SIZES)('fills a %ix%i grid exactly', (width, height) => {
    const scene = paintTitleScene(width, height);
    expect(scene.art).toHaveLength(height);
    for (const line of scene.art) expect(line).toHaveLength(width);
    expect(scene.groundY).toBe(height - TITLE_LANE_ROWS);
  });

  it('never paints smaller than its minimum', () => {
    const scene = paintTitleScene(10, 10);
    expect(scene.width).toBe(64);
    expect(scene.height).toBe(120);
  });

  it.each(SIZES)('maps every pixel in both palettes at %ix%i', (width, height) => {
    for (const line of paintTitleScene(width, height).art) {
      for (const char of line) {
        expect(TITLE_NIGHT_COLORS[char]).toBeDefined();
        expect(TITLE_DAY_COLORS[char]).toBeDefined();
      }
    }
  });

  it.each(SIZES)('keeps the logo area to plain sky at %ix%i', (width, height) => {
    const { art } = paintTitleScene(width, height);
    // The spire's flag rises six pixels above its tip.
    const wallTop = height - TITLE_LANE_ROWS - 22;
    const tip = Math.min(Math.floor(height * SPIRE_TOP), wallTop - 60);
    const clearRows = tip - SPIRE_FLAG_ROWS;
    for (const line of art.slice(0, clearRows)) {
      for (const char of line) expect(SKY.has(char)).toBe(true);
    }
  });

  it('paints a castle, a gate, torches, banners and lit windows', () => {
    const all = paintTitleScene(130, 253).art.join('');
    for (const char of ['s', 'S', 'g', 'G', 'o', 'f', 'F', 'y', 'n', 'u', 'r']) {
      expect(all).toContain(char);
    }
  });

  it('lays cobbles under both NPC lanes', () => {
    const { art, groundY } = paintTitleScene(130, 253);
    for (const lane of Object.values(TITLE_NPC_LANES)) {
      for (const char of art[groundY + lane] ?? '') expect(['e', 'E']).toContain(char);
    }
  });

  it('is deterministic', () => {
    expect(paintTitleScene(130, 253).art).toEqual(paintTitleScene(130, 253).art);
  });

  it('hides the stars in daylight but not at night', () => {
    expect(TITLE_DAY_COLORS['*']).toBe(TITLE_DAY_COLORS.a);
    expect(TITLE_NIGHT_COLORS['*']).not.toBe(TITLE_NIGHT_COLORS.a);
  });
});

describe('the spire below the logo', () => {
  const firstCastleRow = (art: readonly string[]): number =>
    art.findIndex((line) => [...line].some((char) => !SKY.has(char)));

  it.each([60, 90, 110])('keeps everything above row %i plain sky', (tip) => {
    const { art } = paintTitleScene(130, 253, tip);
    expect(firstCastleRow(art)).toBe(tip - SPIRE_FLAG_ROWS + 1);
  });

  it('never squashes the castle when the logo sits low', () => {
    const { art, groundY } = paintTitleScene(130, 253, 240);
    expect(groundY - firstCastleRow(art)).toBeGreaterThan(60);
  });
});

describe('day and night by the clock', () => {
  it('is day from 06:00 until 18:00', () => {
    expect([5, 6, 12, 17, 18, 23, 0].map(isDaytimeHour)).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });
});

describe('title scene sizing', () => {
  it('uses whole scales from 2 to 4', () => {
    expect(titleSceneScaleFor(300)).toBe(2);
    expect(titleSceneScaleFor(760)).toBe(3);
    expect(titleSceneScaleFor(900)).toBe(4);
    expect(titleSceneScaleFor(2000)).toBe(4);
  });

  it('clears the back lane walkers from head to the courtyard edge', () => {
    const rows = TITLE_LANE_ROWS - TITLE_NPC_LANES.back + NPC_HEIGHT;
    expect(titleCourtyardClearance(760)).toBe(rows * 3);
  });
});

describe('courtyard NPCs', () => {
  it.each(NPC_KINDS)('%s has two same-sized frames each way', (kind) => {
    for (const direction of [1, -1] as const) {
      for (const frame of [0, 1] as const) {
        const art = npcArt(kind, direction, frame);
        expect(art).toHaveLength(NPC_HEIGHT);
        for (const line of art) expect(line).toHaveLength(NPC_WIDTH);
      }
    }
    expect(npcArt(kind, 1, 0)).not.toEqual(npcArt(kind, 1, 1));
  });

  it('walks left as the mirror image of walking right', () => {
    const right = npcArt('guard', 1, 0);
    const left = npcArt('guard', -1, 0);
    right.forEach((line, y) => expect(left[y]).toBe([...line].reverse().join('')));
  });

  it.each(TITLE_NPCS.map((spec) => [spec.id, spec] as const))(
    '%s resolves every pixel to a colour',
    (_id, spec) => {
      const colors = npcColors(spec);
      for (const frame of [0, 1] as const) {
        for (const line of npcArt(spec.kind, spec.direction, frame)) {
          for (const char of line) if (char !== '.') expect(colors[char]).toBeDefined();
        }
      }
    },
  );

  const walker: NpcSpec = { ...(TITLE_NPCS[0] as NpcSpec), direction: 1, speed: 1, start: 0 };

  it('steps one pixel per tick at speed 1, half that at 0.5', () => {
    expect(npcPoseAt(walker, 5, 100).x - npcPoseAt(walker, 4, 100).x).toBe(1);
    const slow = { ...walker, speed: 0.5 };
    expect(npcPoseAt(slow, 10, 100).x - npcPoseAt(slow, 0, 100).x).toBe(5);
  });

  it('changes legs every two steps', () => {
    const frames = [0, 1, 2, 3, 4].map((tick) => npcPoseAt(walker, tick, 100).frame);
    expect(frames).toEqual([0, 0, 1, 1, 0]);
  });

  it('walks off one side and back on the other, in both directions', () => {
    const span = 100 + NPC_WIDTH;
    for (const direction of [1, -1] as const) {
      const spec = { ...walker, direction };
      for (let tick = 0; tick < span * 2; tick += 7) {
        const { x } = npcPoseAt(spec, tick, 100);
        expect(x).toBeGreaterThanOrEqual(-NPC_WIDTH);
        expect(x).toBeLessThan(100);
      }
      expect(npcPoseAt(spec, span, 100).x).toBe(npcPoseAt(spec, 0, 100).x);
    }
  });
});
