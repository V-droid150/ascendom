import {
  logoClearHalf,
  paintTitleScene,
  TITLE_DAY_COLORS,
  TITLE_NIGHT_COLORS,
} from '../titleScene';
import {
  cloudCount,
  driftX,
  flockAt,
  highCloudX,
  shootingStarArt,
  shootingStarAt,
  TITLE_BIRD_ART,
  TITLE_CLOUD_ART,
  TITLE_SKY_CHARS,
  titleClouds,
  titleForeground,
  titleHighClouds,
} from '../titleSky';

const PHONE = paintTitleScene(130, 253);
const DESKTOP = paintTitleScene(360, 225, 70);

describe('sky art', () => {
  it('draws every cloud and bird frame as a rectangle in both palettes', () => {
    for (const art of [...TITLE_CLOUD_ART, ...TITLE_BIRD_ART]) {
      const width = art[0]?.length ?? 0;
      for (const line of art) {
        expect(line).toHaveLength(width);
        for (const char of line) {
          if (char === '.') continue;
          expect(TITLE_NIGHT_COLORS[char]).toBeDefined();
          expect(TITLE_DAY_COLORS[char]).toBeDefined();
        }
      }
    }
  });

  it('paints the wide extras only on wide scenes', () => {
    const wide = DESKTOP.art.join('');
    for (const char of ['x', 'X', 'L', 'l', 'z']) expect(wide).toContain(char);
    expect(PHONE.art.join('')).not.toContain('L');
    expect(PHONE.art.join('')).not.toContain('l');
  });

  it('keeps the galaxy and cirrus out of the logo column', () => {
    const mid = Math.floor(DESKTOP.width / 2);
    const half = logoClearHalf(DESKTOP.width);
    for (const line of DESKTOP.art.slice(0, DESKTOP.skyLane.top - 2)) {
      for (const char of line.slice(mid - half, mid + half)) {
        expect(['i', 'l', '+']).not.toContain(char);
      }
    }
  });
});

describe('the foreground cut-out', () => {
  it('removes exactly the sky, so moving things pass behind the castle', () => {
    const cut = titleForeground(PHONE.art);
    PHONE.art.forEach((line, y) => {
      [...line].forEach((char, x) => {
        expect(cut[y]?.[x]).toBe(TITLE_SKY_CHARS.has(char) ? '.' : char);
      });
    });
  });
});

describe('drifting clouds', () => {
  it('keeps two on a phone and adds more on wider scenes, up to seven', () => {
    expect(cloudCount(130)).toBe(2);
    expect(cloudCount(360)).toBe(6);
    expect(cloudCount(2000)).toBe(7);
  });

  it('stay inside the sky lane', () => {
    for (const scene of [PHONE, DESKTOP]) {
      for (const cloud of titleClouds(scene)) {
        const height = TITLE_CLOUD_ART[cloud.shape]?.length ?? 0;
        expect(cloud.row).toBeGreaterThanOrEqual(scene.skyLane.top);
        expect(cloud.row + height).toBeLessThanOrEqual(
          Math.max(scene.skyLane.bottom, scene.skyLane.top + height),
        );
      }
    }
  });

  it('wrap round the scene', () => {
    expect(driftX(0, 1, 0, 100, 10)).toBe(-10);
    expect(driftX(0, 1, 50, 100, 10)).toBe(40);
    expect(driftX(0, 1, 110, 100, 10)).toBe(-10);
  });
});

describe('high clouds beside the logo', () => {
  it('only appear on wide scenes', () => {
    expect(titleHighClouds(PHONE)).toEqual([]);
    expect(titleHighClouds(DESKTOP).length).toBeGreaterThan(0);
  });

  it('never cross into the logo column, at any tick', () => {
    const mid = Math.floor(DESKTOP.width / 2);
    const half = logoClearHalf(DESKTOP.width);
    for (const cloud of titleHighClouds(DESKTOP)) {
      const width = TITLE_CLOUD_ART[cloud.shape]?.[0]?.length ?? 0;
      for (let tick = 0; tick < 6000; tick += 37) {
        const x = highCloudX(cloud, tick);
        const overlaps = x < mid + half && x + width > mid - half;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe('birds and shooting stars', () => {
  it('fly the flock in a V that flaps', () => {
    const flock = flockAt(DESKTOP, 40);
    expect(flock).toHaveLength(4);
    expect(new Set(flockAt(DESKTOP, 0).map((bird) => bird.frame)).size).toBe(2);
  });

  it('only burn a shooting star for a few ticks of each cycle', () => {
    const lit = Array.from({ length: 75 }, (_, tick) => shootingStarAt(DESKTOP, tick) !== null);
    expect(lit.filter(Boolean)).toHaveLength(9);
  });

  it('keeps shooting stars away from the logo column', () => {
    const mid = Math.floor(DESKTOP.width / 2);
    const half = logoClearHalf(DESKTOP.width);
    for (let tick = 0; tick < 75 * 40; tick += 1) {
      const star = shootingStarAt(DESKTOP, tick);
      if (!star) continue;
      const right = star.x + (star.trail + 1) * 2;
      expect(star.x >= mid + half || right <= mid - half).toBe(true);
    }
  });

  it('skips shooting stars where there is no room beside the logo', () => {
    for (let tick = 0; tick < 75 * 10; tick += 1) expect(shootingStarAt(PHONE, tick)).toBeNull();
  });

  it('draws a star with its head at the bottom left', () => {
    const art = shootingStarArt(3);
    expect(art[3]?.startsWith('+')).toBe(true);
    expect(art[0]?.endsWith('**')).toBe(true);
  });
});
