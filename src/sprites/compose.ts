/**
 * Layer composition.
 *
 * Merges the layer stack into a single character grid, resolves the swap
 * characters to real colours, then emits horizontal runs rather than individual
 * pixels. That last step matters: a 32x32 sprite is 1024 cells, and the sprite
 * lab renders well over a hundred sprites at once. Emitting one SVG rect per
 * pixel would mean ~180,000 nodes; run-length merging typically cuts it to a
 * couple of hundred rects per sprite.
 */

import { COSMETICS } from '@/engine/constants';
import { PALETTE } from '@/theme/colors';
import { bodyLayer, SHADOW_LAYER } from './layers/body';
import { capeLayer, headgearLayer, weaponLayer } from './layers/gear';
import { hairLayer } from './layers/hair';
import { outfitLayer } from './layers/outfits';
import { darken, hairColor, resolveChar, skinTone, TRANSPARENT, type SwapContext } from './palette';
import {
  SPRITE_SIZE,
  type ComposedSprite,
  type SpriteLayer,
  type SpriteRect,
  type SpriteRequest,
  type SpriteSource,
} from './types';

type Grid = (string | null)[][];

function emptyGrid(): Grid {
  return Array.from({ length: SPRITE_SIZE }, () => Array.from({ length: SPRITE_SIZE }, () => null));
}

/** Paints a layer onto the grid; opaque pixels overwrite whatever is beneath. */
function paint(grid: Grid, source: SpriteLayer, ctx: SwapContext): void {
  for (let y = 0; y < SPRITE_SIZE; y += 1) {
    const line = source[y];
    if (!line) continue;

    for (let x = 0; x < SPRITE_SIZE; x += 1) {
      const char = line[x];
      if (!char || char === TRANSPARENT) continue;

      const color = resolveChar(char, ctx);
      if (color) {
        (grid[y] as (string | null)[])[x] = color;
      }
    }
  }
}

/** Shifts the whole grid down by `offset` rows, dropping what falls off. */
function shiftDown(grid: Grid, offset: number): Grid {
  if (offset === 0) return grid;

  const shifted = emptyGrid();
  for (let y = 0; y < SPRITE_SIZE; y += 1) {
    const target = y + offset;
    if (target < 0 || target >= SPRITE_SIZE) continue;
    shifted[target] = [...(grid[y] as (string | null)[])];
  }
  return shifted;
}

/** The traced outline every hero gets, NES style. Sweetie 16's darkest colour. */
export const SPRITE_OUTLINE = PALETTE[0];

/**
 * Adds a 1px ring around the silhouette. Used twice: once for the dark outline
 * every hero gets, then again outside it for the `tint` cosmetics' aura.
 */
function addOutline(grid: Grid, color: string): void {
  const opaque = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < SPRITE_SIZE && y < SPRITE_SIZE && (grid[y]?.[x] ?? null) !== null;

  const additions: [number, number][] = [];

  for (let y = 0; y < SPRITE_SIZE; y += 1) {
    for (let x = 0; x < SPRITE_SIZE; x += 1) {
      if (opaque(x, y)) continue;
      if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1)) {
        additions.push([x, y]);
      }
    }
  }

  for (const [x, y] of additions) {
    (grid[y] as (string | null)[])[x] = color;
  }
}

/**
 * Collapses each row into horizontal runs of one colour.
 *
 * Size-agnostic so the same merge powers both 32x32 character sprites and the
 * wider background scenes.
 */
export function toRects(grid: Grid): SpriteRect[] {
  const rects: SpriteRect[] = [];

  for (let y = 0; y < grid.length; y += 1) {
    const line = grid[y];
    if (!line) continue;

    const width = line.length;
    let runStart = -1;
    let runColor: string | null = null;

    for (let x = 0; x <= width; x += 1) {
      const color = x < width ? (line[x] ?? null) : null;

      if (color !== runColor) {
        if (runColor !== null && runStart >= 0) {
          rects.push({ x: runStart, y, width: x - runStart, color: runColor });
        }
        runColor = color;
        runStart = color === null ? -1 : x;
      }
    }
  }

  return rects;
}

