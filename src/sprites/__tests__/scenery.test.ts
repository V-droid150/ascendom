import { COSMETICS } from '@/engine/constants';
import { SPRITE_OUTLINE } from '../compose';
import { SHOP_ITEM_ART, shopItemArt } from '../items';
import { TAB_ICONS } from '../tabIcons';
import {
  LANDSCAPE_ART,
  LANDSCAPE_COLORS,
  LANDSCAPE_HEIGHT,
  LANDSCAPE_HERO_ANCHOR,
  LANDSCAPE_WIDTH,
} from '../landscape';
import { SPRITE_SIZE } from '../types';
import {
  WARDROBE_ART,
  WARDROBE_COLORS,
  WARDROBE_HEIGHT,
  WARDROBE_HERO_ANCHOR,
  WARDROBE_WIDTH,
} from '../wardrobe';

describe('the hero landscape', () => {
  it('is a full 64x40 grid', () => {
    expect(LANDSCAPE_ART).toHaveLength(LANDSCAPE_HEIGHT);
    for (const line of LANDSCAPE_ART) expect(line).toHaveLength(LANDSCAPE_WIDTH);
  });

  it('has no transparent holes and no unmapped characters', () => {
    for (const line of LANDSCAPE_ART) {
      for (const char of line) expect(LANDSCAPE_COLORS[char]).toBeDefined();
    }
  });

  it('contains a sun, snow, castles and grass', () => {
    const all = LANDSCAPE_ART.join('');
    for (const char of ['y', 's', 'c', 'r', 'g']) expect(all).toContain(char);
  });

  it('fits the hero sprite box inside the scene', () => {
    expect(LANDSCAPE_HERO_ANCHOR.x + SPRITE_SIZE).toBeLessThanOrEqual(LANDSCAPE_WIDTH);
    expect(LANDSCAPE_HERO_ANCHOR.y + SPRITE_SIZE).toBeLessThanOrEqual(LANDSCAPE_HEIGHT);
  });

  it('stands the hero on grass, not in the sky', () => {
    // The sprite's shadow is on its row 28.
    const groundRow = LANDSCAPE_ART[LANDSCAPE_HERO_ANCHOR.y + 28] ?? '';
    const underFeet = groundRow[LANDSCAPE_HERO_ANCHOR.x + SPRITE_SIZE / 2] ?? '';
    expect(['g', 'l', 'd']).toContain(underFeet);
  });
});

describe('shop item art', () => {
  it.each(Object.entries(SHOP_ITEM_ART))('%s has rows of equal width', (_name, art) => {
    const width = art[0]?.length ?? 0;
    expect(width).toBeGreaterThan(0);
    for (const line of art) expect(line).toHaveLength(width);
  });

  it('gives every item a picture whose characters all resolve to a colour', () => {
    for (const id of ['shield', 'potion', ...COSMETICS.map((c) => c.id)]) {
      const { art, colors } = shopItemArt(id);
      for (const line of art) {
        for (const char of line) if (char !== '.') expect(colors[char]).toBeDefined();
      }
    }
  });

  it('outlines every item like the hero sprites', () => {
    expect(shopItemArt('potion').colors.k).toBe(SPRITE_OUTLINE);
    for (const art of Object.values(SHOP_ITEM_ART)) expect(art.join('')).toContain('k');
  });

  it('colours each cosmetic from its own palette entry', () => {
    const capes = COSMETICS.filter((c) => c.slot === 'cape').map((c) => shopItemArt(c.id));
    expect(new Set(capes.map((item) => item.colors.c)).size).toBe(capes.length);
    expect(shopItemArt('cape_crimson').art).toBe(SHOP_ITEM_ART.cape);
    expect(shopItemArt('tint_gold').art).toBe(SHOP_ITEM_ART.sheen);
  });

  it('falls back to the shield for an unknown id', () => {
    expect(shopItemArt('nope').art).toBe(SHOP_ITEM_ART.shield);
  });
});

describe('tab icon art', () => {
  it.each(Object.entries(TAB_ICONS))(
    '%s is rectangular, outlined and fully coloured',
    (_name, icon) => {
      const width = icon.art[0]?.length ?? 0;
      for (const line of icon.art) {
        expect(line).toHaveLength(width);
        for (const char of line) if (char !== '.') expect(icon.colors[char]).toBeDefined();
      }
      expect(icon.art.join('')).toContain('k');
    },
  );
});

describe('the royal wardrobe', () => {
  it('is a full grid the same size as the landscape', () => {
    expect(WARDROBE_ART).toHaveLength(WARDROBE_HEIGHT);
    for (const line of WARDROBE_ART) expect(line).toHaveLength(WARDROBE_WIDTH);
    expect(WARDROBE_WIDTH).toBe(LANDSCAPE_WIDTH);
    expect(WARDROBE_HEIGHT).toBe(LANDSCAPE_HEIGHT);
  });

  it('has no transparent holes and no unmapped characters', () => {
    for (const line of WARDROBE_ART) {
      for (const char of line) expect(WARDROBE_COLORS[char]).toBeDefined();
    }
  });

  it('stands the hero on the red carpet', () => {
    const groundRow = WARDROBE_ART[WARDROBE_HERO_ANCHOR.y + 28] ?? '';
    const underFeet = groundRow[WARDROBE_HERO_ANCHOR.x + SPRITE_SIZE / 2] ?? '';
    expect(['p', 'q']).toContain(underFeet);
  });

  it('keeps the wall above the hero bare', () => {
    const centre = WARDROBE_HERO_ANCHOR.x + SPRITE_SIZE / 2;
    for (let y = 3; y < WARDROBE_HERO_ANCHOR.y; y += 1) {
      const wall = (WARDROBE_ART[y] ?? '').slice(centre - 8, centre + 8);
      expect(wall).toMatch(/^[wvk]+$/);
    }
  });
});
