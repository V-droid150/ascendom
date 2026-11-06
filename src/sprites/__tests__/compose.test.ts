import { capeLayer } from '../layers/gear';
import { COSMETICS } from '@/engine/constants';
import { composeSprite, composeSpriteCached, SPRITE_OUTLINE, toRects } from '../compose';
import {
  HAIR_COLOR_COUNT,
  SKIN_TONE_COUNT,
  darken,
  hairColor,
  resolveChar,
  skinTone,
} from '../palette';
import { SPRITE_SIZE, type SpriteRequest } from '../types';

const base: SpriteRequest = {
  gender: 'male',
  rank: 1,
  skinTone: 0,
  hairStyle: 0,
  hairColor: 0,
};

describe('palette ramps', () => {
  it('offers at least five skin tones and six hair colours', () => {
    expect(SKIN_TONE_COUNT).toBeGreaterThanOrEqual(5);
    expect(HAIR_COLOR_COUNT).toBeGreaterThanOrEqual(6);
  });

  it('wraps out-of-range indices rather than returning undefined', () => {
    expect(skinTone(SKIN_TONE_COUNT)).toEqual(skinTone(0));
    expect(skinTone(-1)).toEqual(skinTone(SKIN_TONE_COUNT - 1));
    expect(hairColor(HAIR_COLOR_COUNT * 3 + 2)).toEqual(hairColor(2));
  });

  it('gives every ramp three distinct shades', () => {
    for (let i = 0; i < SKIN_TONE_COUNT; i += 1) {
      const ramp = skinTone(i);
      expect(new Set([ramp.base, ramp.shade, ramp.light]).size).toBe(3);
    }
  });

  it('darkens a hex colour', () => {
    expect(darken('#ffffff', 0.5)).toBe('#808080');
    expect(darken('#ffffff', 0)).toBe('#ffffff');
    expect(darken('#000000', 0.5)).toBe('#000000');
  });

  it('leaves a malformed colour alone', () => {
    expect(darken('nope', 0.5)).toBe('nope');
  });
});

describe('resolveChar', () => {
  const ctx = { skin: skinTone(0), hair: hairColor(0) };

  it('maps transparency to null', () => {
    expect(resolveChar('.', ctx)).toBeNull();
  });

  it('maps swap characters to the ramps', () => {
    expect(resolveChar('s', ctx)).toBe(ctx.skin.base);
    expect(resolveChar('S', ctx)).toBe(ctx.skin.shade);
    expect(resolveChar('l', ctx)).toBe(ctx.skin.light);
    expect(resolveChar('r', ctx)).toBe(ctx.hair.base);
    expect(resolveChar('R', ctx)).toBe(ctx.hair.shade);
    expect(resolveChar('L', ctx)).toBe(ctx.hair.light);
  });

  it('maps hex digits to Sweetie 16 entries', () => {
    expect(resolveChar('0', ctx)).toBe('#1a1c2c');
    expect(resolveChar('4', ctx)).toBe('#ffcd75');
    expect(resolveChar('F', ctx)).toBe('#333c57');
  });

  it('maps W to white, since C is taken by the cosmetic shade', () => {
    expect(resolveChar('W', ctx)).toBe('#f4f4f4');
  });

  it('falls back to a default cosmetic colour when none is equipped', () => {
    expect(resolveChar('c', ctx)).toBe('#b13e53');
  });

  it('uses the equipped cosmetic colour when present', () => {
    const withCape = { ...ctx, cosmetic: { base: '#123456', shade: '#0a1a2b' } };
    expect(resolveChar('c', withCape)).toBe('#123456');
    expect(resolveChar('C', withCape)).toBe('#0a1a2b');
  });

  it('returns null for an unknown character', () => {
    expect(resolveChar('~', ctx)).toBeNull();
  });
});