interface CosmeticColors {
  cape?: { base: string; shade: string };
  tint?: string;
}

/** Resolves equipped cosmetic ids into the colours composition cares about. */
function cosmeticColors(ids: readonly string[] | undefined): CosmeticColors {
  if (!ids || ids.length === 0) return {};

  const result: CosmeticColors = {};

  for (const id of ids) {
    const def = COSMETICS.find((c) => c.id === id);
    if (!def) continue;

    const base = PALETTE[def.color] ?? PALETTE[2];
    if (def.slot === 'cape') {
      result.cape = { base, shade: darken(base, 0.35) };
    } else {
      result.tint = base;
    }
  }

  return result;
}

export function composeSprite(request: SpriteRequest): ComposedSprite {
  const cosmetics = cosmeticColors(request.cosmetics);

  const ctx: SwapContext = {
    skin: skinTone(request.skinTone),
    hair: hairColor(request.hairColor),
    ...(cosmetics.cape ? { cosmetic: cosmetics.cape } : {}),
  };

  // Layer order: cape -> body -> outfit -> hair -> headgear -> weapon.
  //
  // The cape goes first so it hangs *behind* the hero: the body covers its
  // middle and only the edges and the part between the legs show, which is how
  // 8-bit RPGs draw a cloak. The weapon goes last so it is held in front.
  //
  // The dark outline is traced around the finished silhouette, so gear and
  // capes are outlined too. A tint aura then goes outside the outline. The
  // shadow is applied after the bob shift so it stays on the ground.
  let character = emptyGrid();

  const cape = capeLayer(request.rank);
  if (cape) paint(character, cape, ctx);

  paint(character, bodyLayer(request.gender), ctx);
  paint(character, outfitLayer(request.gender, request.rank), ctx);
  paint(character, hairLayer(request.gender, request.hairStyle), ctx);
  paint(character, headgearLayer(request.rank), ctx);
  paint(character, weaponLayer(request.rank), ctx);

  addOutline(character, SPRITE_OUTLINE);
  if (cosmetics.tint) addOutline(character, cosmetics.tint);

  character = shiftDown(character, request.frame === 1 ? 1 : 0);

  // Shadow fills only cells the character left empty.
  const shadow = emptyGrid();
  paint(shadow, SHADOW_LAYER, ctx);
  for (let y = 0; y < SPRITE_SIZE; y += 1) {
    for (let x = 0; x < SPRITE_SIZE; x += 1) {
      const shadowCell = shadow[y]?.[x] ?? null;
      if ((character[y]?.[x] ?? null) === null && shadowCell !== null) {
        (character[y] as (string | null)[])[x] = shadowCell;
      }
    }
  }

  return { size: SPRITE_SIZE, rects: toRects(character) };
}

function cacheKey(request: SpriteRequest): string {
  return [
    request.gender,
    request.rank,
    request.skinTone,
    request.hairStyle,
    request.hairColor,
    request.frame ?? 0,
    (request.cosmetics ?? []).join(','),
  ].join('|');
}

const CACHE_LIMIT = 256;
const cache = new Map<string, ComposedSprite>();

/**
 * Memoised composition. Composition is pure, and the sprite lab asks for the
 * same combinations repeatedly while scrolling, so caching avoids recomposing
 * 1024 cells per sprite per frame.
 */
export function composeSpriteCached(request: SpriteRequest): ComposedSprite {
  const key = cacheKey(request);
  const hit = cache.get(key);
  if (hit) return hit;

  const composed = composeSprite(request);

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, composed);

  return composed;
}

/**
 * The code-generated sprite source. Swapping in PNG spritesheets later means
 * writing another `SpriteSource` and changing one provider, not any screen.
 */
export const generatedSpriteSource: SpriteSource = {
  compose: composeSpriteCached,
};
