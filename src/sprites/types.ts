/**
 * The sprite contract.
 *
 * `SpriteSource` is the seam that keeps screens ignorant of how a sprite is
 * produced. Today every sprite is generated from character grids in code;
 * swapping in real PNG spritesheets later means writing a second implementation
 * of this interface, not touching a single screen.
 */

import type { Gender } from '@/types';

export const SPRITE_SIZE = 32;

/** 32 strings of 32 characters. See `palette.ts` for the alphabet. */
export type SpriteLayer = readonly string[];

export interface SpriteRequest {
  gender: Gender;
  /** 1-6. Drives outfit, headgear, weapon and cape. */
  rank: number;
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  /** Equipped cosmetic ids, used for cape and tint overrides. */
  cosmetics?: readonly string[];
  /** Off for portraits, such as the tab icon, where a blade beside the head is clutter. */
  withWeapon?: boolean;
  /** Idle bob frame. Frame 1 shifts the character down one pixel. */
  frame?: 0 | 1;
}

/** A horizontal run of identical pixels, which is what actually gets rendered. */
export interface SpriteRect {
  x: number;
  y: number;
  width: number;
  color: string;
}

export interface ComposedSprite {
  size: number;
  rects: readonly SpriteRect[];
}

export interface SpriteSource {
  compose(request: SpriteRequest): ComposedSprite;
}