describe('toRects', () => {
  it('merges a horizontal run into a single rect', () => {
    const grid = Array.from({ length: SPRITE_SIZE }, () =>
      Array.from({ length: SPRITE_SIZE }, () => null as string | null),
    );
    for (let x = 4; x < 12; x += 1) (grid[0] as (string | null)[])[x] = '#ff0000';

    const rects = toRects(grid);
    expect(rects).toEqual([{ x: 4, y: 0, width: 8, color: '#ff0000' }]);
  });

  it('splits a run where the colour changes', () => {
    const grid = Array.from({ length: SPRITE_SIZE }, () =>
      Array.from({ length: SPRITE_SIZE }, () => null as string | null),
    );
    (grid[0] as (string | null)[])[0] = '#aaaaaa';
    (grid[0] as (string | null)[])[1] = '#bbbbbb';

    expect(toRects(grid)).toEqual([
      { x: 0, y: 0, width: 1, color: '#aaaaaa' },
      { x: 1, y: 0, width: 1, color: '#bbbbbb' },
    ]);
  });

  it('closes a run that reaches the right edge', () => {
    const grid = Array.from({ length: SPRITE_SIZE }, () =>
      Array.from({ length: SPRITE_SIZE }, () => null as string | null),
    );
    for (let x = 30; x < SPRITE_SIZE; x += 1) (grid[0] as (string | null)[])[x] = '#cccccc';

    expect(toRects(grid)).toEqual([{ x: 30, y: 0, width: 2, color: '#cccccc' }]);
  });

  it('emits nothing for an empty grid', () => {
    const grid = Array.from({ length: SPRITE_SIZE }, () =>
      Array.from({ length: SPRITE_SIZE }, () => null as string | null),
    );
    expect(toRects(grid)).toEqual([]);
  });
});

