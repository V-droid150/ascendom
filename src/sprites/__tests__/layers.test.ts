/**
 * Structural tests for the sprite art.
 *
 * Pixel art authored in source is easy to get subtly wrong — a row one
 * character short, a stray letter that isn't in the palette alphabet — and the
 * symptom is a silently malformed sprite rather than an error. These tests are
 * the safety net that makes authoring art in code viable at all.
 */

import { BODY_LAYERS, SHADOW_LAYER } from '../layers/body';
import { assertLayer, layer, row, rows } from '../layers/builder';
import { GEAR_LAYERS } from '../layers/gear';
import { HAIR_STYLES, HAIR_STYLE_COUNT, hairLayer } from '../layers/hair';
import { OUTFITS, outfitLayer } from '../layers/outfits';
import { SPRITE_SIZE, type SpriteLayer } from '../types';
import { VALID_SPRITE_CHARS } from '../palette';

const GENDERS = ['male', 'female'] as const;

function allLayers(): [string, SpriteLayer][] {
  const entries: [string, SpriteLayer][] = [['shadow', SHADOW_LAYER]];

  for (const gender of GENDERS) {
    entries.push([`body.${gender}`, BODY_LAYERS[gender]]);

    HAIR_STYLES[gender].forEach((art, i) => entries.push([`hair.${gender}.${i}`, art]));
    OUTFITS[gender].forEach((art, i) => entries.push([`outfit.${gender}.rank${i + 1}`, art]));
  }

  GEAR_LAYERS.HEADGEAR.forEach((art, i) => entries.push([`headgear.rank${i + 1}`, art]));
  GEAR_LAYERS.WEAPONS.forEach((art, i) => entries.push([`weapon.rank${i + 1}`, art]));
  entries.push(['cape', GEAR_LAYERS.CAPE]);

  return entries;
}

describe('the row and layer builders', () => {
  it('pads a single segment out to the full canvas width', () => {
    expect(row([11, 'ssss'])).toHaveLength(SPRITE_SIZE);
    expect(row([11, 'ssss'])).toBe(`${'.'.repeat(11)}ssss${'.'.repeat(17)}`);
  });

  it('places multiple segments at their columns', () => {
    const built = row([2, 'AA'], [28, 'BB']);
    expect(built[2]).toBe('A');
    expect(built[3]).toBe('A');
    expect(built[28]).toBe('B');
    expect(built[29]).toBe('B');
    expect(built[15]).toBe('.');
  });

  it('refuses a segment that runs off the canvas', () => {
    expect(() => row([30, 'AAAA'])).toThrow(/off the 32px canvas/);
    expect(() => row([-1, 'A'])).toThrow(/off the 32px canvas/);
  });

  it('fills unlisted rows with transparency', () => {
    const built = layer({ 5: row([0, 'AA']) });
    expect(built).toHaveLength(SPRITE_SIZE);
    expect(built[0]).toBe('.'.repeat(SPRITE_SIZE));
    expect(built[5]?.startsWith('AA')).toBe(true);
  });

  it('repeats a row across an inclusive range', () => {
    const repeated = rows(3, 5, row([0, 'A']));
    expect(Object.keys(repeated)).toEqual(['3', '4', '5']);
  });

  it('catches a malformed layer', () => {
    expect(() => assertLayer('short-rows', ['...'])).toThrow(/has 1 rows/);
    expect(() =>
      assertLayer(
        'bad-char',
        Array.from({ length: SPRITE_SIZE }, () => 'z'.repeat(SPRITE_SIZE)),
      ),
    ).toThrow(/invalid character "z"/);
  });
});

describe('every authored layer', () => {
  const entries = allLayers();

  it.each(entries)('%s is a valid 32x32 grid', (name, art) => {
    expect(() => assertLayer(name, art)).not.toThrow();
  });

  it('covers every layer kind', () => {
    // 1 shadow + 2 bodies + 6 hair + 12 outfits + 6 headgear + 6 weapons + 1 cape
    expect(entries).toHaveLength(34);
  });

  it('only uses characters from the documented alphabet', () => {
    for (const [, art] of entries) {
      for (const line of art) {
        for (const char of line) {
          expect(VALID_SPRITE_CHARS).toContain(char);
        }
      }
    }
  });
});

describe('layer lookups are total', () => {
  it('returns art for every rank, clamping out-of-range values', () => {
    for (const gender of GENDERS) {
      for (let rank = -2; rank <= 10; rank += 1) {
        expect(() => assertLayer(`outfit-${rank}`, outfitLayer(gender, rank))).not.toThrow();
      }
    }
  });

  it('wraps hair style indices instead of returning undefined', () => {
    for (const gender of GENDERS) {
      for (let style = -5; style <= 10; style += 1) {
        expect(() => assertLayer(`hair-${style}`, hairLayer(gender, style))).not.toThrow();
      }
    }
  });

  it('offers three hair styles per gender', () => {
    expect(HAIR_STYLES.male).toHaveLength(HAIR_STYLE_COUNT);
    expect(HAIR_STYLES.female).toHaveLength(HAIR_STYLE_COUNT);
  });

  it('gives each gender six distinct rank outfits', () => {
    for (const gender of GENDERS) {
      const set = OUTFITS[gender];
      expect(set).toHaveLength(6);
      expect(new Set(set.map((art) => art.join(''))).size).toBe(6);
    }
  });
});