describe('composeSprite', () => {
  it('produces rects inside the canvas', () => {
    const { rects, size } = composeSprite(base);

    expect(size).toBe(SPRITE_SIZE);
    expect(rects.length).toBeGreaterThan(0);

    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(SPRITE_SIZE);
      expect(rect.y).toBeLessThan(SPRITE_SIZE);
      expect(rect.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('merges runs rather than emitting one rect per pixel', () => {
    const { rects } = composeSprite({ ...base, rank: 6 });
    // A fully-dressed monarch covers several hundred cells; run-length merging
    // has to keep the rect count far below that.
    expect(rects.length).toBeLessThan(260);
  });

  it('renders every gender, rank, skin tone and hair combination', () => {
    for (const gender of ['male', 'female'] as const) {
      for (let rank = 1; rank <= 6; rank += 1) {
        for (let tone = 0; tone < SKIN_TONE_COUNT; tone += 1) {
          for (let style = 0; style < 3; style += 1) {
            for (let color = 0; color < HAIR_COLOR_COUNT; color += 1) {
              const { rects } = composeSprite({
                gender,
                rank,
                skinTone: tone,
                hairStyle: style,
                hairColor: color,
              });
              expect(rects.length).toBeGreaterThan(20);
            }
          }
        }
      }
    }
  });

  it('changes appearance when the skin tone changes', () => {
    const a = composeSprite({ ...base, skinTone: 0 });
    const b = composeSprite({ ...base, skinTone: 3 });
    expect(JSON.stringify(a.rects)).not.toBe(JSON.stringify(b.rects));
  });

  it('changes appearance when the rank changes', () => {
    const peasant = composeSprite({ ...base, rank: 1 });
    const monarch = composeSprite({ ...base, rank: 6 });
    expect(JSON.stringify(peasant.rects)).not.toBe(JSON.stringify(monarch.rects));
  });

  it('shifts the character down one pixel on the second idle frame', () => {
    const still = composeSprite({ ...base, frame: 0 });
    const bobbed = composeSprite({ ...base, frame: 1 });

    const topOf = (sprite: typeof still): number => Math.min(...sprite.rects.map((r) => r.y));

    expect(topOf(bobbed)).toBe(topOf(still) + 1);
  });

  it('keeps the ground shadow in place while the character bobs', () => {
    const lowestRow = (sprite: ReturnType<typeof composeSprite>): number =>
      Math.max(...sprite.rects.map((r) => r.y));

    const still = composeSprite(base);
    const bobbed = composeSprite({ ...base, frame: 1 });
    expect(lowestRow(bobbed)).toBe(lowestRow(still));
    expect(lowestRow(still)).toBe(28);
  });

  it('traces a dark outline around the whole silhouette', () => {
    const sprite = composeSprite(base);
    expect(sprite.rects.some((r) => r.color === SPRITE_OUTLINE)).toBe(true);

    // Every row the hero occupies starts with an outline pixel on the left.
    for (const y of new Set(sprite.rects.map((r) => r.y))) {
      const first = sprite.rects.filter((r) => r.y === y).sort((a, b) => a.x - b.x)[0];
      if (y === 28) continue; // the shadow row, which is not outlined
      expect(first?.color).toBe(SPRITE_OUTLINE);
    }
  });

  it('shows a bought cape at every rank', () => {
    // Emerald, because crimson also appears in the captain's tabard.
    const emerald = COSMETICS.find((c) => c.id === 'cape_emerald');
    const capeColor = '#38b764';
    const usesColor = (sprite: ReturnType<typeof composeSprite>): boolean =>
      sprite.rects.some((r) => r.color.toLowerCase() === capeColor);

    for (const rank of [1, 2, 3, 4, 5, 6]) {
      expect(usesColor(composeSprite({ ...base, rank, cosmetics: [emerald?.id ?? ''] }))).toBe(
        true,
      );
    }
  });

  it('gives the default cape from rank 4 only', () => {
    for (const rank of [1, 2, 3]) expect(capeLayer(rank)).toBeNull();
    for (const rank of [4, 5, 6]) expect(capeLayer(rank)).not.toBeNull();
    expect(capeLayer(1, true)).not.toBeNull();
  });

  it('hangs the cape behind the body rather than over it', () => {
    const emerald = COSMETICS.find((c) => c.id === 'cape_emerald');
    const sprite = composeSprite({ ...base, rank: 4, cosmetics: [emerald?.id ?? ''] });
    // Column 15 on row 17 is the middle of the chest; the cape must not cover it.
    const chest = sprite.rects.find((r) => r.y === 17 && r.x <= 15 && r.x + r.width > 15);
    expect(chest?.color.toLowerCase()).not.toBe('#38b764');
  });

  it('adds an aura outline for a tint cosmetic', () => {
    const tint = COSMETICS.find((c) => c.slot === 'tint');
    const plain = composeSprite(base);
    const tinted = composeSprite({ ...base, cosmetics: [tint?.id ?? ''] });

    expect(tinted.rects.length).toBeGreaterThan(plain.rects.length);
  });

  it('can leave the weapon out, for portraits', () => {
    const armed = composeSprite({ ...base, rank: 2 });
    const unarmed = composeSprite({ ...base, rank: 2, withWeapon: false });
    // The short sword's blade is on column 23; nothing else reaches it.
    const onBladeColumn = (sprite: typeof armed): boolean =>
      sprite.rects.some(
        (r) => r.y === 15 && r.x <= 23 && r.x + r.width > 23 && r.color !== SPRITE_OUTLINE,
      );
    expect(onBladeColumn(armed)).toBe(true);
    expect(onBladeColumn(unarmed)).toBe(false);
    expect(composeSpriteCached({ ...base, withWeapon: false })).not.toBe(composeSpriteCached(base));
  });

  it('ignores an unknown cosmetic id', () => {
    const plain = composeSprite(base);
    const bogus = composeSprite({ ...base, cosmetics: ['not_a_real_item'] });
    expect(JSON.stringify(bogus.rects)).toBe(JSON.stringify(plain.rects));
  });
});

describe('composeSpriteCached', () => {
  it('returns an identical result to the uncached path', () => {
    expect(composeSpriteCached(base)).toEqual(composeSprite(base));
  });

  it('returns the same object on a repeat request', () => {
    const request = { ...base, rank: 5, skinTone: 2 };
    expect(composeSpriteCached(request)).toBe(composeSpriteCached(request));
  });

  it('keys on every field of the request', () => {
    const a = composeSpriteCached({ ...base, hairColor: 1 });
    const b = composeSpriteCached({ ...base, hairColor: 2 });
    expect(a).not.toBe(b);
  });
});
